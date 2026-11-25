// Reads everything under /content and turns it into the lists the pages use.
//
// content/school/departments/*.md   Departments (kept in this repository)
// content/school/news/*.md          School news (kept in this repository)
// content/school/events/*.md        School events (kept in this repository)
// content/groups/<group>/           One folder per research group. Each folder is
//                                   downloaded from that group's own repository
//                                   when the site is built (scripts/fetch-groups.mjs).
//   group.md                        Group page
//   people/*.md                     One file per person
//   projects/*.md                   One file per project
//   posts/*.md                      One file per post
//   media/                          Uploaded photos

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const root = path.resolve("content");

// The editor stores uploads as /media/<file>. On the site each group's uploads
// live under /media/<group>/, so the addresses are adjusted while reading.
const read = (file, mediaPrefix = "/media") => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, "utf8"));
  const body = content.trim().replaceAll("](/media/", `](${mediaPrefix}/`);
  return { ...data, slug: path.basename(file, ".md"), body, html: md.render(body) };
};

const readDir = (dir, mediaPrefix) => {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => read(path.join(dir, f), mediaPrefix));
};

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// The editor stores a link to another entry as its file path, for example
// "people/ada-lovelace.md". This gives back "ada-lovelace".
const ref = (value) => (value ? path.basename(String(value), ".md") : "");

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date);
const readMinutes = (text) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

// The order of sections on a group's People page.
const roles = [
  { value: "Group leader", heading: "Group leader", plural: "Group leaders" },
  { value: "Researcher", heading: "Researchers", plural: "Researchers" },
  { value: "PhD student", heading: "PhD students", plural: "PhD students" },
  { value: "Visiting researcher", heading: "Visiting researchers", plural: "Visiting researchers" }
];
const roleOrder = roles.map((r) => r.value);
const statusOrder = ["Active", "Starting soon", "Completed"];

export default function () {
  const groups = [];
  const people = [];
  const posts = [];
  const news = [];

  const groupsDir = path.join(root, "groups");
  const groupSlugs = fs.existsSync(groupsDir)
    ? fs.readdirSync(groupsDir).filter((d) => fs.existsSync(path.join(groupsDir, d, "group.md"))).sort()
    : [];

  for (const slug of groupSlugs) {
    const base = path.join("groups", slug);
    const mediaPrefix = `/media/${slug}`;
    const media = (value) => (typeof value === "string" && value.startsWith("/media/") ? mediaPrefix + value.slice("/media".length) : value);
    const g = read(path.join(base, "group.md"), mediaPrefix);
    if (g.draft) continue; // hidden until the group's admin switches "Hide this group" off

    const url = `/groups/${slug}/`;
    const groupRef = { slug, name: g.name, department: g.department, summary: g.summary, url, peopleUrl: `${url}people/` };

    // People
    const everyone = readDir(path.join(base, "people"), mediaPrefix).map((p) => ({
      ...p,
      displayName: [p.prefix, p.name].filter(Boolean).join(" "),
      initials: initials(p.name),
      lead: p.role === "Group leader",
      photo: media(p.photo),
      group: groupRef,
      url: `${url}people/${p.slug}/`,
      links: [
        p.orcid && { label: "ORCID", href: p.orcid },
        p.scholar && { label: "Google Scholar", href: p.scholar },
        p.github && p.github_public && { label: "GitHub", href: `https://github.com/${String(p.github).replace(/^@/, "")}` },
        p.university_profile && { label: "University profile", href: p.university_profile },
        p.website && { label: "Website", href: p.website }
      ].filter(Boolean)
    }));
    const members = everyone.filter((p) => roleOrder.includes(p.role));
    const alumni = everyone.filter((p) => p.role === "Alumni");
    members.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
    const lite = (p) => p && { name: p.displayName, initials: p.initials, position: p.position, url: p.url, lead: p.lead, email: p.email, photo: p.photo };
    const find = (value) => members.find((p) => p.slug === ref(value));

    // Projects
    const projects = readDir(path.join(base, "projects"), mediaPrefix).map((p) => ({
      ...p,
      active: p.status === "Active",
      team: (p.team || []).map(find).filter(Boolean).map(lite)
    }));
    projects.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

    // Posts
    const groupPosts = readDir(path.join(base, "posts"), mediaPrefix)
      .filter((p) => p.date)
      .map((p) => {
        const project = projects.find((x) => x.slug === ref(p.project));
        return {
          ...p,
          group: groupRef,
          url: `${url}posts/${p.slug}/`,
          author: lite(find(p.author)),
          project: project && { title: project.title, status: project.status, dates: project.dates, funder: project.funder, team: project.team },
          readMinutes: readMinutes(p.body)
        };
      })
      .sort(byDateDesc);
    for (const p of groupPosts) {
      p.more = groupPosts.filter((x) => x !== p).slice(0, 3).map((x) => ({ title: x.title, date: x.date, url: x.url }));
      if (p.share_with_school) news.push({ title: p.title, date: p.date, summary: p.summary, url: p.url, source: g.name, kind: "Group" });
    }
    for (const project of projects) {
      const latest = groupPosts.find((x) => x.project && x.project.title === project.title);
      project.url = latest ? latest.url : null;
    }
    for (const p of members) {
      p.projects = projects.filter((x) => x.team.some((m) => m.url === p.url)).map((x) => ({ title: x.title, url: x.url }));
    }

    groups.push({
      ...g,
      ...groupRef,
      lead: lite(members.find((p) => p.lead)),
      team: members.map(lite),
      sections: roles.map((r) => ({ title: r.heading, people: members.filter((p) => p.role === r.value) })).filter((s) => s.people.length),
      alumni,
      projects,
      posts: groupPosts.map((p) => ({ title: p.title, date: p.date, kind: p.kind, url: p.url }))
    });
    people.push(...members);
    posts.push(...groupPosts);
  }

  // School news and events
  const schoolNews = readDir(path.join("school", "news"))
    .filter((n) => n.date)
    .map((n) => ({ ...n, url: `/news/${n.slug}/`, source: "School news", kind: "School", readMinutes: readMinutes(n.body) }));
  news.push(...schoolNews.map((n) => ({ title: n.title, date: n.date, summary: n.summary, url: n.url, source: n.source, kind: n.kind })));
  news.sort(byDateDesc);

  const today = new Date(new Date().toDateString());
  const events = readDir(path.join("school", "events"))
    .filter((e) => e.date && new Date(e.date) >= today)
    .sort(byDateAsc);

  // Departments, in the order set by their "order" number.
  const departmentList = readDir(path.join("school", "departments")).sort((a, b) => (a.order || 0) - (b.order || 0));

  const lastName = (p) => String(p.name).split(" ").slice(-1)[0];
  people.sort((a, b) => lastName(a).localeCompare(lastName(b)));

  // The home page shows up to four groups. The choice moves on by one group
  // each day, so every group gets the same share of the front page.
  const dayNumber = Math.floor(Date.now() / 86400000);
  const featuredGroups = groups.map((_, i) => groups[(i + dayNumber) % groups.length]).slice(0, 4);

  return {
    groups,
    featuredGroups,
    people,
    posts,
    schoolNews,
    news,
    events,
    departmentList,
    departments: [...new Set(groups.map((g) => g.department).filter(Boolean))].sort(),
    roles: roles.filter((r) => people.some((p) => p.role === r.value)).map((r) => ({ value: r.value, label: r.plural }))
  };
}
