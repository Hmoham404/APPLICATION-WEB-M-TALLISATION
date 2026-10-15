import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./native.js";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  let controlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (controlled) window.dispatchEvent(new Event("myc-version-active"));
    controlled = true;
  });
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        const announce = () => {
          if (registration.waiting && navigator.serviceWorker.controller)
            window.dispatchEvent(
              new CustomEvent("myc-update-ready", { detail: registration }),
            );
        };
        announce();
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") announce();
          });
        });
        const check = () => {
          if (navigator.onLine && document.visibilityState === "visible")
            registration.update().catch(() => {});
        };
        window.addEventListener("online", check);
        document.addEventListener("visibilitychange", check);
        setInterval(check, 60 * 60 * 1000);
        check();
      })
      .catch((error) =>
        console.warn("Installation hors ligne indisponible", error),
      ),
  );
}
