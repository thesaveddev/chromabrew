/**
 * Reference brand colour palette.
 *
 * These are the widely published "brand colours" for a curated set of
 * recognisable companies, intended as seed colours for palette/design-system
 * generation. Values are well-known references, NOT official brand
 * guidelines — designers should confirm the current values against the
 * brand's published materials before shipping anything in their identity.
 *
 * When a brand uses several strong colours (multi-hue marks, gradients)
 * the most commonly cited single anchor colour is used here.
 */

export interface BrandPalette {
  name: string;
  hex: string;
  sector: string;
}

export const BRAND_SECTORS = [
  "SaaS & tech",
  "Social",
  "Streaming & media",
  "Finance & payments",
  "Ecommerce",
  "Travel & delivery",
  "Healthcare & public",
  "Food & drink",
  "Sport",
  "Design & creative",
] as const;

export const BRAND_PALETTES: BrandPalette[] = [
  /* SaaS & tech */
  { name: "Slack", hex: "#4A154B", sector: "SaaS & tech" },
  { name: "Microsoft Teams", hex: "#6264A7", sector: "SaaS & tech" },
  { name: "Zoom", hex: "#2D8CFF", sector: "SaaS & tech" },
  { name: "Atlassian", hex: "#0052CC", sector: "SaaS & tech" },
  { name: "Stripe", hex: "#635BFF", sector: "SaaS & tech" },
  { name: "Asana", hex: "#F06A6A", sector: "SaaS & tech" },
  { name: "Notion", hex: "#1D1D1D", sector: "SaaS & tech" },
  { name: "Linear", hex: "#5E6AD2", sector: "SaaS & tech" },
  { name: "GitHub", hex: "#181717", sector: "SaaS & tech" },
  { name: "GitLab", hex: "#FC6D26", sector: "SaaS & tech" },
  { name: "Vercel", hex: "#000000", sector: "SaaS & tech" },
  { name: "MongoDB", hex: "#47A248", sector: "SaaS & tech" },
  { name: "Postman", hex: "#FF6C37", sector: "SaaS & tech" },
  { name: "Cloudflare", hex: "#F38020", sector: "SaaS & tech" },
  { name: "DigitalOcean", hex: "#0080FF", sector: "SaaS & tech" },
  { name: "WordPress", hex: "#21759B", sector: "SaaS & tech" },
  { name: "Drupal", hex: "#0678BE", sector: "SaaS & tech" },
  { name: "Squarespace", hex: "#000000", sector: "SaaS & tech" },
  { name: "Wix", hex: "#FAAD4D", sector: "SaaS & tech" },
  { name: "Shopify", hex: "#96BF48", sector: "SaaS & tech" },
  { name: "Microsoft", hex: "#00A4EF", sector: "SaaS & tech" },
  { name: "Android", hex: "#3DDC84", sector: "SaaS & tech" },
  /* Social */
  { name: "Facebook", hex: "#1877F2", sector: "Social" },
  { name: "X", hex: "#111111", sector: "Social" },
  { name: "Instagram", hex: "#E4405F", sector: "Social" },
  { name: "TikTok", hex: "#FE2C55", sector: "Social" },
  { name: "LinkedIn", hex: "#0A66C2", sector: "Social" },
  { name: "YouTube", hex: "#FF0000", sector: "Social" },
  { name: "Pinterest", hex: "#E60023", sector: "Social" },
  { name: "Snapchat", hex: "#FFFC00", sector: "Social" },
  { name: "Reddit", hex: "#FF4500", sector: "Social" },
  { name: "Twitch", hex: "#9146FF", sector: "Social" },
  { name: "Discord", hex: "#5865F2", sector: "Social" },
  { name: "Threads", hex: "#000000", sector: "Social" },
  { name: "WhatsApp", hex: "#25D366", sector: "Social" },
  { name: "Telegram", hex: "#26A5E4", sector: "Social" },
  /* Streaming & media */
  { name: "Netflix", hex: "#E50914", sector: "Streaming & media" },
  { name: "Spotify", hex: "#1DB954", sector: "Streaming & media" },
  { name: "Disney+", hex: "#113CCF", sector: "Streaming & media" },
  { name: "Prime Video", hex: "#00A8E1", sector: "Streaming & media" },
  { name: "BBC", hex: "#FF0000", sector: "Streaming & media" },
  { name: "Sky", hex: "#0072CE", sector: "Streaming & media" },
  { name: "SoundCloud", hex: "#FF5500", sector: "Streaming & media" },
  { name: "Deezer", hex: "#A238FF", sector: "Streaming & media" },
  { name: "Vimeo", hex: "#1AB7EA", sector: "Streaming & media" },
  { name: "Medium", hex: "#000000", sector: "Streaming & media" },
  /* Finance & payments */
  { name: "Coinbase", hex: "#0052FF", sector: "Finance & payments" },
  { name: "PayPal", hex: "#003087", sector: "Finance & payments" },
  { name: "Wise", hex: "#00B9F1", sector: "Finance & payments" },
  { name: "Klarna", hex: "#FFB3C7", sector: "Finance & payments" },
  { name: "Robinhood", hex: "#00C805", sector: "Finance & payments" },
  { name: "Starling Bank", hex: "#6935D3", sector: "Finance & payments" },
  { name: "American Express", hex: "#2E77BC", sector: "Finance & payments" },
  { name: "Mastercard", hex: "#EB001B", sector: "Finance & payments" },
  { name: "Visa", hex: "#1A1F71", sector: "Finance & payments" },
  { name: "AXA", hex: "#000083", sector: "Finance & payments" },
  /* Ecommerce */
  { name: "Amazon", hex: "#FF9900", sector: "Ecommerce" },
  { name: "Alibaba", hex: "#FF6A00", sector: "Ecommerce" },
  { name: "eBay", hex: "#E53238", sector: "Ecommerce" },
  { name: "Etsy", hex: "#F1641E", sector: "Ecommerce" },
  { name: "Booking.com", hex: "#003580", sector: "Ecommerce" },
  { name: "Airbnb", hex: "#FF5A5F", sector: "Ecommerce" },
  { name: "ASOS", hex: "#000000", sector: "Ecommerce" },
  /* Travel & delivery */
  { name: "Uber", hex: "#000000", sector: "Travel & delivery" },
  { name: "Lyft", hex: "#FF00BF", sector: "Travel & delivery" },
  { name: "Deliveroo", hex: "#00CCBC", sector: "Travel & delivery" },
  { name: "Ryanair", hex: "#073590", sector: "Travel & delivery" },
  { name: "easyJet", hex: "#FF6600", sector: "Travel & delivery" },
  { name: "British Airways", hex: "#075AAA", sector: "Travel & delivery" },
  /* Healthcare & public */
  { name: "NHS", hex: "#005EB8", sector: "Healthcare & public" },
  { name: "GOV.UK", hex: "#1D70B8", sector: "Healthcare & public" },
  { name: "Bupa", hex: "#246EB9", sector: "Healthcare & public" },
  /* Food & drink */
  { name: "McDonald's", hex: "#FFBC0D", sector: "Food & drink" },
  { name: "Starbucks", hex: "#00704A", sector: "Food & drink" },
  { name: "KFC", hex: "#E4002B", sector: "Food & drink" },
  { name: "Coca-Cola", hex: "#F40009", sector: "Food & drink" },
  { name: "Pepsi", hex: "#01437C", sector: "Food & drink" },
  { name: "Burger King", hex: "#F5A623", sector: "Food & drink" },
  { name: "Heineken", hex: "#008200", sector: "Food & drink" },
  { name: "Domino's", hex: "#E31837", sector: "Food & drink" },
  /* Sport */
  { name: "Nike", hex: "#111111", sector: "Sport" },
  { name: "Adidas", hex: "#000000", sector: "Sport" },
  { name: "Manchester United", hex: "#DA291C", sector: "Sport" },
  { name: "Liverpool", hex: "#C8102E", sector: "Sport" },
  { name: "Manchester City", hex: "#6CABDD", sector: "Sport" },
  { name: "Arsenal", hex: "#EF0107", sector: "Sport" },
  { name: "Chelsea", hex: "#034694", sector: "Sport" },
  { name: "Tottenham Hotspur", hex: "#132257", sector: "Sport" },
  { name: "Formula 1", hex: "#E10600", sector: "Sport" },
  { name: "NBA", hex: "#1D428A", sector: "Sport" },
  /* Design & creative */
  { name: "Adobe", hex: "#FA0F00", sector: "Design & creative" },
  { name: "Figma", hex: "#A259FF", sector: "Design & creative" },
  { name: "Canva", hex: "#00C4CC", sector: "Design & creative" },
  { name: "Dribbble", hex: "#EA4C89", sector: "Design & creative" },
  { name: "Behance", hex: "#1769FF", sector: "Design & creative" },
  { name: "InVision", hex: "#FF3366", sector: "Design & creative" },
  { name: "Stack Overflow", hex: "#F48024", sector: "Design & creative" },
  { name: "Sketch", hex: "#F7B500", sector: "Design & creative" },
];