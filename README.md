# Next Role — Android Job Agent

Mobile-first Android job discovery on GitHub Pages, with daily GitHub Actions collection and optional Gemini analysis. No dependency installation, paid search provider, custom domain or always-on server is required.

## What is implemented

- Chennai, Bangalore/Bengaluru and remote job matching; India country restrictions checked when supplied.
- Kotlin, Java, MVVM, Coroutines, Hilt, Retrofit, Room, Firebase, BLE, SDK, IPC and serial keyword matches.
- Target INR 9 LPA annually when structured salary data is available. Unknown salaries remain visible. Other currencies/pay periods require review; no guessed conversions.
- Experience parsing is best effort. Roles explicitly requiring over 5 years are filtered. Scores are transparent keyword heuristics, not AI probabilities.
- Compose requirements are flagged for review, not counted as established candidate experience.
- Saved, Applied, Interview and Rejected status stored only in the current browser; JSON export/import supports backups and device transfers.
- Source success/error status, collection timestamp and stale-data warnings. No fabricated example jobs.
- One optional Gemini request for up to five results. Failure never prevents basic job discovery.

## Deploy to Naveen3195/android-job-agent

1. Use a **public personal repository** with `main` as the default branch for this free GitHub Pages setup. The site and code will be public. Do not upload your resume, phone number, current employer details, passwords or API keys.
2. Copy this project's contents to the repository root, keeping `site/`, `scripts/`, `tests/` and **`.github/workflows/refresh.yml`** in their exact paths. Commit to `main`. A ZIP must be extracted first; uploading the ZIP alone will not run the application.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Refresh jobs and deploy → Run workflow → main**. A push may already have started the first run; after enabling Pages, rerun a failed initial deployment.
5. Read the workflow's deployment link. The expected URL for this repository is `https://naveen3195.github.io/android-job-agent/`, but it is live only after successful Pages deployment.
6. Open that URL on your phone. The workflow is scheduled daily at **08:17 India time** (02:47 UTC). The website Reload button retrieves published results; it does not start a new background collection. The separate GitHub link lets the signed-in repository owner run the workflow manually.

### Upload from a computer

GitHub browser upload may omit the hidden `.github` directory. Add the workflow separately with **Add file → Create new file**, and name it `.github/workflows/refresh.yml`, then paste the supplied YAML. Keep `site/data/jobs.json` included; the initially empty file is intentional.

Alternatively, in a normal local Git checkout, copy these files into that checkout (including `.github`), then use GitHub Desktop to commit and push. No tokens need to be sent through chat.

## Optional Gemini: keep the project on Free tier

The app works without a Gemini account/key. Your Gemini Pro subscription does not automatically pay for API calls. Only enable this option for a project you have confirmed is on the Gemini API **Free tier**, with no linked paid billing.

1. Repository **Settings → Secrets and variables → Actions → Secrets → New repository secret**: name `GEMINI_API_KEY`, value your API key. Never put it in HTML/JavaScript or commit it.
2. Under **Variables**, add `GEMINI_MODEL` with a currently available **free-tier text model ID** shown in your AI Studio project and the official pricing page. No model is silently selected or upgraded by the code.
3. Add `GEMINI_FREE_TIER_CONFIRMED` = `true` and `ENABLE_GEMINI` = `true` under Variables only after the free-tier check.
4. Run the workflow. `AI analysis: ok` means enrichment succeeded; `unavailable` means basic matching continues.

The code cannot inspect or enforce Google's billing configuration. These variables are your confirmation, not a technical spending cap. If billing is later enabled on the Google project, requests may become billable; set `ENABLE_GEMINI=false` first to preserve a no-additional-cost setup. No paid fallback, grounding/search tool, retry loop, or billing upgrade is implemented. Only public job descriptions and a generic skills profile are sent to Gemini, not a resume or contact information. Free-tier content may be used by Google to improve products.

## Sources and coverage

`sources.json` contains a small configurable starting list of company board identifiers and Himalayas queries. Company board identifiers can move or stop working; these are not a verified list of current Android vacancies. Their errors are visible in the dashboard. Add verified Greenhouse or Lever board identifiers to broaden Chennai/Bangalore coverage.

- [Himalayas public API](https://himalayas.app/docs/remote-jobs-api): free, no key required, subject to shared limits. Search cached daily; fetched once per scheduled run. Keep visible source attribution and use the provided Himalayas application links. This personal dashboard must not syndicate the data to other job boards or search indexes.
- [Greenhouse Job Board API](https://docs.greenhouse.io/job-board): read public postings for configured company boards.
- [Lever Postings API](https://github.com/lever/postings-api): public postings per configured company. Server-side collection avoids browser CORS restrictions.

This is not a full LinkedIn/Naukri/Indeed search service. No login scraping, automated applications or messaging is included. Remote country/timezone eligibility, salary, exact experience and willingness to accept immediate joiners require employer confirmation. Roles may close between collection and application. Some location wording or combined-role descriptions can be misclassified by keyword matching.

On partial source failure, results come from successful sources only. On total source failure, a cached previous bundle is retained when available, with an explicit warning and original timestamp. If cache is unavailable, no old results can be restored. Workflow artifacts have one-day retention; one small JSON cache holds previous results.

## Free hosting limits

GitHub Free supports Pages in public repositories, and standard GitHub-hosted Actions runners are free for public repositories, subject to usage policies and limits. This workflow uses a standard Ubuntu runner, a bounded runtime and one small Pages artifact; it does not provision a paid server. Do not switch to larger paid runners. GitHub schedules may be delayed or skipped and may disable after 60 days of repository inactivity. This is not an exact-time monitoring service. Provider pricing and terms can change.

References: [Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage), [schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Local development

Requires Node.js 22+ (no npm packages required) and Python 3 only for serving a preview.

```bash
npm test
npm run collect
npm run serve
```

Open `http://localhost:8000`. A network connection to job providers is required for collection. A direct `file://` open cannot reliably fetch the JSON file. To test UI without collecting, run the server; the empty state is a normal starting state.

## Validation of this package

Node tests cover matching, India eligibility, experience/salary handling, duplicate and unsafe-link removal, partial-source failure, expired feed entries, and Gemini opt-in/quota failure. Live source fetching, authenticated Gemini requests, browser rendering and GitHub deployment must be verified in the target environment; no successful live deployment is implied by this package.
