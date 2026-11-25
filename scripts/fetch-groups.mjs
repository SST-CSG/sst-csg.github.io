// Finds every research group repository in the organisation and, when asked,
// copies its content into content/groups/<group>/ for the build.
//
// A group repository is any repository whose name starts with "group-",
// apart from the template. The part after "group-" becomes the web address:
// group-fluid-mechanics is published at /groups/fluid-mechanics/.
//
//   node scripts/fetch-groups.mjs fingerprint   prints a value that changes whenever anything changed
//   node scripts/fetch-groups.mjs fetch         also downloads the content
//
// Needs GH_TOKEN (a token from the read-only "site builder" GitHub App).

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const token = process.env.GH_TOKEN;
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const mode = process.argv[2] || "fingerprint";
if (!token || !owner) throw new Error("GH_TOKEN and GITHUB_REPOSITORY_OWNER are required.");

const api = async (path, accept = "application/vnd.github+json") => {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28" }
  });
  return response;
};

// Every repository the builder can see.
const repositories = [];
for (let page = 1; ; page++) {
  const response = await api(`/installation/repositories?per_page=100&page=${page}`);
  if (!response.ok) throw new Error(`Could not list repositories: ${response.status} ${await response.text()}`);
  const data = await response.json();
  repositories.push(...data.repositories);
  if (data.repositories.length < 100) break;
}

const groups = [];
for (const repo of repositories.sort((a, b) => a.name.localeCompare(b.name))) {
  // Capital letters in a repository name are accepted and lowered for the web address.
  const name = repo.name.toLowerCase();
  const slug = name.slice("group-".length).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!name.startsWith("group-") || name === "group-template" || repo.is_template || repo.archived || !slug) continue;
  const response = await api(`/repos/${owner}/${repo.name}/commits/${repo.default_branch}`, "application/vnd.github.sha");
  if (!response.ok) continue; // an empty repository has nothing to publish yet
  groups.push({ repo: repo.name, slug, version: (await response.text()).trim() });
}

// The fingerprint also changes once a day, so past events drop off the site.
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ site: process.env.GITHUB_SHA || "", day, groups: groups.map((g) => [g.repo, g.version]) }))
  .digest("hex");

if (mode === "fetch") {
  for (const group of groups) {
    const target = `content/groups/${group.slug}`;
    fs.rmSync(target, { recursive: true, force: true });
    execFileSync("git", ["clone", "--quiet", "--depth", "1", `https://x-access-token:${token}@github.com/${owner}/${group.repo}.git`, target], { stdio: ["ignore", "ignore", "inherit"] });
    fs.rmSync(`${target}/.git`, { recursive: true, force: true });
    fs.rmSync(`${target}/.github`, { recursive: true, force: true });
  }
}

console.log(`${groups.length} group repositories: ${groups.map((g) => g.repo).join(", ") || "none"}`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `fingerprint=${fingerprint}\n`);
else console.log(fingerprint);
