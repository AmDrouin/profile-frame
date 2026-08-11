// Récupère toutes les données d'un profil GitHub via l'API GraphQL,
// calcule les stats agrégées, les langages et la série de contributions.

const QUERY = `
query($login: String!) {
  user(login: $login) {
    name
    login
    avatarUrl(size: 200)
    bio
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function ghGraphQL(token, login) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "profile-frame",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.user;
}

function computeLanguages(repos) {
  const totals = {};
  const colors = {};
  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      const n = edge.node.name;
      totals[n] = (totals[n] || 0) + edge.size;
      colors[n] = edge.node.color || "#fabd2f";
    }
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, size]) => ({ name, color: colors[name], pct: (size / sum) * 100 }));
}

function computeStreak(weeks) {
  const days = [];
  for (const w of weeks) for (const d of w.contributionDays) days.push(d);
  days.sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0,
    run = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
  }

  // série actuelle : on remonte depuis aujourd'hui (on tolère un jour 0 aujourd'hui)
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else if (i === days.length - 1) continue; // aujourd'hui encore sans commit : on ne casse pas
    else break;
  }
  return { current, longest };
}

async function fetchAvatarDataUri(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "profile-frame" } });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchStats(token, login) {
  const u = await ghGraphQL(token, login);
  const stars = u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
  const cc = u.contributionsCollection;
  const { current, longest } = computeStreak(cc.contributionCalendar.weeks);
  const avatarDataUri = await fetchAvatarDataUri(u.avatarUrl);

  return {
    login: u.login,
    name: u.name,
    bio: u.bio,
    avatarDataUri,
    stars,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    followers: u.followers.totalCount,
    languages: computeLanguages(u.repositories.nodes),
    totalContributions: cc.contributionCalendar.totalContributions,
    currentStreak: current,
    longestStreak: longest,
  };
}

module.exports = { fetchStats };