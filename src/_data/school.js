// Reads everything under /content and turns it into the lists the pages use.
//
// content/school/news/*.md      School news
// content/school/events/*.md    School events
// content/groups/<group>/       One folder per research group. After launch each
//                               folder comes from that group's own repository.
//   group.md                    Group page
//   people/*.md                 One file per person
//   projects/*.md               One file per project
//   posts/*.md                  One file per post

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const root = path.resolve("content");

const readDir = (dir) => {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => read(path.join(dir, f)));
};

const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, "utf8"));
  return { ...data, slug: path.basename(file, ".md"), body: content.trim(), html: md.render(content) };
};

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date);

// The order of sections on a group's People page.
const roleOrder = ["Group leader", "Researcher", "PhD student", "Visiting researcher"];
const roleHeading = {
  "Group leader": "Group leader",
  Researcher: "Researchers",
  "PhD student": "PhD students",
  "Visiting researcher": "Visiting researchers"
};

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
    const g = read(path.join(base, "group.md"));
    const url = `/groups/${slug}/`;
    const groupRef = { slug, name: g.name, department: g.department, summary: g.summary, url, peopleUrl: `${url}people/` };

    // People
    const everyone = readDir(path.join(base, "people")).map((p) => {
      const displayName = [p.prefix, p.name].filter(Boolean).join(" ");
      const lead = p.role === "Group leader";
      return {
        ...p,
        displayName,
        initials: initials(p.name),
        lead,
        group: groupRef,
        url: `${url}people/${p.slug}/`,
        links: [
          p.orcid && { label: "ORCID", href: p.orcid },
          p.scholar && { label: "Google Scholar", href: p.scholar },
          p.github && { label: "GitHub", href: `https://github.com/${p.github}` },
          p.university_profile && { label: "University profile", href: p.university_profile },
          p.website && { label: "Website", href: p.website }
        ].filter(Boolean)
      };
    });
    const members = everyone.filter((p) => p.role !== "Alumni");
    const alumni = everyone.filter((p) => p.role === "Alumni");
    members.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
    const lite = (p) => p && { name: p.displayName, initials: p.initials, position: p.position, url: p.url, lead: p.lead, email: p.email, photo: p.photo };
    const find = (personSlug) => members.find((p) => p.slug === personSlug);

    // Projects
    const projects = readDir(path.join(base, "projects")).map((p) => ({
      ...p,
      active: p.status === "Active",
      team: (p.team || []).map(find).filter(Boolean).map(lite)
    }));
    const statusOrder = ["Active", "Starting soon", "Completed"];
    projects.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

    // Posts
    const groupPosts = readDir(path.join(base, "posts"))
      .map((p) => {
        const project = projects.find((x) => x.slug === p.project);
        return {
          ...p,
          group: groupRef,
          url: `${url}posts/${p.slug}/`,
          author: lite(find(p.author)),
          project: project && { title: project.title, status: project.status, dates: project.dates, funder: project.funder, team: project.team },
          readMinutes: Math.max(1, Math.round(p.body.split(/\s+/).length / 200))
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
      sections: roleOrder
        .map((role) => ({ title: roleHeading[role], people: members.filter((p) => p.role === role) }))
        .filter((s) => s.people.length),
      alumni,
      projects,
      posts: groupPosts.map((p) => ({ title: p.title, date: p.date, kind: p.kind, url: p.url }))
    });
    people.push(...members);
    posts.push(...groupPosts);
  }

  // School news and events
  const schoolNews = readDir(path.join("school", "news")).map((n) => ({
    ...n,
    url: `/news/${n.slug}/`,
    source: "School news",
    kind: "School",
    readMinutes: Math.max(1, Math.round(n.body.split(/\s+/).length / 200))
  }));
  news.push(...schoolNews.map((n) => ({ title: n.title, date: n.date, summary: n.summary, url: n.url, source: n.source, kind: n.kind })));
  news.sort(byDateDesc);

  const today = new Date(new Date().toDateString());
  const events = readDir(path.join("school", "events"))
    .filter((e) => new Date(e.date) >= today)
    .sort(byDateAsc);

  people.sort((a, b) => a.name.split(" ").slice(-1)[0].localeCompare(b.name.split(" ").slice(-1)[0]));

  return {
    groups,
    featuredGroups: groups.filter((g) => g.featured).slice(0, 4),
    people,
    posts,
    schoolNews,
    news,
    events,
    departments: [...new Set(groups.map((g) => g.department))].sort(),
    roles: roleOrder.filter((r) => people.some((p) => p.role === r)).map((r) => ({ value: r, label: roleHeading[r] === r ? "Group leaders" : roleHeading[r] }))
  };
}
