// Service worker de MAXIMATHS : il ne sert qu'aux notifications push (aucune mise en cache des pages).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "MAXIMATHS", body: "Du nouveau sur le site", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    // message sans contenu : on garde le texte par défaut
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      data: { url: data.url },
      tag: "maximaths-nouveautes",
      renotify: true,
    }),
  );
});

// Un clic sur la notification ouvre le site (ou revient sur l'onglet déjà ouvert)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      for (const f of fenetres) {
        if (f.url.startsWith(self.location.origin) && "focus" in f) {
          f.navigate(cible);
          return f.focus();
        }
      }
      return self.clients.openWindow(cible);
    }),
  );
});
