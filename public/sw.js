self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (_err) {
    payload = { title: "Nova notificação", body: event.data?.text() };
  }

  const title = payload.title || "Nova notificação";
  const iconOptions = {};
  if (payload.icon) iconOptions.icon = payload.icon;
  if (payload.badge) iconOptions.badge = payload.badge;
  const options = {
    body: payload.body || "Você recebeu uma atualização.",
    ...iconOptions,
    data: {
      url: payload.url || "/app",
      notificationId: payload.notificationId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/app";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.postMessage({ type: "OPEN_URL", url: targetUrl });
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
        return undefined;
      })
  );
});
