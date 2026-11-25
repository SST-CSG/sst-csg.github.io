# School of Science & Technology research site

The public site for the research groups of the School of Science & Technology, City St George's, University of London. It is a static site built with [Eleventy](https://www.11ty.dev) and published with GitHub Pages at https://sst-csg.github.io.

The site is in preview while content is added, and a notice at the top of every page says so.

## How it fits together

| Folder | What it holds |
|---|---|
| `content/` | The words: groups, people, projects, posts, School news and events. One Markdown file each. |
| `src/` | The page templates, styles and logos. |
| `src/_data/school.js` | Reads `content/` and prepares the lists the pages use. |
| `src/_data/site.json` | Site-wide settings: contact email, link to the editor, the preview switch. |
| `.github/workflows/publish.yml` | Builds and publishes the site whenever `main` changes. |

Each research group has a folder under `content/groups/`:

```
content/groups/fluid-mechanics-group/
  group.md        the group page
  people/         one file per person
  projects/       one file per project
  posts/          one file per post
```

A person's `role` decides where they appear on the group's People page: `Group leader`, `Researcher`, `PhD student`, `Visiting researcher` or `Alumni`. A post with `share_with_school: true` also appears in the School's news.

## Adding and editing content

Until the editor is connected, content is changed by editing files, either on github.com (open a file, press the pencil, then "Commit changes") or by asking Claude. Every change to `main` is published about a minute later.

- **Add a research group:** create `content/groups/<group-name>/group.md` from `content/_templates/group.md`.
- **Add a person:** create `content/groups/<group-name>/people/<firstname-lastname>.md` from `content/_templates/person.md`.
- **Edit a group or a profile:** edit its file.
- **Add or edit a department:** edit the `departments` list in `src/_data/site.json`. A group's `department` must match one of these names exactly.
- **Remove something:** delete its file.

Folder and file names become web addresses, so use lowercase letters and hyphens.

## Working on the site

You need Node.js 22 or later.

```
npm install
npm start
```

This serves the site at http://localhost:8080 and rebuilds when a file changes. `npm run build` writes the finished site to `_site/`.

## Rules to keep

- No cookies, analytics or tracking, and nothing loaded from other sites. Fonts are self-hosted. Adding any of these brings back the legal need for a consent banner.
- Profiles show work details only, and each person agrees to their profile before it is published.
- Colours, type and logo use follow the City St George's visual identity guidelines (February 2025). The School green `#10CF53` is used for blocks with black text on top, never for text on white.

## Before launch

- Fill in `contactEmail` and `universityPrivacyUrl` in `src/_data/site.json`.
- Add an accessibility statement.
- Add the remaining groups and people, then set `preview` to `false` in `src/_data/site.json`.
- Connect the editor (Pages CMS) and set `editorUrl`, which switches on the "Sign in to edit" links.
- Photos for people and posts arrive with the editor.
