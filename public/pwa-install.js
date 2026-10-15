// Capture the browser's one-use installation event before React starts.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.__mycInstallPrompt = event;
  window.dispatchEvent(new Event("myc-install-ready"));
});
window.addEventListener("appinstalled", () => {
  window.__mycInstallPrompt = null;
});
