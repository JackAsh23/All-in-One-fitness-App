# GitHub Pages — one-time setup

The **Deploy Pages** workflow failed on first merge because GitHub Pages was not enabled for this repository.

## Enable Pages (repo owner)

1. Open **Settings → Pages** for this repo:  
   https://github.com/JackAsh23/All-in-One-fitness-App/settings/pages

2. Under **Build and deployment**:
   - **Source:** GitHub Actions

3. Save. No branch or folder selection is needed when using Actions.

## Redeploy

After Pages is enabled, re-run the deploy workflow:

1. Go to **Actions → Deploy Pages**
2. Click **Run workflow** on branch `main`

Or push any commit to `main` to trigger deploy automatically.

## Verify

When deploy succeeds, the app should load at:

**https://jackash23.github.io/All-in-One-fitness-App/**

Check the workflow run for the exact URL under **deploy → environment → View deployment**.

## CI

**CI** workflow (build + test) runs on every PR and push to `main`. It does not require Pages to be enabled.
