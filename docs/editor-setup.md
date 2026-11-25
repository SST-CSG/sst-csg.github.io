# Setting up the editor

The editor is the School's own copy of [Pages CMS](https://pagescms.org), an open-source tool that turns the `.pages.yml` file in each repository into forms. People sign in to it with their GitHub account. This page explains how it is set up, how to keep it running, and how to pass it to someone else.

Written on 25 November 2026, before the first deployment. Correct it after the first deployment if a step turned out differently.

## What it consists of

| Piece | Where | Owner |
|---|---|---|
| The editor's code | `SST-CSG/pages-cms`, a fork of `pages-cms/pages-cms` | The organisation |
| The running editor | A project on Netlify (free plan) | The School admin's Netlify account |
| Its database | A project on Neon (free plan). It holds sign-in sessions and cached data, and no site content. | The School admin's Neon account |
| Its GitHub App | Created in the organisation, installed on all repositories | The organisation |

All content stays in the GitHub repositories. If the editor is ever lost, nothing published is lost: it can be set up again from this page.

## First set-up

Have ready: an organisation owner at a computer with Node.js 22 or later, and the School admin signed in to GitHub.

1. **Fork the code.** On github.com open `pages-cms/pages-cms`, press "Fork", and choose SST-CSG as owner. Keep the name `pages-cms`.
2. **Create the database.** The School admin signs up at neon.com with "Continue with GitHub", creates a project named `sst-editor` in a Europe region, and copies the connection string (it starts with `postgresql://`).
3. **Create the Netlify project.** The School admin signs up at netlify.com with GitHub, chooses "Import an existing project", picks GitHub and the repository `SST-CSG/pages-cms`, and sets the project name to `sst-csg-editor`. The editor's address is then `https://sst-csg-editor.netlify.app`. The first deployment will fail because the settings are still missing. That is expected.
4. **Create the editor's GitHub App.** The organisation owner downloads the fork and runs the helper that comes with it:
   ```
   git clone https://github.com/SST-CSG/pages-cms.git
   cd pages-cms
   npm install
   npm run setup:github-app -- --owner-type org --org SST-CSG --app-name "SST CSG editor" --base-url https://sst-csg-editor.netlify.app --env .env.production
   ```
   A browser page opens. Press "Create GitHub App". The helper writes the App's six settings into the file `.env.production`.
5. **Switch off token expiry.** In the organisation's Settings, under Developer settings and GitHub Apps, open the new App. Under "Optional features", opt out of "User-to-server token expiration" if it is offered. Otherwise editors are signed out every few hours.
6. **Install the App.** In the App's settings press "Install App", choose SST-CSG and "All repositories", so every new group repository is covered.
7. **Enter the settings in Netlify.** In the Netlify project, under "Environment variables", add:
   - `DATABASE_URL`: the Neon connection string from step 2.
   - `CRYPTO_KEY`: the output of `openssl rand -base64 32`.
   - `ADMIN_EMAILS`: the email address of the School admin's GitHub account.
   - `BASE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_NAME`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_WEBHOOK_SECRET` and `GITHUB_APP_PRIVATE_KEY`: copy each value from `.env.production`. For the private key, turn every `\n` into a real line break.
8. **Deploy.** In Netlify press "Trigger deploy". When it finishes, open `https://sst-csg-editor.netlify.app` and sign in with GitHub.
9. **Delete the downloaded folder**, including `.env.production`. The values now live in Netlify only.
10. **Link the site to the editor.** Set `editorUrl` in `src/_data/site.json` of the site repository to the editor's address. The "Sign in to edit" links then appear on the site.

## Keeping it running

Once a year, or when GitHub shows a security notice on the fork:

1. Open `SST-CSG/pages-cms` on github.com and press "Sync fork", then "Update branch".
2. Netlify deploys the new version by itself. Sign in to the editor and open one form to check that it works.

Also once a year, check that the free plans of Netlify and Neon still exist and still allow this use.

The free Netlify plan has a monthly allowance. If the editor is used far more than expected and the allowance runs out, the editor pauses until the next month. The public site is not affected.

## Passing the editor to a maintainer

No account needs to change hands. The new maintainer sets up their own copy and the old one is switched off:

1. The maintainer becomes an owner of the SST-CSG organisation.
2. They create their own Neon and Netlify projects as in steps 2 and 3. If the Netlify project gets a different name, the editor's address changes.
3. They enter the same settings as in step 7, with their own `DATABASE_URL`. The values of the GitHub App can be read in the old Netlify project, or made anew in the App's settings ("Generate a private key", "Generate a new client secret").
4. If the address changed: in the GitHub App's settings, replace the old address in "Homepage URL", "Callback URL", "Setup URL" and "Webhook URL", and update `editorUrl` in the site repository.
5. They deploy and sign in. Editors only need to sign in again.
6. The previous owner deletes the old Netlify and Neon projects.

## If something goes wrong

- **Nobody can sign in:** check that the Netlify project is not paused and that the last deployment succeeded.
- **A person signs in but sees no group:** they have not been added to the group's repository, or the GitHub App is not installed on it.
- **The editor is gone and cannot be recovered:** follow "First set-up" again. Until then, the site keeps working and shows the last published content.
