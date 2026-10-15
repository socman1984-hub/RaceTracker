// Builds the web app for GitHub Pages and publishes ./dist to the gh-pages branch.
// Run: npm run deploy:pages  → https://socman1984-hub.github.io/RaceTracker/
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const run = (cmd, cwd = root, extraEnv = {}) =>
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...extraEnv } });

run("node scripts/build-web.js", root, { BASE_URL: "/RaceTracker" });

const remote = execSync("git remote get-url origin", { cwd: root }).toString().trim();
fs.rmSync(path.join(dist, ".git"), { recursive: true, force: true });
run("git init -q -b gh-pages", dist);
run("git add -A", dist);
run(`git -c user.name="Racing Tracker deploy" -c user.email="deploy@localhost" commit -q -m "Deploy ${new Date().toISOString()}"`, dist);
run(`git push -f "${remote}" gh-pages`, dist);
fs.rmSync(path.join(dist, ".git"), { recursive: true, force: true });
console.log("Deployed to https://socman1984-hub.github.io/RaceTracker/");
