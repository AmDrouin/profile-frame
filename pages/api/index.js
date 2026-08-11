import { fetchStats } from "../../github";
import { renderSVG } from "../../render";

function errorSVG(message) {
  return `<svg width="850" height="120" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="847" height="117" rx="18" fill="#1d2021" stroke="#fb4934" stroke-width="2"/>
    <text x="32" y="52" font-family="monospace" font-size="15" font-weight="700" fill="#fb4934">Erreur : ${String(message).replace(/[<>&]/g, "")}</text>
    <text x="32" y="80" font-family="monospace" font-size="12" fill="#928374">Verifie le parametre username et la variable PAT_1.</text>
  </svg>`;
}

export default async function handler(req, res) {
  const { username } = req.query;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400");

  try {
    const token = process.env.PAT_1;
    if (!token) throw new Error("PAT_1 manquant");
    if (!username) throw new Error("username manquant");

    const data = await fetchStats(token, username);
    res.status(200).send(renderSVG(data));
  } catch (e) {
    res.status(200).send(errorSVG(e.message));
  }
}