/* ChromaBrew Color Picker — side panel.
 * Vanilla JS, no build step: chrome://extensions → Load unpacked → this folder.
 * Sampling uses the standard EyeDropper API (no manifest permission);
 * chrome.storage keeps history/settings, chrome.tabs opens the generator. */

/* global chrome */

const DEFAULT_BASE = "https://www.chromabrew.com";
const DEFAULT_HEX = "#47003a";
const HISTORY_LIMIT = 10;
const HEX6 = /^#?[0-9a-f]{6}$/i;
const HEX3 = /^#?[0-9a-f]{3}$/i;

const $ = (id) => document.getElementById(id);

const els = {
  swatch: $("swatch"),
  hex: $("hex"),
  rgb: $("rgb"),
  hsl: $("hsl"),
  copyHex: $("copy-hex"),
  pick: $("pick"),
  open: $("open-generator"),
  auditPage: $("audit-page"),
  form: $("hex-form"),
  input: $("hex-input"),
  history: $("history-list"),
  historyEmpty: $("history-empty"),
  clear: $("clear-history"),
  base: $("generator-url"),
  note: $("dropper-note"),
  toast: $("toast"),
};

let currentHex = DEFAULT_HEX;
let history = [];
let baseUrl = DEFAULT_BASE;
let toastTimer = 0;

/* ---------- storage: chrome.storage.sync, localStorage fallback ---------- */
/* The fallback keeps the panel usable when opened outside the extension
 * (plain browser preview), where chrome.storage does not exist. */

const hasSync =
  typeof chrome !== "undefined" && Boolean(chrome.storage && chrome.storage.sync);

async function load(key, fallback) {
  if (hasSync) {
    const got = await chrome.storage.sync.get(key);
    return Object.prototype.hasOwnProperty.call(got, key) ? got[key] : fallback;
  }
  try {
    const raw = localStorage.getItem(`chromabrew.${key}`);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  if (hasSync) {
    void chrome.storage.sync.set({ [key]: value });
    return;
  }
  try {
    localStorage.setItem(`chromabrew.${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state stays in-memory */
  }
}

/* ---------- color math (mirrors the ChromaBrew engine's conversions) ---------- */

function normalizeHex(value) {
  const v = String(value).trim();
  if (HEX6.test(v)) return `#${v.replace("#", "").toLowerCase()}`;
  if (HEX3.test(v)) {
    const digits = v.replace("#", "");
    const [r, g, b] = digits;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/* ---------- state → UI ---------- */

function render() {
  const { r, g, b } = hexToRgb(currentHex);
  const { h, s, l } = hexToHsl(currentHex);
  els.swatch.style.setProperty("--swatch", currentHex);
  els.hex.textContent = currentHex;
  els.rgb.textContent = `rgb(${r}, ${g}, ${b})`;
  els.hsl.textContent = `hsl(${h}, ${s}%, ${l}%)`;
}

function renderHistory() {
  els.history.textContent = "";
  els.historyEmpty.classList.toggle("hidden", history.length > 0);
  els.clear.classList.toggle("hidden", history.length === 0);
  for (const hex of history) {
    const li = document.createElement("li");
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.style.setProperty("--chip", hex);
    chip.title = `Use ${hex}`;
    chip.setAttribute("aria-label", `Use ${hex}`);
    chip.addEventListener("click", () => setCurrent(hex));
    li.appendChild(chip);
    els.history.appendChild(li);
  }
}

function setCurrent(value, { remember = false } = {}) {
  const hex = normalizeHex(value);
  if (!hex) return false;
  currentHex = hex;
  if (remember) {
    history = [hex, ...history.filter((entry) => entry !== hex)].slice(
      0,
      HISTORY_LIMIT,
    );
    save("history", history);
    renderHistory();
  }
  save("last", hex);
  render();
  return true;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      ta.remove();
    }
  }
  toast(`${label} copied — ${text}`);
}

function generatorUrl() {
  return `${baseUrl.replace(/\/+$/, "")}/design-system?primary=${currentHex.slice(1)}`;
}

function openGenerator() {
  const url = generatorUrl();
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
    return;
  }
  window.open(url, "_blank", "noopener");
}

/* ---------- events ---------- */

els.copyHex.addEventListener("click", () => void copyText(currentHex, "Hex"));

els.pick.addEventListener("click", async () => {
  if (!("EyeDropper" in window)) {
    toast("Screen picking needs Chrome 95+ — paste a hex instead.");
    return;
  }
  try {
    /* open() must start directly from this click: the API requires the
     * picker to launch inside the user's gesture. */
    const result = await new window.EyeDropper().open();
    if (setCurrent(result.sRGBHex, { remember: true })) {
      toast(`Picked ${currentHex}`);
    }
  } catch {
    /* user pressed Escape to cancel */
  }
});

els.open.addEventListener("click", openGenerator);

/* ---------- audit this page ---------- */
/* The bundled audit (content-audit.js, built from src/lib/audit by
 * `npm run audit:bundle`) runs axe-core + the contrast/structure engines in
 * the current tab's isolated world, so the page is measured with the
 * visitor's own session — past Cloudflare, logins and IP allowlists — and
 * nothing leaves the machine. */
els.auditPage.addEventListener("click", async () => {
  try {
    if (
      typeof chrome === "undefined" ||
      !chrome.tabs ||
      !chrome.scripting
    ) {
      toast("Open this panel from the extension to audit a tab.");
      return;
    }
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || tab.id === undefined) {
      toast("No active tab to audit.");
      return;
    }
    if (!/^https?:/i.test(tab.url ?? "")) {
      toast("Open a web page first — this one can't be audited.");
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-audit.js"],
    });
    toast("Audit running — the report lands on the page.");
  } catch {
    toast("This page blocks extensions — try the bookmarklet instead.");
  }
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (setCurrent(els.input.value, { remember: true })) {
    els.input.value = "";
    toast(`Using ${currentHex}`);
  } else {
    toast("Enter a 6-digit hex like 47003a.");
  }
});

/* Live preview while typing; Enter (submit) is what records history. */
els.input.addEventListener("input", () => {
  setCurrent(els.input.value);
});

els.clear.addEventListener("click", () => {
  history = [];
  save("history", history);
  renderHistory();
});

els.base.addEventListener("change", () => {
  const value = els.base.value.trim().replace(/\/+$/, "");
  if (/^https?:\/\//.test(value)) {
    baseUrl = value;
    save("base", value);
    toast("Generator URL saved.");
  } else {
    els.base.value = baseUrl;
    toast("URL must start with http:// or https://");
  }
});

/* ---------- init ---------- */

void (async () => {
  const [storedBase, storedHistory, storedLast] = await Promise.all([
    load("base", DEFAULT_BASE),
    load("history", []),
    load("last", null),
  ]);
  if (typeof storedBase === "string" && /^https?:\/\//.test(storedBase)) {
    baseUrl = storedBase.replace(/\/+$/, "");
  }
  history = (Array.isArray(storedHistory) ? storedHistory : [])
    .map((entry) => normalizeHex(entry))
    .filter((entry) => entry !== null)
    .slice(0, HISTORY_LIMIT);
  els.base.value = baseUrl;
  setCurrent(typeof storedLast === "string" ? storedLast : DEFAULT_HEX);
  renderHistory();

  if (!("EyeDropper" in window)) {
    els.pick.disabled = true;
    els.note.textContent =
      "Screen picking needs Chrome 95+ — paste a hex below instead.";
  }
})();
