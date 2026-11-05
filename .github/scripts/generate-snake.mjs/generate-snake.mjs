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

// Self-contained profile artwork: no trackers, external fonts, or image services.
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const text = (x,y,s,size=14,color='#96a8c5',extra='') => `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" ${extra}>${esc(s)}</text>`;
function svg(body, height, label, defs='') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs>${defs}</defs><style>@media(prefers-reduced-motion:reduce){.motion{animation:none!important}}.orbit{transform-origin:745px 148px;animation:orbit 24s linear infinite}.pulse{animation:pulse 4s ease-in-out infinite}.scan{animation:scan 18s linear infinite}@keyframes orbit{to{transform:rotate(360deg)}}@keyframes pulse{50%{opacity:.35}}@keyframes scan{from{transform:translateX(0)}to{transform:translateX(848px)}}</style>${body}</svg>`;
}
function banner(){
  let stars=''; for(let i=0;i<42;i++) stars+=`<circle cx="${540+(i*83)%400}" cy="${25+(i*47)%250}" r="${i%5===0?1.5:.7}" fill="#b9d6f7" opacity="${i%3===0?.6:.2}"/>`;
  return svg(`<rect width="960" height="300" rx="18" fill="#080e1c"/><path d="M0 298H960" stroke="#34d8e8" stroke-width="4"/><path d="M550 0V300M610 0V300M670 0V300M730 0V300M790 0V300M850 0V300M910 0V300M520 60H960M520 120H960M520 180H960M520 240H960" stroke="#142235" stroke-opacity=".5"/>${stars}<circle cx="745" cy="148" r="108" fill="url(#halo)"/><circle cx="745" cy="148" r="92" fill="none" stroke="#214254"/><circle cx="745" cy="148" r="68" fill="none" stroke="#1e4053" stroke-dasharray="2 7"/><ellipse cx="745" cy="148" rx="146" ry="51" transform="rotate(-32 745 148)" fill="none" stroke="#36dae6" stroke-opacity=".7"/><g class="motion orbit"><circle cx="837" cy="148" r="6" fill="#73f5e0"/><circle cx="653" cy="148" r="3" fill="#92a7ff"/></g>${text(745,164,'RG',48,'#e6f9ff','text-anchor="middle" font-weight="700" letter-spacing="-3"')}${text(48,43,'ENGINEERING  /  DESIGN  /  INTELLIGENCE',11,'#64dce7','letter-spacing="2"')}${text(45,118,'Rafael',72,'#f1f6ff','font-weight="700" letter-spacing="-3"')}${text(45,191,'Gonzaga.',72,'#f1f6ff','font-weight="700" letter-spacing="-3"')}${text(49,232,'Full Stack Developer · SaaS Builder',18,'#b2c2d9')}${text(49,268,'IDEAS INTO PRODUCTS. CODE INTO IMPACT.',11,'#64dce7','letter-spacing="1.8"')}`,300,'Rafael Gonzaga — Full Stack Developer, SaaS Builder',`<radialGradient id="halo"><stop stop-color="#123b50"/><stop offset="1" stop-color="#080e1c" stop-opacity="0"/></radialGradient>`);
}
function activity(dark){
  const bg=dark?'#0b1220':'#f6f9fc', fg=dark?'#eff6ff':'#13263c', muted=dark?'#9badc6':'#536780', line=dark?'#24334a':'#dae4ed';
  const colors=dark?['#192638','#16475c','#187b91','#24b8c5','#7ef5dc']:['#e4ebf2','#abdbe5','#60bfce','#2792ab','#13667e'];
  const max=Math.max(...days.map(d=>d.count),1), peak=days.reduce((a,b)=>b.count>a.count?b:a,days[0]);
  let dots='',cells='',labels='';
  active.forEach((d,i)=>{let angle=i/active.length*Math.PI*2,r=43+Math.sqrt(d.count/max)*47;dots+=`<circle cx="${(244+Math.cos(angle)*r*1.55).toFixed(2)}" cy="${(155+Math.sin(angle)*r*.68).toFixed(2)}" r="${(1.4+Math.sqrt(d.count/max)*2).toFixed(2)}" fill="${colors[3+i%2]}" opacity=".9"><title>${d.date}: ${d.count} contributions</title></circle>`});
  const first=new Date(days[0].date+'T00:00:00Z'), offset=first.getUTCDay(); let month='';
  days.forEach((d,i)=>{const col=Math.floor((i+offset)/7), row=(i+offset)%7, level=d.count===0?0:Math.min(4,Math.ceil(d.count/max*4));cells+=`<rect x="${56+col*16}" y="${292+row*16}" width="12" height="12" rx="3" fill="${colors[level]}"><title>${d.date}: ${d.count} contributions</title></rect>`;const dt=new Date(d.date+'T00:00:00Z'), m=dt.toLocaleString('en-US',{month:'short',timeZone:'UTC'});if(m!==month&&col<51){labels+=text(56+col*16,279,m,10,muted);month=m;}});
  return svg(`<rect x=".5" y=".5" width="959" height="429" rx="18" fill="${bg}" stroke="${line}"/>${text(32,36,'THE CONTRIBUTION ORBIT',13,fg,'font-weight="700" letter-spacing="2"')}${text(928,36,'RAFAELVIEIRAGONZAGA',10,muted,'text-anchor="end" letter-spacing="1.2"')}<ellipse cx="244" cy="155" rx="148" ry="62" fill="none" stroke="${line}"/><ellipse cx="244" cy="155" rx="110" ry="45" fill="none" stroke="${line}" stroke-dasharray="3 7"/>${dots}<circle cx="244" cy="155" r="28" fill="${colors[1]}"/><circle class="motion pulse" cx="244" cy="155" r="34" fill="none" stroke="${colors[3]}" stroke-opacity=".4"/>${text(244,160,'&lt;/&gt;'.replace('&lt;','<').replace('&gt;','>'),15,fg,'text-anchor="middle"')}<circle r="4" fill="${colors[4]}"><animateMotion dur="18s" repeatCount="indefinite" path="M96 155 A148 62 0 1 1 392 155 A148 62 0 1 1 96 155"/></circle>${text(244,241,'Each point is a day of building.',11,muted,'text-anchor="middle"')}${text(474,111,total.toLocaleString('en-US'),45,fg,'font-weight="700"')}${text(475,134,'CONTRIBUTIONS',10,muted,'letter-spacing="1.3"')}${text(710,111,active.length,45,fg,'font-weight="700"')}${text(711,134,'ACTIVE DAYS',10,muted,'letter-spacing="1.3"')}<path d="M475 156H900" stroke="${line}"/>${text(475,190,best+' days',23,fg,'font-weight="700"')}${text(475,212,'Longest streak',11,muted)}${text(711,190,peak.count+' contributions',23,fg,'font-weight="700"')}${text(711,212,'Best day · '+peak.date,11,muted)}${labels}${cells}<g clip-path="url(#calendar)"><rect class="motion scan" x="45" y="289" width="3" height="113" rx="1.5" fill="${colors[4]}" opacity=".7"/></g>${text(56,418,days[0].date+' — '+days.at(-1).date,10,muted)}${text(900,418,'REAL ACTIVITY · UPDATED DAILY',10,muted,'text-anchor="end" letter-spacing="1"')}`,430,`${total} contributions, ${active.length} active days, longest streak ${best} days. Daily contribution calendar from ${days[0].date} to ${days.at(-1).date}.`,`<clipPath id="calendar"><rect x="53" y="289" width="850" height="113"/></clipPath>`);
}
await Promise.all([
  writeFile('dist/profile-header.svg',banner()),
  writeFile('dist/contribution-orbit.svg',activity(false)),
  writeFile('dist/contribution-orbit-dark.svg',activity(true)),
]);
console.log('Generated branded profile header and contribution orbit (light + dark).');

