self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Pikbio", {
      body: "Voce tem uma nova notificacao.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "pikbio-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});
