const T={bg:"#1d2021",border:"#fabd2f",divider:"#3c3836",fg:"#ebdbb2",dim:"#928374",yellow:"#fabd2f",orange:"#fe8019",orangeDark:"#d65d0e",red:"#fb4934",green:"#b8bb26",aqua:"#8ec07c",blue:"#83a598",purple:"#d3869b"};
const FONT=`"JetBrains Mono","Courier New",monospace`;
function esc(s=""){return String(s).replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]))}
function fmt(n){n=Number(n)||0;if(n>=1000)return(n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,"")+("k");return String(n)}
function truncate(s="",max=72){s=String(s);return s.length>max?s.slice(0,max-1)+"…":s}

// ── RENDER ──────────────────────────────────────────────────────────────────
function renderSVG(d){
  const W=860,H=800,PAD=40,R=22;
  const AV_CX=84,AV_CY=116,AV_R=56;
  const avatar=d.avatarDataUri
    ?`<image clip-path="url(#avClip)" x="${AV_CX-AV_R}" y="${AV_CY-AV_R}" width="${AV_R*2}" height="${AV_R*2}" href="${d.avatarDataUri}" preserveAspectRatio="xMidYMid slice"/>`
    :`<circle cx="${AV_CX}" cy="${AV_CY}" r="${AV_R}" fill="${T.orange}"/><text x="${AV_CX}" y="${AV_CY+11}" text-anchor="middle" font-size="32" font-weight="800" fill="${T.bg}">${esc((d.login||"?").slice(0,2).toUpperCase())}</text>`;
  const COLS=28,ROWS=24,GW=W/COLS,GH=H/ROWS;
  let dots="";
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const x=(c+0.5)*GW,y=(r+0.5)*GH;
    const delay=((c*3+r*7)%23)*0.18,dur=2.4+((c+r)%5)*0.4;
    const op1=0.03+((c+r)%4)*0.025,op2=op1*3.5;
    dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="${T.yellow}"><animate attributeName="opacity" values="${op1};${op2};${op1}" dur="${dur.toFixed(2)}s" begin="${delay.toFixed(2)}s" repeatCount="indefinite"/></circle>`;
  }
  const scanLines=`<line x1="0" y1="0" x2="${W}" y2="0" stroke="${T.orange}" stroke-width="1.5" opacity="0"><animate attributeName="y1" from="-2" to="${H+2}" dur="5s" repeatCount="indefinite"/><animate attributeName="y2" from="-2" to="${H+2}" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.18;0.18;0" dur="5s" repeatCount="indefinite"/></line><line x1="0" y1="0" x2="${W}" y2="0" stroke="${T.yellow}" stroke-width="1" opacity="0"><animate attributeName="y1" from="-2" to="${H+2}" dur="5s" begin="2.5s" repeatCount="indefinite"/><animate attributeName="y2" from="-2" to="${H+2}" dur="5s" begin="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.12;0.12;0" dur="5s" begin="2.5s" repeatCount="indefinite"/></line>`;
  const glowAnim=`<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="${R}" fill="none" stroke="${T.yellow}" stroke-width="3"><animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/><animate attributeName="stroke-width" values="2;4;2" dur="3s" repeatCount="indefinite"/></rect>`;
  const stats=[{n:fmt(d.stars),l:"ETOILES"},{n:fmt(d.commits),l:"COMMITS"},{n:fmt(d.prs),l:"PULL REQ"},{n:fmt(d.issues),l:"ISSUES"},{n:fmt(d.followers),l:"ABONNES"}];
  const statY=248,colW=(W-PAD*2)/stats.length;
  const statsSvg=stats.map((s,i)=>{const cx=PAD+colW*i+colW/2;return`<text x="${cx}" y="${statY}" text-anchor="middle" font-size="30" font-weight="800" fill="${T.fg}">${s.n}</text><text x="${cx}" y="${statY+24}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${T.dim}">${s.l}</text>`;}).join("");
  const langs=(d.languages||[]).slice(0,6);
  const barX=PAD,barW=W-PAD*2,barY=360,barH=16;
  let acc=0;
  const totalPct=langs.reduce((a,l)=>a+l.pct,0)||1;
  const segs=langs.map(l=>{const w=(l.pct/totalPct)*barW,x=barX+acc;acc+=w;return`<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(0,w).toFixed(1)}" height="${barH}" fill="${l.color||T.yellow}"/>`;}).join("");
  const legend=langs.map((l,i)=>{const ci=i%2,ri=Math.floor(i/2),lx=barX+ci*(barW/2),ly=barY+52+ri*28;return`<rect x="${lx}" y="${ly-12}" width="13" height="13" rx="3" fill="${l.color||T.yellow}"/><text x="${lx+20}" y="${ly}" font-size="13" fill="${T.dim}">${esc(l.name)} ${l.pct.toFixed(1)}%</text>`;}).join("");
  const heatY=580,heatX=PAD,weeks=d.weeks||[];
  const maxDay=Math.max(1,...weeks.flatMap(w=>w.map(v=>v)));
  const cellS=12,cellG=3;
  let heatSvg="";
  const heatColors=["#3c3836","#665c54","#fe8019","#fabd2f","#ebdbb2"];
  for(let wi=0;wi<Math.min(weeks.length,52);wi++)for(let di=0;di<7;di++){const v=weeks[wi]?.[di]||0,ci=v===0?0:Math.min(4,Math.ceil((v/maxDay)*4)),x=heatX+wi*(cellS+cellG),y=heatY+di*(cellS+cellG);heatSvg+=`<rect x="${x}" y="${y}" width="${cellS}" height="${cellS}" rx="2" fill="${heatColors[ci]}"/>`;}
  const streakY=H-70,c1=PAD+(W-PAD*2)*(1/6),c2=W/2,c3=PAD+(W-PAD*2)*(5/6);
  return`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Profil GitHub de ${esc(d.login)}">
<style>text{font-family:${FONT}}.cursor{animation:blink 1.1s step-end infinite}@keyframes blink{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.cursor{animation:none}}</style>
<defs>
  <clipPath id="avClip"><circle cx="${AV_CX}" cy="${AV_CY}" r="${AV_R}"/></clipPath>
  <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="${R}"/></clipPath>
  <radialGradient id="bgGrad" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#2a1f00"/><stop offset="60%" stop-color="#1d2021"/><stop offset="100%" stop-color="#141617"/></radialGradient>
</defs>
<rect x="0" y="0" width="${W}" height="${H}" rx="${R}" fill="url(#bgGrad)"/>
<g clip-path="url(#cardClip)">${dots}</g>
<g clip-path="url(#cardClip)">${scanLines}</g>
<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="${R}" fill="none" stroke="${T.border}" stroke-width="1.5" opacity="0.5"/>
${glowAnim}
<circle cx="34" cy="34" r="6" fill="${T.red}"/><circle cx="54" cy="34" r="6" fill="${T.yellow}"/><circle cx="74" cy="34" r="6" fill="${T.green}"/>
<text x="${W-PAD}" y="40" text-anchor="end" font-size="11" letter-spacing="3" fill="${T.dim}">GITHUB PROFILE</text>
<circle cx="${AV_CX}" cy="${AV_CY}" r="${AV_R+4}" fill="none" stroke="${T.yellow}" stroke-width="2.5"><animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite"/></circle>
${avatar}
<text x="162" y="90" font-size="13" font-weight="700" letter-spacing="2" fill="${T.yellow}">$ whoami — @${esc(d.login)}</text>
<text x="159" y="134" font-size="38" font-weight="800" fill="${T.fg}">${esc(d.name||d.login)}</text>
<text x="162" y="162" font-size="14" fill="${T.orange}">${esc(truncate(d.bio||"Building with TypeScript on GitHub.",68))}<tspan class="cursor" dx="3">▌</tspan></text>
<line x1="${PAD}" y1="192" x2="${W-PAD}" y2="192" stroke="${T.divider}" stroke-width="1.5"/>
<text x="${PAD}" y="218" font-size="11" letter-spacing="3" fill="${T.dim}">## STATISTIQUES</text>
${statsSvg}
<line x1="${PAD}" y1="296" x2="${W-PAD}" y2="296" stroke="${T.divider}" stroke-width="1.5"/>
<text x="${PAD}" y="326" font-size="11" letter-spacing="3" fill="${T.dim}">## LANGAGES</text>
<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="8" fill="${T.divider}"/>
<clipPath id="barClip"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="8"/></clipPath>
<g clip-path="url(#barClip)">${segs}</g>
${legend}
<line x1="${PAD}" y1="548" x2="${W-PAD}" y2="548" stroke="${T.divider}" stroke-width="1.5"/>
<text x="${PAD}" y="568" font-size="11" letter-spacing="3" fill="${T.dim}">## ACTIVITE</text>
${heatSvg}
<line x1="${PAD}" y1="${H-120}" x2="${W-PAD}" y2="${H-120}" stroke="${T.divider}" stroke-width="1.5"/>
<text x="${c1}" y="${streakY}" text-anchor="middle" font-size="32" font-weight="800" fill="${T.fg}">${fmt(d.totalContributions)}</text>
<text x="${c1}" y="${streakY+24}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${T.dim}">CONTRIBUTIONS</text>
<circle cx="${c2}" cy="${streakY-6}" r="38" fill="none" stroke="${T.orange}" stroke-width="4"><animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>
<text x="${c2}" y="${streakY+6}" text-anchor="middle" font-size="30" font-weight="800" fill="${T.orange}">${fmt(d.currentStreak)}</text>
<text x="${c2}" y="${streakY+44}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${T.orange}">SERIE ACTUELLE</text>
<text x="${c3}" y="${streakY}" text-anchor="middle" font-size="32" font-weight="800" fill="${T.fg}">${fmt(d.longestStreak)}</text>
<text x="${c3}" y="${streakY+24}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${T.dim}">RECORD</text>
</svg>`;
}

// ── GITHUB ──────────────────────────────────────────────────────────────────
const QUERY=`query($login:String!){user(login:$login){name login avatarUrl(size:200) bio followers{totalCount} pullRequests{totalCount} issues{totalCount} repositories(first:100,ownerAffiliations:OWNER,isFork:false,orderBy:{field:STARGAZERS,direction:DESC}){nodes{stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}} contributionsCollection{totalCommitContributions restrictedContributionsCount contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;

async function ghGraphQL(token,login){
  const res=await fetch("https://api.github.com/graphql",{method:"POST",headers:{Authorization:`bearer ${token}`,"Content-Type":"application/json","User-Agent":"profile-frame"},body:JSON.stringify({query:QUERY,variables:{login}})});
  if(!res.ok)throw new Error(`GitHub API ${res.status}`);
  const json=await res.json();
  if(json.errors)throw new Error(json.errors[0].message);
  return json.data.user;
}
function computeLanguages(repos){
  const totals={},colors={};
  for(const repo of repos)for(const edge of repo.languages.edges){const n=edge.node.name;totals[n]=(totals[n]||0)+edge.size;colors[n]=edge.node.color||"#fabd2f";}
  const sum=Object.values(totals).reduce((a,b)=>a+b,0)||1;
  return Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,size])=>({name,color:colors[name],pct:(size/sum)*100}));
}
function computeStreak(weeks){
  const days=[];for(const w of weeks)for(const d of w.contributionDays)days.push(d);
  days.sort((a,b)=>a.date.localeCompare(b.date));
  let longest=0,run=0;
  for(const d of days){if(d.contributionCount>0){run++;longest=Math.max(longest,run);}else run=0;}
  let current=0;
  for(let i=days.length-1;i>=0;i--){if(days[i].contributionCount>0)current++;else if(i===days.length-1)continue;else break;}
  return{current,longest};
}
async function fetchAvatarDataUri(url){
  try{const res=await fetch(url,{headers:{"User-Agent":"profile-frame"}});if(!res.ok)return null;const type=res.headers.get("content-type")||"image/png";const buf=Buffer.from(await res.arrayBuffer());return`data:${type};base64,${buf.toString("base64")}`;}catch{return null;}
}
async function fetchStats(token,login){
  const u=await ghGraphQL(token,login);
  const stars=u.repositories.nodes.reduce((a,r)=>a+r.stargazerCount,0);
  const cc=u.contributionsCollection;
  const{current,longest}=computeStreak(cc.contributionCalendar.weeks);
  const avatarDataUri=await fetchAvatarDataUri(u.avatarUrl);
  const weeks=cc.contributionCalendar.weeks.map(w=>w.contributionDays.map(d=>d.contributionCount));
  return{login:u.login,name:u.name,bio:u.bio,avatarDataUri,stars,commits:cc.totalCommitContributions+cc.restrictedContributionsCount,prs:u.pullRequests.totalCount,issues:u.issues.totalCount,followers:u.followers.totalCount,languages:computeLanguages(u.repositories.nodes),totalContributions:cc.contributionCalendar.totalContributions,currentStreak:current,longestStreak:longest,weeks};
}

// ── HANDLER ─────────────────────────────────────────────────────────────────
function errorSVG(msg){return`<svg width="860" height="120" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="857" height="117" rx="18" fill="#1d2021" stroke="#fb4934" stroke-width="2"/><text x="32" y="52" font-family="monospace" font-size="15" font-weight="700" fill="#fb4934">Erreur : ${String(msg).replace(/[<>&]/g,"")}</text><text x="32" y="80" font-family="monospace" font-size="12" fill="#928374">Verifie PAT_1 et le parametre username.</text></svg>`;}

module.exports=async(req,res)=>{
  const username=(req.query&&req.query.username)||new URL(req.url,"http://x").searchParams.get("username");
  res.setHeader("Content-Type","image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control","public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400");
  try{
    const token=process.env.PAT_1;
    if(!token)throw new Error("PAT_1 manquant");
    if(!username)throw new Error("username manquant");
    const data=await fetchStats(token,username);
    res.status(200).send(renderSVG(data));
  }catch(e){res.status(200).send(errorSVG(e.message));}
};