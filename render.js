// Rendu d'un profil GitHub complet dans un SEUL cadre SVG (thème Gruvbox).
// Fonction pure : reçoit des données déjà calculées, renvoie une chaîne SVG.

const T = {
  bg: "#1d2021",
  border: "#504945",
  divider: "#3c3836",
  fg: "#ebdbb2",
  dim: "#928374",
  yellow: "#fabd2f",
  orange: "#fe8019",
  orangeDark: "#d65d0e",
  red: "#fb4934",
  green: "#b8bb26",
  aqua: "#8ec07c",
  blue: "#83a598",
  purple: "#d3869b",
};

const FONT = `"JetBrains Mono","Courier New",monospace`;

function esc(s = "") {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

function fmt(n) {
  n = Number(n) || 0;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

function truncate(s = "", max = 64) {
  s = String(s);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function renderSVG(d) {
  const W = 850;
  const H = 512;
  const PAD = 32;

  // ---------- Header : avatar + identité ----------
  const avatar = d.avatarDataUri
    ? `<image clip-path="url(#avClip)" x="30" y="58" width="96" height="96" href="${d.avatarDataUri}" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="78" cy="106" r="48" fill="${T.orange}"/><text x="78" y="118" text-anchor="middle" font-size="30" font-weight="800" fill="${T.bg}">${esc((d.login || "?").slice(0, 2).toUpperCase())}</text>`;

  // ---------- Stats (5 colonnes) ----------
  const stats = [
    { n: fmt(d.stars), l: "ETOILES" },
    { n: fmt(d.commits), l: "COMMITS" },
    { n: fmt(d.prs), l: "PULL REQ" },
    { n: fmt(d.issues), l: "ISSUES" },
    { n: fmt(d.followers), l: "ABONNES" },
  ];
  const statY = 210;
  const col0 = PAD, colW = (W - PAD * 2) / stats.length;
  const statsSvg = stats
    .map((s, i) => {
      const cx = col0 + colW * i + colW / 2;
      return `<text x="${cx}" y="${statY}" text-anchor="middle" font-size="26" font-weight="800" fill="${T.fg}">${s.n}</text>
      <text x="${cx}" y="${statY + 22}" text-anchor="middle" font-size="11" letter-spacing="1" fill="${T.dim}">${s.l}</text>`;
    })
    .join("");

  // ---------- Top langages : barre + légende ----------
  const langs = (d.languages || []).slice(0, 6);
  const barX = PAD, barW = W - PAD * 2, barY = 300, barH = 12;
  let acc = 0;
  const totalPct = langs.reduce((a, l) => a + l.pct, 0) || 1;
  const segs = langs
    .map((l) => {
      const w = (l.pct / totalPct) * barW;
      const x = barX + acc;
      acc += w;
      return `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(0, w).toFixed(1)}" height="${barH}" fill="${l.color || T.yellow}"/>`;
    })
    .join("");
  // légende sur 2 colonnes
  const legend = langs
    .map((l, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const lx = barX + colIdx * (barW / 2);
      const ly = barY + 40 + rowIdx * 24;
      return `<rect x="${lx}" y="${ly - 10}" width="11" height="11" rx="2" fill="${l.color || T.yellow}"/>
      <text x="${lx + 18}" y="${ly}" font-size="12" fill="${T.dim}">${esc(l.name)} ${l.pct.toFixed(1)}%</text>`;
    })
    .join("");

  // ---------- Série de contributions (3 colonnes) ----------
  const streakY = 452;
  const c1 = PAD + (W - PAD * 2) * (1 / 6);
  const c2 = W / 2;
  const c3 = PAD + (W - PAD * 2) * (5 / 6);

  const streakSvg = `
    <text x="${c1}" y="${streakY}" text-anchor="middle" font-size="28" font-weight="800" fill="${T.fg}">${fmt(d.totalContributions)}</text>
    <text x="${c1}" y="${streakY + 22}" text-anchor="middle" font-size="11" letter-spacing="1" fill="${T.dim}">CONTRIBUTIONS</text>

    <circle cx="${c2}" cy="${streakY - 4}" r="34" fill="none" stroke="${T.orange}" stroke-width="4"/>
    <text x="${c2}" y="${streakY + 4}" text-anchor="middle" font-size="26" font-weight="800" fill="${T.orange}">${fmt(d.currentStreak)}</text>
    <text x="${c2}" y="${streakY + 40}" text-anchor="middle" font-size="11" letter-spacing="1" fill="${T.orange}">SERIE ACTUELLE</text>

    <text x="${c3}" y="${streakY}" text-anchor="middle" font-size="28" font-weight="800" fill="${T.fg}">${fmt(d.longestStreak)}</text>
    <text x="${c3}" y="${streakY + 22}" text-anchor="middle" font-size="11" letter-spacing="1" fill="${T.dim}">RECORD</text>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Profil GitHub de ${esc(d.login)}">
  <style>
    text{font-family:${FONT}}
    .cursor{animation:blink 1.1s step-end infinite}
    @keyframes blink{50%{opacity:0}}
    @media (prefers-reduced-motion:reduce){.cursor{animation:none}}
  </style>
  <defs>
    <clipPath id="avClip"><circle cx="78" cy="106" r="48"/></clipPath>
  </defs>

  <!-- LE CADRE UNIQUE -->
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="18" fill="${T.bg}" stroke="${T.border}" stroke-width="2"/>

  <!-- points terminal -->
  <circle cx="34" cy="32" r="5" fill="${T.red}"/>
  <circle cx="52" cy="32" r="5" fill="${T.yellow}"/>
  <circle cx="70" cy="32" r="5" fill="${T.green}"/>

  <!-- avatar + identité -->
  <circle cx="78" cy="106" r="51" fill="none" stroke="${T.yellow}" stroke-width="2.5"/>
  ${avatar}
  <text x="150" y="88" font-size="13" font-weight="700" letter-spacing="1" fill="${T.yellow}">$ whoami — @${esc(d.login)}</text>
  <text x="147" y="126" font-size="34" font-weight="800" fill="${T.fg}">${esc(d.name || d.login)}</text>
  <text x="150" y="152" font-size="13" fill="${T.orange}">${esc(truncate(d.bio || "Building with TypeScript on GitHub.", 60))}<tspan class="cursor" dx="3">▌</tspan></text>

  <line x1="${PAD}" y1="176" x2="${W - PAD}" y2="176" stroke="${T.divider}" stroke-width="1.5"/>
  ${statsSvg}
  <line x1="${PAD}" y1="258" x2="${W - PAD}" y2="258" stroke="${T.divider}" stroke-width="1.5"/>

  <text x="${PAD}" y="288" font-size="13" font-weight="700" letter-spacing="2" fill="${T.yellow}">## LANGAGES</text>
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="6" fill="${T.divider}"/>
  <clipPath id="barClip"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="6"/></clipPath>
  <g clip-path="url(#barClip)">${segs}</g>
  ${legend}

  <line x1="${PAD}" y1="410" x2="${W - PAD}" y2="410" stroke="${T.divider}" stroke-width="1.5"/>
  ${streakSvg}
</svg>`;
}

module.exports = { renderSVG };