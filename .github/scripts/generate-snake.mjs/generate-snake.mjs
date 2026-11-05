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
let streak=0, best=0; for(const d of days){ streak=d.count ? streak+1 : 0; best=Math.max(best,streak); }
function planet() {
  const buildings=active.map((d,i)=>{ const a=(i/Math.max(1,active.length))*Math.PI*2, h=Math.min(18,3+Math.sqrt(d.count)*2.5), x=400+Math.sin(a)*92, y=145-Math.cos(a)*43, delay=(i/Math.max(1,active.length)*5).toFixed(1); return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+Math.min(3,0.8+d.count/10).toFixed(1)+'" fill="#ffe59b" opacity=".85"><animate attributeName="opacity" values=".25;1;.25" dur="3s" begin="'+delay+'s" repeatCount="indefinite"/></circle>'; }).join('');
  let stars=''; for(let i=0;i<60;i++){let x=28+(i*173)%744,y=48+(i*79)%175; stars+='<circle cx="'+x+'" cy="'+y+'" r="'+(i%6===0?'1.3':'.65')+'" fill="#c5d7ff" opacity=".6"/>';}
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 280" role="img" aria-label="Contribution planet: '+total+' contributions over the last year"><defs><radialGradient id="sky"><stop stop-color="#263567"/><stop offset="1" stop-color="#090f23"/></radialGradient><radialGradient id="ocean" cx="35%" cy="25%"><stop stop-color="#52b8c8"/><stop offset=".6" stop-color="#146b87"/><stop offset="1" stop-color="#092e55"/></radialGradient><clipPath id="globe"><circle cx="400" cy="145" r="70"/></clipPath></defs><rect width="800" height="280" rx="14" fill="url(#sky)"/>'+stars+'<text x="24" y="30" fill="#f1f6ff" font-family="Arial,sans-serif" font-size="16" font-weight="bold">CONTRIBUTION PLANET</text><text x="776" y="30" text-anchor="end" fill="#c4d4ef" font-family="Arial,sans-serif" font-size="12">'+total+' contributions · '+active.length+' active days</text><ellipse cx="400" cy="145" rx="150" ry="48" fill="none" stroke="#8eb8ff" stroke-opacity=".35"/><circle cx="400" cy="145" r="78" fill="#65d6ff" opacity=".09"/><circle cx="400" cy="145" r="70" fill="url(#ocean)"/><g clip-path="url(#globe)" fill="#68c782" opacity=".9"><path d="M325 110 Q344 88 363 94 L375 105 367 119 381 128 371 141 357 135 347 148 333 142Z"/><path d="M374 151 L387 153 395 169 389 192 376 205 366 183 369 168Z"/><path d="M399 93 Q422 81 446 100 L456 116 443 123 435 114 423 119 420 132 404 127 411 113 397 108Z"/><path d="M405 137 L422 133 435 142 430 161 417 177 405 165 399 151Z"/><path d="M445 159 L457 161 465 172 455 183 440 178Z"/></g>'+buildings+'<circle r="4" fill="#ffd776"><animateMotion dur="14s" repeatCount="indefinite" path="M250 145 A150 48 0 1 1 550 145 A150 48 0 1 1 250 145"/></circle><path d="M85 72 l35 12 -32 -6 Z" fill="#f8e8b4" opacity=".8"><animateTransform attributeName="transform" type="translate" from="-80 -20" to="620 90" dur="8s" repeatCount="indefinite"/></path><text x="24" y="255" fill="#c4d4ef" font-family="Arial,sans-serif" font-size="11">Your contributions light up the world · longest streak: '+best+' days</text><text x="776" y="255" text-anchor="end" fill="#c4d4ef" font-family="Arial,sans-serif" font-size="11">LAST 12 MONTHS</text></svg>';
}
await mkdir("dist", {recursive:true});
await Promise.all([writeFile("dist/contribution-planet.svg",planet()),writeFile("dist/contribution-planet-dark.svg",planet())]);
console.log("Generated contribution planet:",total,"contributions across",days.length,"days");
