import { mkdir, writeFile } from "node:fs/promises";

const login = "RafaelVieiraGonzaga";
const res = await fetch("https://github.com/users/" + login + "/contributions", { headers: { "user-agent": "growing-profile-snake/1.0" } });
if (!res.ok) throw new Error("Calendar request failed: " + res.status);
const html = await res.text();
const counts = new Map();
for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi)) {
  const n = m[2].match(/([\d,]+)\s+contributions?/i);
  counts.set(m[1], n ? Number(n[1].replaceAll(",", "")) : 0);
}
const days = [];
for (const m of html.matchAll(/<td\b([^>]*\bdata-date="[^\"]+"[^>]*)>/gi)) {
  const a = m[1], id = a.match(/\bid="([^"]+)"/)?.[1], date = a.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
  if (!id || !date) continue;
  const level = Number(a.match(/\bdata-level="(\d)"/)?.[1] || 0);
  if (level && !counts.has(id)) throw new Error("Missing count for " + date);
  days.push({ id, date, level, count: counts.get(id) || 0 });
}
if (days.length < 360) throw new Error("Incomplete calendar: " + days.length + " days");
const start = new Date(days[0].date + "T00:00:00Z");
start.setUTCDate(start.getUTCDate() - start.getUTCDay());
const weeks = Math.ceil((days.length + new Date(days[0].date + "T00:00:00Z").getUTCDay()) / 7);
const byCell = new Map();
for (const d of days) { const dt = new Date(d.date + "T00:00:00Z"); byCell.set(Math.floor((dt - start) / 604800000) + "," + dt.getUTCDay(), d); }
const cell = 10, gap = 4, step = 14, left = 18, top = 30;
const points = [], ordered = [];
for (let row = 0; row < 7; row++) {
  for (let j = 0; j < weeks; j++) {
    const col = row % 2 ? weeks - j - 1 : j, d = byCell.get(col + "," + row);
    if (!d) continue;
    points.push([left + col * step + 5, top + row * step + 5]); ordered.push(d);
  }
}
const path = points.map((p, i) => (i ? "L " : "M ") + p[0] + " " + p[1]).join(" ");
const pathLength = (points.length - 1) * step;
let eaten = 0;
const lengths = ordered.map(d => { eaten += d.count; return Math.min(pathLength, step * (2 + eaten * 0.55)).toFixed(1); });
const offsets = points.map((_, i) => "-" + (i * step).toFixed(1));
const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
const total = days.reduce((s, d) => s + d.count, 0), duration = Math.max(24, Math.round(points.length * 0.1));
const palettes = { light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"], dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"] };
function build(theme) {
  const palette = palettes[theme], dark = theme === "dark";
  const squares = days.map(d => {
    const dt = new Date(d.date + "T00:00:00Z"), col = Math.floor((dt - start) / 604800000), row = dt.getUTCDay();
    return '<rect x="' + (left + col * step) + '" y="' + (top + row * step) + '" width="10" height="10" rx="2" fill="' + palette[Math.min(d.level, 4)] + '"><title>' + d.count + ' contributions on ' + d.date + '</title></rect>';
  }).join("");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (left * 2 + weeks * step) + '" height="' + (top + 7 * step + 24) + '" viewBox="0 0 ' + (left * 2 + weeks * step) + ' ' + (top + 7 * step + 24) + '" role="img" aria-label="A snake that grows with every contribution">' +
    '<text x="' + left + '" y="18" fill="' + (dark ? "#c9d1d9" : "#57606a") + '" font-family="Arial,sans-serif" font-size="12">' + total + ' contributions in the last year · grows with every contribution</text>' + squares +
    '<path d="' + path + '" fill="none" stroke="' + (dark ? "#0d1117" : "#ffffff") + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + path + '" fill="none" stroke="#f0b429" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + lengths[0] + ' ' + pathLength + '"><animate attributeName="stroke-dasharray" values="' + lengths.map(x => x + " " + pathLength).join(";") + '" dur="' + duration + 's" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" values="' + offsets.join(";") + '" dur="' + duration + 's" calcMode="discrete" repeatCount="indefinite"/></path>' +
    '<circle r="4.5" fill="#ffdf5d" stroke="' + (dark ? "#0d1117" : "#ffffff") + '" stroke-width="1.5"><animate attributeName="cx" values="' + xs.join(";") + '" dur="' + duration + 's" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="cy" values="' + ys.join(";") + '" dur="' + duration + 's" calcMode="discrete" repeatCount="indefinite"/></circle></svg>';
}
await mkdir("dist", { recursive: true });
await Promise.all([writeFile("dist/github-contribution-grid-snake.svg", build("light")), writeFile("dist/github-contribution-grid-snake-dark.svg", build("dark"))]);
console.log("Generated growing snake: " + total + " contributions across " + days.length + " days.");
