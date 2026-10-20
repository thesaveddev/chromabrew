/* Toolbar click opens the side panel instead of a popup: a popup closes
 * the moment focus moves to the native eyedropper, a side panel stays. */
chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
