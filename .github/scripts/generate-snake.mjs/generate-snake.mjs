import { mkdir, writeFile } from "node:fs/promises";
const response = await fetch("https://github.com/users/RafaelVieiraGonzaga/contributions", { headers: { "user-agent": "github-contribution-city" } });
if (!response.ok) throw new Error("Calendar request failed: " + response.status);
const html = await response.text();
const counts = new Map();
for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi)) {
  const n = m[2].match(/([\d,]+)\s+contributions?/i);
  counts.set(m[1], n ? Number(n[1].replaceAll(",", "")) : 0);
}
const days = [];
for (const m of html.matchAll(/<td\b([^>]*\bdata-date="[^"]+"[^>]*)>/gi)) {
  const a = m[1], id = a.match(/\bid="([^"]+)"/)?.[1], date = a.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
  if (!id || !date) continue;
  const level = Number(a.match(/\bdata-level="(\d)"/)?.[1] || 0);
  if (level && !counts.has(id)) throw new Error("Missing count for " + date);
  days.push({ date, count: counts.get(id) || 0 });
}
days.sort((a,b) => a.date.localeCompare(b.date));
if (days.length < 360) throw new Error("Incomplete calendar: " + days.length);
const total = days.reduce((s,d) => s+d.count, 0);
const active = days.filter(d => d.count > 0);
function city(dark) {
  const bg = dark ? "#0d1117" : "#f6f8fa", fg = dark ? "#e6edf3" : "#24292f";
  const base = 180, width = 800, margin = 24, slot = 752 / days.length;
  const buildings = days.map((d,i) => {
    if (!d.count) return "";
    const h = Math.min(112, 12 + Math.sqrt(d.count) * 17), x = (margin+i*slot).toFixed(2), y = (base-h).toFixed(2), delay = (i/days.length*8).toFixed(2);
    const color = ["#238636", "#2ea043", "#3fb950", "#56d364"][Math.min(3, Math.floor(Math.log2(d.count+1)))];
    return '<g><title>'+d.date+': '+d.count+' contributions</title><rect x="'+x+'" y="'+y+'" width="'+Math.max(1.5,slot-0.25).toFixed(2)+'" height="'+h.toFixed(2)+'" rx="0.6" fill="'+color+'"><animate attributeName="height" from="0" to="'+h.toFixed(2)+'" begin="'+delay+'s" dur="1s" fill="freeze"/><animate attributeName="y" from="'+base+'" to="'+y+'" begin="'+delay+'s" dur="1s" fill="freeze"/></rect></g>';
  }).join("");
  let stars = ""; for(let i=0;i<35;i++){ const x=28+(i*127)%744, y=55+(i*53)%65; stars += '<circle cx="'+x+'" cy="'+y+'" r="'+(i%3===0?1.4:0.7)+'" fill="'+(dark?'#8b949e':'#b7c3ce')+'" opacity="0.55"/>'; }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 220" role="img" aria-label="Contribution city: '+total+' contributions in the last year"><rect width="800" height="220" rx="12" fill="'+bg+'"/><text x="24" y="30" fill="'+fg+'" font-family="Arial,sans-serif" font-size="16" font-weight="bold">CONTRIBUTION CITY</text><text x="776" y="30" text-anchor="end" fill="'+(dark?'#8b949e':'#57606a')+'" font-family="Arial,sans-serif" font-size="12">'+total+' contributions · '+active.length+' active days</text>'+stars+'<circle cx="738" cy="66" r="16" fill="'+(dark?'#f2cc60':'#ffd966')+'" opacity="0.85"/>'+buildings+'<path d="M24 181 H776" stroke="'+(dark?'#30363d':'#d0d7de')+'" stroke-width="2"/><text x="24" y="204" fill="'+(dark?'#8b949e':'#57606a')+'" font-family="Arial,sans-serif" font-size="11">One building per active day · height reflects contributions</text><text x="776" y="204" text-anchor="end" fill="'+(dark?'#8b949e':'#57606a')+'" font-family="Arial,sans-serif" font-size="11">LAST 12 MONTHS</text></svg>';
}
await mkdir("dist", {recursive:true});
await Promise.all([writeFile("dist/github-contribution-grid-snake.svg",city(false)),writeFile("dist/github-contribution-grid-snake-dark.svg",city(true))]);
console.log("Generated contribution city:", total, "contributions across", days.length, "days");
