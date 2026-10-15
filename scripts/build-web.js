// Builds the static web app into ./dist with an offline service worker. Run: npm run build:web
// Set BASE_URL (e.g. "/RaceTracker") to build for hosting under a sub-path like GitHub Pages.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const base = (process.env.BASE_URL || "").replace(/\/$/, "");

fs.rmSync(dist, { recursive: true, force: true });
execSync("npx expo export --platform web --output-dir dist", {
  cwd: root,
  stdio: "inherit",
});

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const skip = new Set(["sw.js", "_redirects"]);
const files = walk(dist)
  .map((p) => base + "/" + path.relative(dist, p).split(path.sep).join("/"))
  .filter((f) => !skip.has(f.slice(base.length + 1)) && !f.endsWith(".map"));
const home = base + "/";
const precache = [home, ...files];
const version = Date.now().toString(36);

const sw = `const CACHE = "racing-tracker-${version}";
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(${JSON.stringify(home)}, copy));
          return res;
        })
        .catch(() => caches.match(${JSON.stringify(home)}))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
`;

const headTags = `    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <link rel="manifest" href="${base}/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${base}/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Racing" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <script>if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('${base}/sw.js'); }); }</script>
`;
const indexPath = path.join(dist, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(/<meta name="viewport"[^>]*>\s*/, "").replace("</head>", headTags + "</head>");
fs.writeFileSync(indexPath, html);

fs.writeFileSync(path.join(dist, "sw.js"), sw);
fs.writeFileSync(path.join(dist, "_redirects"), "/*    /index.html   200\n");
// GitHub Pages: serve the app for deep links, and don't let Jekyll drop the _expo folder.
fs.copyFileSync(indexPath, path.join(dist, "404.html"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

const manifestPath = path.join(dist, "manifest.webmanifest");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.start_url = home;
manifest.scope = home;
manifest.icons = manifest.icons.map((i) => ({ ...i, src: base + i.src }));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("Web build ready in dist/ (" + precache.length + " files precached)");
