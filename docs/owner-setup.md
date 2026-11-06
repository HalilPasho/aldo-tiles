# Owner setup

Exact steps for Halil, in order. Do them once. The launch steps come later, in [launch-checklist.md](launch-checklist.md).

Facts below were checked on 2026-11-05 against OpenAI's, Netlify's and GitHub's documentation. Dashboard labels change now and then, so if a button is worded a little differently, look for the nearest match.

## Step 1: Review, commit and push

Nothing has been committed yet. Review the work first, because once it's pushed to a public repository its history is public for good.

1. Install and run every check:

   ```sh
   npm ci
   npx playwright install chromium
   npm run check
   ```

   It ends with `All checks passed.` (a few minutes). Optionally, `npm run launch:rehearsal` proves a launched copy of the site would pass too. It takes about a minute and a half and never touches the project.

2. See what git will take, and what it ignores:

   ```sh
   git status --short
   git status --short --ignored
   ```

   The ignored list (`!!`) must include `_old-drafts/` and `.superpowers/`. `_old-drafts/` holds the old drafts and the real Aldo photos, and must never go into git. `.superpowers/` is the builder's scratch folder (plans, reports, review notes). It's git-ignored by its own `.superpowers/sdd/.gitignore`, not by the root `.gitignore`, and you can delete it once the build is finished.

3. Stage everything and read it before committing:

   ```sh
   git add -A
   git diff --cached --stat
   git diff --cached --name-only | grep -iE '\.(jpe?g|png|webp|avif|gif)$'
   ```

   The image list must show only files whose names start with `sample-` (generated placeholders). No real Aldo photo may be in it. Read through the rest of the diff (`git diff --cached`) as you would any pull request.

4. Commit, then create the public repository and push:

   ```sh
   git commit -m "Aldo Tile website: first build"
   gh auth status
   gh repo create aldotile --public --source=. --push
   ```

   If `gh auth status` says you're not signed in, run `gh auth login` first. The branch is `main`.

5. Watch the first run of the checks:

   ```sh
   gh run watch
   ```

   The GitHub workflow has never run before. This push is its first run, and the `check (windows-latest)` job is the project's first real test on Windows. If a job fails, read why with `gh run view --log-failed`, fix it on a branch and open a pull request.

## Step 2: Protect `main`

Do this after Step 1's run has finished, so GitHub has seen the check names.

1. On GitHub, open the repository, then **Settings**. In the left sidebar, under "Code, planning, and automation", open **Rules**, then **Rulesets**.
2. Click **New ruleset**, then **New branch ruleset**.
3. Ruleset name: `Protect main`. Enforcement status: **Active**.
4. Under **Target branches**, click **Add target** and choose **Include default branch**.
5. Tick these rules:
   - **Restrict deletions**
   - **Require a pull request before merging** (leave required approvals at 0, since you are the one who merges)
   - **Require status checks to pass**: type `check (ubuntu-latest)` and press the plus icon, then `check (windows-latest)` and the plus icon. Leave "Require branches to be up to date before merging" off.
   - **Block force pushes**
6. Click **Create**.

Why two names and not `check`: the `check` job runs on two machines (a matrix), and GitHub reports each one separately as `check (ubuntu-latest)` and `check (windows-latest)`. A required check named plain `check` never reports, so every pull request would wait for it forever.

Don't require `lighthouse`. Its performance score moves from run to run on GitHub's shared machines, so as a required check it would sometimes block a good change. It still runs on every pull request: look at it before you merge, and re-run it if it fails by a point or two.

## Step 3: Connect Netlify

1. At [app.netlify.com](https://app.netlify.com/), choose **Add new project**, then **Import an existing project**, then **GitHub**. Allow Netlify to see the `aldotile` repository and pick it.
2. Build settings come from `netlify.toml` (build command `npm run build`, publish folder `dist`), and Netlify reads the Node version from `.nvmrc`. Leave them as shown and confirm with **Publish**. This first production publish uses 15 credits.
3. Optional: give it a readable address under **Project configuration**, **General**, **Project details**, **Change project name**, for example `aldotile`, which gives aldotile.netlify.app if the name is free.
4. **Turn on form detection.** Open **Forms** and select **Enable form detection**. Netlify only scans for forms from the next publish on, so publish again: **Deploys**, **Trigger deploy**, **Deploy project** (another 15 credits).
5. Check it worked. **Forms** should now list a form named `contact`. Open the contact page on the netlify.app address, view the page source, and look for `name="form-name" value="contact"`. Netlify adds that hidden field when it publishes; it isn't in the repository, and that's expected.
6. **Publish only `main`.** Under **Project configuration**, **Build & deploy**, **Continuous deployment**, **Branches and deploy contexts**, click **Configure**:
   - Production branch: `main`
   - Branch deploys: **Deploy only the production branch**
   - Deploy Previews: **Any pull request against your production branch / branch deploy branches**

   Pull requests then get a free preview link, and only merging to `main` publishes the live site.

Until Step 4 is done and tested, real form delivery is unconfirmed. The build checks that the form meets Netlify's requirements, but only Netlify can prove it delivers.

## Step 4: Form email

1. In Netlify, go to **Forms**, **Submission notifications**, and add an **Email notification** for the `contact` form.
2. Enter the address that should receive messages. Netlify only accepts an address that is an active member of your Netlify team, so use your own for now. The receiving address is set here only, never in the repository, because the repository is public.

   **Unconfirmed:** whether the free plan lets you invite Aldo as a second team member, which his address needs before it can receive form emails. Try inviting him under your team's members page. If the free plan doesn't allow it, keep the notification on your own address and set up automatic forwarding of those emails to Aldo in your email account (Netlify sends them from formresponses@netlify.com, so forward mail from that sender), or move to a paid plan that allows more members.
3. Test it. Open the contact page on the netlify.app address and send a message the way a real client would: a real name, a phone number, and full sentences, for example: "Hello, we're planning to retile our main bathroom floor in Mississauga this spring. The room is about 40 square feet. Could you give us a quote?" Netlify's spam filter (Akismet) flags obvious test messages such as "test test", so don't send those.
4. You should land on the thank-you page, the message should appear under **Forms**, `contact`, **Verified submissions**, and the email should arrive (look in junk mail too).
5. If it's missing, switch that form's list to **Spam submissions**. A real message found there can be marked as verified.

## Step 5: Invite your wife

1. She needs a GitHub account. If she has none, she creates one at [github.com/signup](https://github.com/signup).
2. In the repository: **Settings**, **Collaborators**, **Add people**, then her GitHub username. She accepts the invitation from her email.

As a collaborator she can push branches and open pull requests. The ruleset from Step 2 stops anyone, you included, from changing `main` without a pull request.

## Step 6: Her Windows computer

Do this on her computer, signed in to Windows as her. Open **Terminal** (PowerShell) from the Start menu. Codex runs natively on Windows with PowerShell, so no WSL (Linux layer for Windows) is needed: the project goes in a normal Windows folder.

1. **Node 24**, the version in `.nvmrc`. Don't take "latest LTS": that is Node 26 now. Open [nodejs.org/dist/latest-v24.x](https://nodejs.org/dist/latest-v24.x/), download the file ending in `-x64.msi` (`-arm64.msi` on an ARM laptop), and install it with the defaults.
2. **Git and the GitHub CLI** (Codex uses Git to save and undo work, and the GitHub CLI to open pull requests):

   ```powershell
   winget install --id Git.Git -e --source winget
   winget install --id GitHub.cli -e --source winget
   ```

3. Close Terminal and open it again, so it finds the new tools. Check:

   ```powershell
   node --version
   git --version
   gh --version
   ```

   `node --version` must start with `v24`.

4. **GitHub sign-in**, as her:

   ```powershell
   gh auth login
   ```

   Choose GitHub.com, HTTPS, **Yes** to authenticate Git with her GitHub credentials, then log in with a web browser. Then set the name and email her saved work is signed with:

   ```powershell
   git config --global user.name "Her Name"
   git config --global user.email "the email on her GitHub account"
   ```

5. **Codex.** On Windows, Codex is part of the **ChatGPT desktop app**. Install it from the Microsoft Store, or:

   ```powershell
   winget install --id 9PLM9XGG6VKS -s msstore
   ```

   Open it and sign in with her ChatGPT account. OpenAI's pages don't say which plans include Codex in the app, so check hers does. Choose **Codex** from the ChatGPT menu at the top.

6. **Get the project** into her Documents folder:

   ```powershell
   cd $HOME\Documents
   gh repo clone YOUR-GITHUB-USERNAME/aldotile
   cd aldotile
   ```

7. **Install and check:**

   ```powershell
   npm ci
   npx playwright install chromium
   npm run check
   npm run dev
   ```

   `npm run check` should end with `All checks passed.` Then `npm run dev` serves the site at http://localhost:4321/. Open it, see the "Preview: sample content" banner, and press Ctrl+C in Terminal to stop it.

   If `npm` fails with "running scripts is disabled on this system", PowerShell's execution policy is blocking it. OpenAI's Windows page suggests `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`; read [Microsoft's page on execution policies](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies) before running it.

8. **Open it in Codex:** in the ChatGPT app with Codex chosen, click **Add new project** (or Ctrl+O), pick `Documents\aldotile`, and under the message box choose **Ask for approval**, which keeps Codex sandboxed to the project and asking before anything outside it. Ask Codex "Start the site so I can see it." to confirm it works.
9. Show her [START-HERE.md](../START-HERE.md).

## Step 7: Netlify credits

- The free plan has 300 credits a month. Each production publish (every merge to `main`, and every Trigger deploy) uses 15, so about 20 publishes a month at most. Step 3 above already uses 30.
- Deploy Previews for pull requests use no deploy credits, though visits to them count toward usage.
- When credits run out on the free plan, Netlify pauses every project and shows "Site not available" until the next month or an upgrade.
- So merge in batches. Ask her to keep adding to one open pull request until a batch is ready (Codex adds new saves to it), then merge that once. Merging three pull requests one after another is three publishes.
- See current usage in the Netlify dashboard under your team's billing or usage page.

## Merging her work

1. Open her pull request. Both `check` jobs must be green; look at `lighthouse` too.
2. Open the Netlify preview link from the pull request and look at the pages she changed, on a phone width as well.
3. Merge when a batch is ready. Netlify publishes `main` within a few minutes.
