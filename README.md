# School of Science & Technology research site

The public site for the research groups of the School of Science & Technology, City St George's, University of London, published at https://sst-csg.github.io.

## How it fits together

- **This repository** holds the design of the site (page templates, styles, logos) and the School-wide content: departments, School news and events.
- **Each research group has its own private repository**, named `group-<name>`. It holds the group page, its people, projects and posts. Only people added to that repository can edit that group.
- **The site is rebuilt automatically.** Every ten minutes it checks whether any group changed something, and republishes if so. A change usually appears within 15 minutes.
- **People edit through forms** in the editor (Pages CMS), signing in with their GitHub account. Nobody needs to edit files.

| Where | What it holds |
|---|---|
| `content/school/` | Departments, School news and events. |
| `src/` | The page templates, styles and logos. |
| `src/_data/school.js` | Reads the content and prepares the lists the pages use. |
| `src/_data/site.json` | Site-wide settings: contact email, link to the editor, the preview switch. |
| `scripts/fetch-groups.mjs` | Finds the group repositories and downloads their content for the build. |
| `.github/workflows/publish.yml` | Builds and publishes the site. |
| `.pages.yml` | The editor forms for the School-wide content. |

## Adding a research group

1. Open the `group-template` repository, press "Use this template", then "Create a new repository". Owner: SST-CSG. Name: `group-` followed by the group's name in lowercase with hyphens, for example `group-applied-probability`. Visibility: Private.
2. In the new repository, open Settings, then Collaborators and teams, and add the group's PI with the Admin role.

The part of the name after `group-` becomes the web address of the group. The group stays hidden from the site until its PI switches off "Hide this group from the site" in the Group page form.

## How publishing reads the private group repositories

A GitHub App called `sst-csg-site-builder`, owned by the organisation, has read-only access to all repositories. Its App ID is stored in this repository as the variable `BUILDER_APP_ID` and its private key as the secret `BUILDER_APP_PRIVATE_KEY`. If the key is ever lost or exposed, an organisation owner generates a new one in the App's settings and replaces the secret. Nothing else depends on it.

## Working on the site design

You need Node.js 22 or later.

```
npm install
npm start
```

This serves the site at http://localhost:8080. Group content is not stored in this repository, so a local copy shows no groups unless you place a group's files in `content/groups/<name>/`.

## Rules to keep

- No cookies, analytics or tracking, and nothing loaded from other sites. Fonts are self-hosted. Adding any of these brings back the legal need for a consent banner.
- Profiles show work details only, and each person agrees to their profile before it is published.
- Colours, type and logo use follow the City St George's visual identity guidelines (February 2025). The School green `#10CF53` is used for blocks with black text on top, never for text on white.

## Before launch

- Fill in `contactEmail` and `universityPrivacyUrl` in `src/_data/site.json`.
- Add an accessibility statement.
- Connect the editor (Pages CMS) and set `editorUrl`, which switches on the "Sign in to edit" links.
- Add the remaining groups and people, then set `preview` to `false` in `src/_data/site.json`.
