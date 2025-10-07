// Service Worker registration utility
const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function registerSW() {
  if ("serviceWorker" in navigator) {
    const publicUrl = new URL(
      process.env.PUBLIC_URL || "",
      window.location.href
    );
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL || ""}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
        navigator.serviceWorker.ready.then(() => {
          console.log("Service worker is ready for offline use.");
        });
      } else {
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("SW registered: ", registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("New content is available; please refresh.");
              // Notify user about update
              showUpdateAvailableNotification();
            } else {
              console.log("Content is cached for offline use.");
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("SW registration failed: ", error);
    });
}

function checkValidServiceWorker(swUrl: string) {
  fetch(swUrl, {
    headers: { "Service-Worker": "script" },
  })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    });
}

function showUpdateAvailableNotification() {
  // Simple notification - you can enhance this with a proper UI component
  if (confirm("A new version is available. Would you like to update?")) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }
}

export function unregisterSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

