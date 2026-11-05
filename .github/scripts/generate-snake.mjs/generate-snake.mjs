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
function galaxy(dark) {
  const bg = dark ? "#0d1117" : "#10152b", fg = "#eef3ff";
  const stars = active.map((d,i) => {
    const angle = i * 2.39996, radius = 12 + 135 * Math.sqrt((i+1)/Math.max(1,active.length));
    const x = 400 + Math.cos(angle)*radius*2.1, y = 134 + Math.sin(angle)*radius*0.62;
    return { ...d, x:x.toFixed(1), y:y.toFixed(1), r:Math.min(4.2,1.2+Math.sqrt(d.count)*0.55).toFixed(1), delay:(i/Math.max(1,active.length)*7).toFixed(2) };
  });
  const lines = stars.map((s,i) => i && i%7!==0 ? '<line x1="'+stars[i-1].x+'" y1="'+stars[i-1].y+'" x2="'+s.x+'" y2="'+s.y+'" stroke="#8eaeff" stroke-opacity=".18" stroke-width=".7"/>' : '').join('');
  const dots = stars.map(s => '<g><title>'+s.date+': '+s.count+' contributions</title><circle cx="'+s.x+'" cy="'+s.y+'" r="'+(Number(s.r)*2.5).toFixed(1)+'" fill="#7b9fff" opacity=".1"/><circle cx="'+s.x+'" cy="'+s.y+'" r="'+s.r+'" fill="'+(s.count>9?'#fff0af':'#d3e2ff')+'"><animate attributeName="opacity" values=".4;1;.4" dur="3s" begin="'+s.delay+'s" repeatCount="indefinite"/></circle></g>').join('');
  let dust=''; for(let i=0;i<75;i++){ const x=20+(i*137)%760, y=44+(i*59)%166; dust += '<circle cx="'+x+'" cy="'+y+'" r=".6" fill="#aabfff" opacity=".35"/>'; }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 250" role="img" aria-label="Contribution galaxy: '+total+' contributions in the last year"><defs><radialGradient id="g"><stop stop-color="#493982"/><stop offset="1" stop-color="#10152b"/></radialGradient></defs><rect width="800" height="250" rx="12" fill="'+bg+'"/><ellipse cx="400" cy="140" rx="310" ry="95" fill="url(#g)" opacity=".75"/>'+dust+'<text x="24" y="30" fill="'+fg+'" font-family="Arial,sans-serif" font-size="16" font-weight="bold">CONTRIBUTION GALAXY</text><text x="776" y="30" text-anchor="end" fill="#b8c5e5" font-family="Arial,sans-serif" font-size="12">'+total+' contributions · '+active.length+' active days</text>'+lines+dots+'<text x="24" y="229" fill="#b8c5e5" font-family="Arial,sans-serif" font-size="11">Each star represents an active day · brightness reflects contributions</text><text x="776" y="229" text-anchor="end" fill="#b8c5e5" font-family="Arial,sans-serif" font-size="11">LAST 12 MONTHS</text></svg>';
}
await mkdir("dist", {recursive:true});
await Promise.all([writeFile("dist/contribution-galaxy.svg",galaxy(false)),writeFile("dist/contribution-galaxy-dark.svg",galaxy(true))]);
console.log("Generated contribution galaxy:", total, "contributions across", days.length, "days");
