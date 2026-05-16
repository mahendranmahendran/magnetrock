# Mapsi Integration Playbook
### Client Onboarding & Project Tracker Template

> **How to use this document:**
> - Copy this file for each new client. Replace every `[PLACEHOLDER]` with real values.
> - Update the status column as work progresses — it doubles as your project tracker.
> - Share with the client at kickoff so both sides know exactly what to expect.

---

## Project Overview

| Field | Value |
|-------|-------|
| Client | [CLIENT_NAME] |
| Website | [CLIENT_DOMAIN] |
| Developer | AlgoLayer Technologies |
| Project type | Mapsi geospatial integration |
| Start date | [START_DATE] |
| Target launch | [LAUNCH_DATE] (Day 20) |
| Deposit (50%) | [DEPOSIT_AMOUNT] |
| Final payment | [FINAL_AMOUNT] |
| Mapsi plan | [FREE / GROWTH / BUSINESS] — £[X]/month |

---

## Clear Wall: Who Does What

| Task | [CLIENT_NAME] | Developer |
|------|--------------|-----------|
| Write code | ❌ | ✅ |
| Configure Mapsi API | ❌ | ✅ |
| Deploy to Vercel | ❌ | ✅ |
| Fix bugs | ❌ | ✅ |
| Test before client sees it | ❌ | ✅ |
| Provide access (Vercel, GitHub, domain) | ✅ | ❌ |
| Review previews & give feedback | ✅ | ❌ |
| Make business decisions (fees, zones, launch date) | ✅ | ❌ |
| Test during UAT | ✅ | ❌ |
| Approve launch | ✅ | ❌ |
| Pay invoices | ✅ | ❌ |
| Post-launch: update data files | ✅ (after training) | Support only |

**Rule:** Client decides WHAT and WHEN. Developer decides HOW.

---

## Phase 1: Pre-Project Setup

| Step | Client Action | Developer Action | Deliverable | Day |
|------|--------------|-----------------|-------------|-----|
| Contract | Sign contract, pay 50% deposit | Send contract + invoice | Signed contract, payment received | Day -2 |
| Kickoff Call | Attend 30-min call, answer questions | Run call, confirm requirements | Aligned on scope & timeline | Day -2 |
| Vercel access | Invite developer email as member | Accept invitation | Developer has Vercel access | Day -1 |
| GitHub access | Add developer as collaborator | Accept invitation | Developer has GitHub access | Day -1 |
| [CLIENT_DATA] | Review extracted list, confirm/correct | Extract data, send for verification | Verified data file | Day 0 |
| Mapsi account | Approve £[X]/month Mapsi subscription | Sign up, generate API key | API key active in Vercel | Day 0 |

**Pre-project checklist for developer:**
- [ ] Contract signed
- [ ] 50% deposit received
- [ ] Vercel access granted
- [ ] GitHub repo access granted
- [ ] [CLIENT_DATA] verified
- [ ] `NEXT_PUBLIC_MAPSI_API_KEY` added to Vercel environment

---

## Phase 2: Week 1 — Core Map Features

**Goal:** Live interactive map with all locations, search by address, nearest locations, and routing.

| Feature | Client Action | Developer Action | Deliverable | Day | Status |
|---------|--------------|-----------------|-------------|-----|--------|
| Foundation | None — no action needed | Create feature branch, build static pages, deploy preview | Preview URL with all pages | 1 | ⬜ |
| Map display | None | Add map library + tiles + [N] location markers with popups | Interactive map on /locations | 2 | ⬜ |
| Day 2 review | Test preview URL, report if location info is wrong | Send preview link | Feedback collected | 2 | ⬜ |
| Search | None | Mapsi Geocoding API + "Use My Location" button | Search by postcode/area working | 3 | ⬜ |
| Nearest locations | None | Haversine distance calculation, top 3 ranked panel | Nearest [N] locations displayed | 3 | ⬜ |
| Routing | None | Mapsi Routing API, draw route on map | "Get Directions" working | 4 | ⬜ |
| Week 1 review | Watch demo video, test on mobile, give feedback by Monday | Record 3-min demo, send review doc | Feedback deadline set | 5 | ⬜ |
| Weekend testing | Test preview on personal phone, gather team feedback | Bug fixes, cross-browser QA | No action — weekend | 6–7 | ⬜ |
| Feedback response | Send consolidated feedback by Monday AM | None — waiting | Email with feedback items | 7 (Mon AM) | ⬜ |

---

## Phase 3: Week 2 — Advanced Features

**Goal:** Coverage zones, booking form autocomplete, drive-time accuracy.

| Feature | Client Action | Developer Action | Deliverable | Day | Status |
|---------|--------------|-----------------|-------------|-----|--------|
| GeoJSON zones | None | Build fixed postcode zone polygons, overlay on map | Visual coverage zones | 8 | ⬜ |
| Isochrone zones | None | Call Mapsi Isochrone API, generate drive-time zones | Split-screen: Fixed vs Isochrone | 9 | ⬜ |
| Zone decision | Review both options, choose Fixed or Isochrone | Present both options, explain tradeoffs | Decision confirmed | 9 | ⬜ |
| Booking autocomplete | None | Address autocomplete on booking form (Mapsi Geocoding) | As-you-type address suggestions | 10 | ⬜ |
| Coverage check | Test addresses: home, office, random postcodes | Turf.js point-in-polygon, show fee/status | "£[X]" or "Not covered" result | 10 | ⬜ |
| Mini-map | None | Small static map on booking form showing user + zone | Visual coverage confirmation | 11 | ⬜ |
| Matrix API | None | Add drive-time ranking toggle (Haversine vs Matrix) | Nearest by drive time | 11 | ⬜ |
| Performance | None | localStorage caching, lazy loading, mobile UX | Faster page loads | 12 | ⬜ |
| Week 2 review | Watch demo, choose zone type, test booking flow | Record 5-min demo, request zone decision | Zone choice confirmed | 13 | ⬜ |
| Final requests | Send last-minute requests | Assess scope, quote if out-of-scope | Scope clarified | 14 | ⬜ |

---

## Phase 4: Week 3 — Testing & Launch

| Step | Client Action | Developer Action | Deliverable | Day | Status |
|------|--------------|-----------------|-------------|-----|--------|
| Functional testing | None | Test all features, cross-browser, document issues | Test report (pass/fail) | 15 | ⬜ |
| Performance audit | None | Lighthouse audit, fix scores <90, load testing | Scores >90 achieved | 16 | ⬜ |
| UAT instructions | Receive email with test checklist | Send UAT email with test cases | UAT email sent | 16 | ⬜ |
| **UAT — CRITICAL** | **Test on real phone, try all features, report bugs by EOD** | None — waiting | Bug list from client | 17 AM | ⬜ |
| Fix UAT issues | None — developer fixes | Fix all reported bugs, redeploy | All bugs resolved | 17 PM | ⬜ |
| Final approval | Review fixes, give written approval: "Ready to launch" | None — waiting | Go / No-Go decision | 17 EOD | ⬜ |
| Domain access | Provide domain registrar login | None — waiting | Domain credentials shared | 18 AM | ⬜ |
| Vercel ownership | Invite developer as Owner | Accept, configure production | Developer is Owner | 18 AM | ⬜ |
| DNS config | None | Point domain to Vercel, verify | Domain connected | 18 PM | ⬜ |
| Soft launch | Test live site internally — do not announce yet | Deploy to production, monitor logs | Site live, not public | 19 | ⬜ |
| Launch approval | Give final "Go Live" approval | Await approval | Approval to announce | 20 AM | ⬜ |
| Public launch | Post on social media, email customers | None — client marketing | Public launch 🚀 | 20 PM | ⬜ |
| Day 1 monitoring | Report any customer complaints | Monitor performance, API usage | Incident log (hopefully empty) | 20–21 | ⬜ |

---

## Phase 5: Handoff & Post-Launch

| Step | Client Action | Developer Action | Deliverable | Day | Status |
|------|--------------|-----------------|-------------|-----|--------|
| Admin training | Watch 10-min training video, ask questions | Record screen capture: how to update data | Training video + Q&A | 21 | ⬜ |
| Documentation | Read UPDATE_DATA.md guide, bookmark it | Write step-by-step guide for updating locations, hours | Admin documentation | 21 | ⬜ |
| Mapsi account transfer | Create Mapsi account with company email | Transfer API key ownership | Client owns Mapsi account | 22 | ⬜ |
| Vercel cleanup | None — already Owner | Remove developer as collaborator (optional) | Clean access control | 22 | ⬜ |
| **Final payment** | **Pay remaining 50% ([FINAL_AMOUNT])** | Send final invoice | Payment received | 22 | ⬜ |
| 7-day support | Report bugs/issues via email or Slack | Fix bugs, answer questions, minor tweaks | Issues resolved | 22–28 | ⬜ |
| Support ends | None | None — project complete | Project closed | 29 | ⬜ |

---

## Ongoing Responsibilities (Post-Launch)

| Task | Client | Developer | Frequency |
|------|--------|-----------|-----------|
| Update location data | Edit `data/[DATAFILE].json`, commit, push | None — client handles | As needed |
| Mapsi API billing | Pay £[X]/month subscription | None — client pays directly | Monthly |
| Vercel hosting | Pay Vercel (free tier or $20/month Pro) | None | Monthly |
| Add new location | Add entry to data file, geocode address, deploy | None (or paid support) | Rare |
| Bug reports | Report via email/Slack | Fix (if under support contract) | As needed |
| Feature requests | Send request, get quote | Quote + implement if approved | Occasional |
| Mapsi API key rotation | Regenerate key, update Vercel env var | None (or paid support) | Yearly |
| Monitor API usage | Check Mapsi dashboard, watch for spikes | None — client monitors | Monthly |

---

## Decision Points (Client Must Decide)

| # | Decision | When | Options | Impact |
|---|----------|------|---------|--------|
| 1 | Coverage zone type | Day 9 | Fixed postcodes OR Isochrone (drive-time) | How coverage is calculated |
| 2 | Home visit fees | Day 10 | Confirm: [fee structure] | Displayed to customers |
| 3 | Closed/hidden locations | Day 9 | Which location(s) to hide | Not shown on map |
| 4 | [Optional feature] | Day 14 | Add now (+[COST]) or skip | Extra feature or not |
| 5 | Launch date | Day 17 | Soft launch Mon, public Wed OR delay | When site goes live |
| 6 | Post-launch support | Day 22 | Monthly retainer OR pay-as-you-go OR self-service | Ongoing relationship |

---

## Communication Protocol

| Scenario | Client Action | Developer Action | Response Time |
|----------|--------------|-----------------|---------------|
| Daily progress update | Read email, reply if questions | Send EOD email: done / next / preview link | EOD Mon–Fri |
| Preview URL sent | Test preview, send feedback within 24h | None — wait for feedback | Client: 24h |
| Bug report | Send: what's broken, screenshot, device/browser | Acknowledge + fix | 2h ack, 24h fix |
| Scope change request | Send: "Can we add [feature]?" | In-scope (free) or quote (out-of-scope) | 4h response |
| UAT feedback | Send all issues by deadline | None — wait for complete list | Client: by deadline |
| Launch approval | Email: "Approved for launch" or "Wait — issue found" | Proceed or fix | Client: same day |
| Post-launch issue | Email/Slack: "Customer reported [X]" | Investigate, fix if bug | 4h ack, 24h fix |
| Feature request | Email: "We want to add [Y]" | Send quote + timeline | 48h quote |

---

## What Client CANNOT Do (Developer Only)

| Action | Why |
|--------|-----|
| Write or modify code | Requires programming knowledge |
| Configure Vercel build settings | Technical — wrong settings break the site |
| Set up or rotate Mapsi API keys | Technical integration |
| Debug console errors | Requires developer tools expertise |
| Optimise performance | Requires profiling tools + code changes |
| Create feature branches | Git workflow knowledge |

---

## What Client CAN Do (After Training — Day 21)

| Action | How | When Available |
|--------|-----|----------------|
| Update location hours | Edit `data/[DATAFILE].json`, commit, push to GitHub | After Day 21 training |
| Add a new location | Add JSON entry + coordinates, commit, push | After Day 21 training |
| Hide a closed location | Change `"status": "active"` to `"closed"` | After Day 21 training |
| Change home visit fees | Edit `data/coverage-zones.json` | After Day 21 training |
| View API usage | Login to Mapsi dashboard at mapsi.dev | Anytime |
| Monitor site | Check Vercel dashboard | Anytime |

---

## Summary: Client vs Developer

**[CLIENT_NAME] (Client):**
- ✅ Provides access (Vercel, GitHub, domain)
- ✅ Reviews previews and gives feedback
- ✅ Makes all business decisions (fees, zones, launch date)
- ✅ Tests during UAT
- ✅ Approves launch
- ✅ Pays invoices
- ❌ Does NOT write code
- ❌ Does NOT configure APIs

**AlgoLayer Technologies (Developer):**
- ✅ Writes all code
- ✅ Configures Mapsi APIs
- ✅ Deploys to Vercel
- ✅ Builds features and fixes bugs
- ✅ Tests before client sees anything
- ❌ Does NOT make business decisions
- ❌ Does NOT approve launch (client does)
