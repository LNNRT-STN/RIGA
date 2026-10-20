# KBC Group: Ecosystem, Kate AI & Visual Design System — Prototype Blueprint

`[n]` = source number (see Sources).

## 1. Context
- Domain this brief targets: **Enterprise FinTech Product Architecture & Conversational AI Experience Design**. It spans brand psychology, design tokens, hybrid conversational AI, permissioned-blockchain tokenomics and embedded third-party ecosystems. Combining front-end UI/UX with back-end AI and distributed-ledger orchestration is the top tier of product engineering [1].
- **KBC Group N.V.** is the benchmark [3]. HQ: Havenlaan 2, Brussels. It is an integrated bank-insurer serving retail, private banking, SME and mid-cap clients. Core markets: Belgium, Czech Republic, Slovakia, Hungary, Bulgaria [3]. Banking and insurance are not run as separate silos: FY25 income was 50% Net Interest Income (NII) and 50% non-NII (insurance underwriting, asset-management fees) [3].
- Delivered digitally via **KBC Mobile**: KBC Mobile, KBC Brussels Mobile and CBC Mobile (BE), plus group apps such as ČSOB Smart (CZ) [5].
- Ranked **#1 Mobile Banking App Worldwide** by Sia (formerly Sia Partners): 135–148 banks, up to 22 countries, 85–100+ criteria [3].

## 2. Brand, Culture & Strategy
### Blue swimmer
- Logo by KAN Design after KBC's founding merger. It sits on top of the Boerentoren (Antwerp) and regional HQs such as Ghent. A stylized human **"blue swimmer"** above bold geometric uppercase type stands for forward momentum, personal agency and adaptability, rather than a vault or heraldic emblem [11].
- Used across KBC Bank, KBC Insurance, KBC Asset Management, KBC Autolease, KBC Securities, KBC Brussels and CBC Banque [11].
- Regional adaptation: KBC Brussels uses a light-blue heart motif (Brussels' heart-shaped perimeter) and partners with local artisans: chocolatier Pierre Marcolini, florist Rouge Pivoine, watchmaker L'Artisan du Temps [17].
- The swimmer is the visual form of the **PEARL+** culture, which governs talent development, risk appetite, sustainability and product design [11].

| PEARL+ | Definition | Product / prototype implication |
|---|---|---|
| **P – Performance** | Deliver on promises; results-driven on time, cost, quality [7] | <4 s transaction screening [20]; instant virtual card/account access after approval [21]; zero-friction straight-through processing [22] |
| **E – Empowerment** | Foster creativity & talent; dare to jump into dynamic flows [7] | Self-service autonomy: proactive financial coaching, budget tools, autonomous AI resolution [3] |
| **A – Accountability** | Always move forward; own every outcome & societal impact [11] | European Accessibility Act (EAA) compliance, transparent AI-disclosure bubbles, CSRD-aligned sustainability tools [1] |
| **R – Responsiveness** | Act readily, sympathetically, agilely on customer suggestions & life events [7] | Move from reactive to predictive outreach (Kate2You) that anticipates needs before a search [2] |
| **L – Local Embeddedness** | Embrace diversity of teams/clients ("adapting to different types of water, even when the tide is rough") [7] | Localized app flavours: KBC Brussels heart campaigns & Expat portals; ČSOB Czech-specific integrations [6] |
| **+ – Plus (Team Blue)** | Collaborate horizontally & vertically across the group; innovate, initiate, share best practice [4] | Unified group architecture designed at Brussels HQ, deployed modularly across BE & CEE [4] |

- Four human-capital pillars that shape how product teams work [18]:
  - **Company Citizens**: continuous adaptation through reskilling and career perspectives.
  - **Inspiring Leaders**: motivate teams to outperform competitors.
  - **Honest Reward**: pay in line with societal standards, gender-neutral, equal pay for equal work.
  - **Cooperative Organisation**: remove organizational waste, complexity, incoherence and silos so cross-functional squads (**Team Blue**) ship end-to-end innovations fast [5].
- Governance: KBC Code of Conduct, Whistleblower Protection Policy, Trustworthy AI frameworks, human-rights commitments aligned with OECD/UN guiding principles [23].

### Strategy: "Differently: The Next Level" + "Save Time. Earn Money (S.T.E.M.) the Ecosphere"
- Premise: basic transactional banking is commoditizing [6]. PSD2 (which introduced AISPs and PISPs), post-PSD2 data-sharing mandates and the digital euro (CBDC) mean banks not embedded in customers' daily non-financial lives risk becoming invisible white-label balance-sheet utilities [25].
- Evolution: 1980s reactive banking → early 2020s predictive (spotting life events such as buying a home) → platform banking that sells the lifestyle solution with financing and insurance embedded [25].
- Belgian footprint: 439 branches, 310 insurance agencies, remote advisory hub **KBC Live**, plus the mobile platform. Together they orchestrate end-to-end journeys in housing, mobility, energy and retail [6].

### Financial & operational benchmarks (headline: "Digital scale and AI autonomy drive industry-leading bank-insurance profitability")
- **FY25** [3]:
  - RoTE 16% (top EU profitability).
  - Cost/income 41% (excl. bank & insurance taxes).
  - Non-life combined ratio 87% (guidance <91%).
  - Credit cost ratio 0.13% (through-the-cycle guidance 25–30 bps).
  - Unfloored fully loaded CET1 14.9%; leverage 5.6%; NSFR 138%; LCR 159%.
- About 100,000 extra BE customers per year, driven by digital. A replicating portfolio invests growing deposits for P&L stability through 2025–2026 [6].
- ESG: Sustainalytics 3rd percentile of 215 diversified global banks; CDP Climate "A List" 3 years running; Double Materiality Assessment under CSRD [3].
- **Ecosystem reach (unique users)**: Belgian customer base (Guardian Angel) 4.0M · group users in contact with Kate 3.2M · active KBC Mobile users BE 2.5M · 4411 parking 1.0M · NMBS train tickets 0.6M · De Lijn transit tickets 0.3M.
- **Kate**: 21,500 queries/day (≈ AFAS Dome capacity). Autonomy: 3Q23 BE 60%, 3Q23 CZ 62%, FY24–25 group ~70%. Kate combines deterministic business rules with conversational LLM reasoning for high-trust queries.
- **Mobile**: NPS +63.3, >50M monthly logins in BE.
- Scorecard data sources: KBC 4Q2025 press & company presentations, 3Q2023 analysts' presentation, Sia global-leader release, Sia Benchmark 2025, Sia Belgian Benchmark, Valderas Kate case study, KBC Sustainability Report 2024, Guardian Angel release.

## 3. Visual Design System
- High-contrast **dual-blue** palette on stark white surfaces with soft neutral-gray containers. Deep navy and Biscay signal security; Cerulean and cyan signal agility and approachability [16].
- **Don't confuse other "KBC" brands when collecting assets**:
  - Kentucky Blood Center (#1E2957, #8C2B86) [36]
  - KiDs Beach Club (PMS 285 #0072BC, PMS 375 green) [37]
  - Keboola Connection (kbc-ui-templates, @keboola/eslint-plugin-design) [38]

| Token | Hex | RGB | HSL | CMYK | PMS | Use |
|---|---|---|---|---|---|---|
| **Cerulean** (primary light blue) | #0097DB | 0,151,219 | 199°,100%,43% | 100,31,0,14 | — | Blue Swimmer, primary buttons, active tab indicators, focal links [32] |
| **Biscay** (corporate deep blue) | #1A4265 | 26,66,101 | 208°,59%,25% | 74,35,0,60 | — | Corporate background, app top nav headers, account cards [32] |
| **Downriver** (dark navy ink) | #0D2A50 | 13,42,80 | 214°,72%,18% | 84,48,0,69 | — | Logo bold type, high-contrast headings, dark-mode surface anchors [34] |
| **Regional Deep Blue** (KBC Ireland) | #003768 | 0,55,104 | 208°,100%,20% | 100,47,0,59 | 2955 C | Regional header variant, deep-blue gradient stop [35] |
| **Regional Light Blue / Cyan** (KBC Ireland) | #00AEEF | 0,174,239 | 196°,100%,47% | 100,27,0,6 | 306 C | Cyan accent, illustration highlights, KBC Brussels heart accents [17] |
| **Pure White** | #FFFFFF | 255,255,255 | 0°,0%,100% | 0,0,0,0 | — | Content cards (max-width 468pt), modals, reversed logo on dark blue [32] |
| **Surface Light Gray** | #F5F5F5 | 245,245,245 | 0°,0%,96% | 0,0,0,4 | — | Web-login body canvas (400px login box), app feed backdrop [33] |
| **Alto** (neutral border gray) | #D1D1D1 | 209,209,209 | 0°,0%,82% | 0,0,0,18 | — | Card borders, dividers, inactive controls, secondary icon strokes [34] |
| **Pure Black** | #000000 | 0,0,0 | 0°,0%,0% | 0,0,0,100 | — | High-contrast body text, monochrome vector marks [34] |
| **Legacy Alert / Table Highlight** | #FFFFCC | 255,255,204 | 60°,100%,90% | 0,0,20,0 | — | Hosted payment page (epay@kbc.be) cell highlight `td.ncoltxtl` [42] |

- Example component (KBC Mobile account card):
  - Biscay header labelled "KBC MOBILE".
  - "KBC Plus Account" balance € 4,825.60.
  - Notification row.
  - Primary Cerulean **New Transfer** button and outlined **Transactions** button.
- Rule shown in that example: Cerulean for interactive focal elements; the Blue Swimmer with Downriver and Biscay for authoritative headers, on White and Light Gray surfaces.

### Typography, layout, accessibility
- Font stack on kbc.be web portals and hosted payments: `font-family: 'Open Sans', Verdana, Arial, sans-serif`. Base size 14px (0.875rem). Cross-origin `font/woff2` webfont delivery [33].
- Brand marks and promo headers pair this humanist sans body with bold geometric uppercase display lettering [12].
- Web login: centered 400px box (`margin: 50px auto`) on a #F5F5F5 canvas. Documents/articles: #FFFFFF cards (`max-width: 468pt; padding: 72pt`) [33].
- Accessibility is a primary architectural constraint under the **EAA**, not an afterthought [1].
  - UX mandate: **"ease of use for everyone: from young people to senior citizens, from 10 to 110 years old"**, with deep screen-reader support and high-contrast hierarchy for blind and visually impaired users [5].
  - Nov 2024: KBC Belgium's UX specialists held Accessibility Days.
  - Campfire AI gave Kate the **highest design & accessibility rating** of 65 Belgian digital assistants [2].
- **Three EAA rules for the prototype** [1]:
  1. LLM (probabilistic) answers render in a custom bubble, visually distinct from deterministic messages. The bubble discloses that the answer is AI-generated and links to its sources.
  2. Chat → spatial tools (full-screen maps, QR scanners) open as seamless in-app sheets, never external browser redirects.
  3. Service locators (e.g. the ATM finder) show granular accessibility attributes, e.g. an audio-accessibility function alongside withdrawals, deposits and PIN changes.

## 4. KBC Mobile: Core Banking + "Beyond Banking"
- **Timeline**:
  - Launched 19 Sep 2011; grew over 15 years from a balance checker into a lifestyle/financial super-app [4].
  - 2021: 1.6M active BE users, 50M monthly logins, 640k unique third-party-service users, >2M third-party transactions, NPS 63.3 [4].
  - 2023–24: 1.95M BE users, >3M customer contacts per business day [8].
  - 2025–26: **>2.5M active BE users** in a BE customer base of >4M [5].
- **Decoupled onboarding**: non-customers can download and use KBC Mobile for third-party mobility, ticketing and ecosystem services without a KBC account or policy [8].
- Account opening: foreign nationals can open accounts from abroad with a foreign or Belgian ID card. Digital onboarding gives instant access after approval. Youth UX: **K'ching** [17].

| Ecosphere | Functions | Entities / partners |
|---|---|---|
| **Core Banking & Payments** | Instant digital account opening with access after approval; virtual & physical card management; PSD2 multi-bank aggregation (external balances); prepaid phone top-ups; utility bills (electricity, water, gas) [15] | KBC Bank, KBC Brussels, CBC Banque, ČSOB; external PSD2 banks [8] |
| **PFM** | Auto spending categorization; income/expense visuals; budget limits; savings goals + alerts; round-up rules; proactive double-payment alerts; financial health & literacy coaching [5] | Native KBC PFM engine & Kate (Kate2You) [5] |
| **Insurance & Wealth** | End-to-end digital underwriting & policy management for car/home/travel (Sia Partners Best UX); digital claims; mutual funds & bonds; youth UX (K'ching) [15] | KBC Insurance, KBC Asset Management, KBC Securities [15] |
| **Mobility (MyMobility)** | Street & garage parking; train/tram/bus tickets; shared car & bike booking; fuel/EV payments; lease car & bike management (incl. breakdown reporting); Brussels Airport Fast Lane & Lounge passes [8] | **4411** (1M users), **NMBS/SNCB** (600k), **De Lijn** (300k), **KBC Autolease**, Brussels Airport [8] |
| **Housing & Energy (MyHome)** | Property search (buy/rent); automated valuation; renovation cost calculator; insulation & solar journeys; real-time energy monitoring; energy contract comparison & switching [6] | Real-estate portals, energy suppliers, insulation/solar installers [6] |
| **Retail, Leisure & Loyalty** | Personalized cashback/discount marketplace; blockchain reward token store; cinema & event tickets, online games, restaurant reservations; eco/gift-voucher balances & payments; loyalty-card wallet [15] | **Kate Deals** (70+ retailers), **Kate Coin Store**, select cinemas, voucher issuers [15] |
| **Info, Vault, Health & Education** | Economic/financial news; encrypted storage (passwords, card numbers, warranties, diplomas); government document inbox; medical data checks, online pharmacy/consultations; online courses & language learning [15] | **De Tijd**, **VRT NWS**, KBC Brussels experts, **eBox**, **IPEX**, health & education partners [15] |
| **Sustainability & Community** | Gamified litter collection (pick up, scan/photograph in app, claim rewards); sustainable-home nudges [15] | KBC Sustainability / Kate Coin rewards [15] |
| **SME & Business** | Company data lookup; employee expenses; invoicing & recovery; flexible staffing, legal/solvency tools; "Light as a Service" smart workplace lighting [15] | **Craydon**, **Billit**, **Go Solid**, **NOWJOBS** [15] |

- **Ecosphere orchestration** [6]. CEO **Johan Thijs**: products are "jigsaw-puzzle pieces"; the ecosphere joins them from idea to fulfilment.
  - Housing example: the app values the property, prices renovation and solar, underwrites the loan and property insurance, and Kate compares and switches the electricity contract.
  - KBC handles all the admin; the user only decides and signs digitally.

## 5. Kate: AI Personal Digital Assistant
- Launched Nov 2020 (5th anniversary Nov 2025). Proprietary assistant built on ML, deep neural networks and NLP. It is a group-wide orchestration layer, not a FAQ bot, and the centerpiece of KBC's customer-interaction strategy [3][6].
- **Usage**:
  - 2021: 4M conversations in 8 months → 1.3M banking/insurance transactions [4].
  - 2023–26: **>3.2M customers** have used Kate [56]. About **21,500 questions/day** in KBC Mobile, roughly the capacity of AFAS Dome, Belgium's largest indoor arena [1].
- **Autonomy rate** (share of cases resolved end-to-end with no human): Q3 2023 BE 60%, CZ 62% → **~70%** in 2024–2026 [27].
- **Awards**:
  - Campfire AI **Best Digital Assistant in Belgium** (of 65), 2023 and 2025.
  - Top evaluations from Deloitte.
  - TechPulse "Best Customer Case 2021" [2].

| Component | Direction / segment | Mechanism / data | Prototype use cases |
|---|---|---|---|
| **You2Kate** (reactive) | Customer-initiated (Retail & Business), text or voice UI (VUI) [1] | Deterministic rule-based intents: 186+ core conversations, 109 knowledge-base modules [1] | Find nearby ATMs with audio; activate Guardian Angel; check card limits; file claims [1] |
| **Kate2You** (proactive) | AI-initiated, triggered by real-time behavioral/transaction signals [2] | 42+ proactive flows fed by banking/insurance data lakes + third-party feeds ("Kate Brain") [1] | Flag double payments; warn of expiring Kate Coins with a €1.10 travel-insurance boost; switch energy contracts [5] |
| **Kate4Retail & mSME** (Kate4MassRetail) | Self-employed, micro-SMEs, SMEs, corporates [9] | Commercial analytics + B2B partner APIs (Billit, Craydon, Go Solid, NOWJOBS) [15] | Invoice recovery, expense submission, commercial credit questions, corporate insurance checks [15] |
| **Kate4Employees** (My Kate) | Branch advisors, KBC Live agents, group staff [24] | Internal advisory synthesis engine + HR workplace copilot [24] | Pre-packaged solutions for complex branch cases; employee well-being & HR workflows [24] |
| **Hybrid LLM pipeline** (third-party queries) | Switch from deterministic routing to probabilistic generation mid-conversation [1] | Rule layer classifies a third-party intent, then passes live kbc.be documentation to an LLM [1] | Answers to unpredictable phrasing about 4411 parking or mobility rules, shown in an EAA AI-disclosure bubble [1] |

- **Kate Brain** draws on KBC banking/insurance data lakes and on external partner feeds [30].
- **Core banking** (balances, card orders, limit changes) stays deterministic and rule-based: answers and state changes must be identical and auditable every time [1].
- **Third-party services** (parking, mobility, partner vouchers) broke the rigid scripts: users phrase things unpredictably and partner docs change often [1].
- The core recognition layer couldn't be replaced without destabilizing banking flows, so KBC built a **hybrid deterministic→probabilistic pipeline** [1]. Flow for *"How do I pay for parking?"*:
  1. The rule layer recognizes the intent as a third-party topic.
  2. Live kbc.be documentation goes to the LLM.
  3. The LLM generates an answer on the fly; the switch is seamless for the user.
  4. The answer shows in the distinct AI-disclosure bubble with source context (EAA).
  5. Edge cases with no verified answer fail gracefully and escalate to a human agent.
- **ATM Locator case study** [1]. Chat is a launchpad into full-screen native views, not text only.
  1. User asks *"Where can I find an ATM around here?"*; Kate replies with a **"Find an ATM"** action button.
  2. The button opens an in-app map with cash points clustered by area and a results list below.
  3. Selecting a cash point opens a detail sheet: address, opening hours, directions, and a capability matrix (withdrawal, deposit, PIN change, audio accessibility).
  4. Chat → clustered map → detail runs as one continuous native experience, not three separate screens.

## 6. Kate Coin (KTC) & Kate Deals
- June 2022: the first financial institution in Europe to launch its own blockchain digital currency, **Kate Coin**, built in-house [31].
- Before launch: internal test with 8,000–9,000 employees and closed-loop festival payment zones (food & drink stands) [22].
- Rolled out to retail customers in BE (KBC Bank, KBC Brussels, CBC Banque) and CZ (ČSOB Smart) [10].
- **Technology**: a programmable **e-money token** under European rules, on a private permissioned **Hyperledger Fabric** blockchain. Shares ledger technology with KBC's *Pontes* blockchain service [22].
- **Closed loop**: works only within KBC Group entities and verified partners; not tradable and worthless outside the ecosystem [22].
- **Programmable**: redemption rules, expiry, eligible merchant categories and exchange multipliers. This turns a loyalty point into a behavioral steering engine that rewards sustainable, ecosystem-aligned choices. Thijs: "the glue that ultimately makes you earn money" [22][6].

| Parameter | Belgium (KBC / KBC Brussels / CBC) | Czech (ČSOB Smart) | Prototype rule |
|---|---|---|---|
| **Base peg** | 1 KTC = at least €1.00 [51] | 1 KTC = at least 1 CZK [10] | Never below 1:1 fiat; stored in the app wallet; doesn't expire on standard retail accounts [10] |
| **Value boost** | e.g. 1 KTC = €1.10 (+10%) on targeted group/partner offers [22] | Up to 3× on partner rewards (e.g. earn 100 KTC at Knihy Dobrovský or Belles Fleurs → 100 KTC = 300 CZK cashback at Foodora) [10] | Offer card shows both *Base Coin Balance* and *Boosted €/CZK purchasing power* [10] |
| **Cash-out** | Cash out to the KBC current account at calendar year-end at 1 KTC = €1.00 [51] | Instant cashback to the current account when claiming a partner reward after a card payment (Kate Coin → Rewards → Claim reward) [10] | Two redemption options: **"Exchange for Partner Voucher"** vs **"Cash Out to Current Account"** [10] |
| **Eligibility / privacy gate** | KBC current account AND **'Personalised'** commercial settings [51] | ČSOB account (earn KTC right after online account opening) [10] | Gate the Kate Coin Store behind GDPR/commercial-personalization consent [51] |

- **Kate Deals**: 70+ retail partners offering instant discounts, vouchers and cashback [15].
- **Where Kate Coins appear in KBC Mobile** [51]:
  - Bottom of the **login screen**.
  - **Start screen**, top-left next to the accounts.
  - **'My KBC' / 'My KBC Brussels'** menu.
  - **'Offer'** tab in the **Kate Coin Store**.
- Kate Coins are **always first in Favourites** and can't be moved or hidden.
- The store is hyper-personalized: two users see different offers based on their transactions and interests [51].
- **Enabling earning** (consent flow) [51]: profile photo or cogwheel (top-left) → scroll to **Privacy** → **Commercial settings** → *"What offers would you like?"* → **Personalised**. This consents to KBC analyzing personal data for tailored offers.
- **Earning** [51]:
  - Buy an eligible KBC banking/insurance product during a promotion → coins credited within **48 h**.
  - Shop at a partner → credited immediately or after the return period ends.
- **Partner voucher codes** (physical or digital) [51]: offer details in the Kate Coin Store → **'Scan QR code'** (bottom of screen). Fallbacks: **'Enter voucher code manually'**, or **'Enter voucher code'** for text-only codes. Coins are minted to the wallet instantly.

## 7. Security: Guardian Angel (*Beschermengel*) & Secure4U
- **Threat**: fraudsters have moved from hacking infrastructure to **"human takeover fraud"**: psychological manipulation, false urgency, romance and friendship scams, fake investments with unrealistic returns, and impersonating bank security staff so victims authorize transfers themselves [20].
- **Timeline** [20]:
  - Announced on Safer Internet Day, spring 2026.
  - Piloted with 2,000 customers, summer 2026.
  - Rolled out to **>4M Belgian customers on 15 Sep 2026**.
- **Build** [20]: under 12 months, by a cross-functional digital-transformation team led by **Karen Van De Woestyne** (Director Digital Transformation & Ecosystems).
- First and only Belgian feature that puts a trusted human contact into real-time payment verification [20].
- **Pilot case** [20]:
  - A scammer convinced customer **Willy** by phone that his accounts were being emptied and needed "securing".
  - KBC paused the transfers and phoned his daughter **Kathleen** at a restaurant.
  - She called him, told him to turn off his computer, and declined the transactions in the app.
- KBC offers the concept to competing banks on request as an industry standard [20].
- The design adds targeted relational friction only for high-risk anomalies, a behavioral-economics principle. Back-office AI (**Secure4U**) works with front-end conversational UX (**Kate**) [20].

| Step | Actor | Action / screen spec |
|---|---|---|
| 1. Conversational initiation | Account holder + **Kate** | Customer asks Kate to activate "Guardian Angel"; Kate routes to the native setup module [20] |
| 2. Physical co-presence pairing | Holder + trusted contact | Guardian Angel (partner, family or friend, **does not need to be a KBC customer**) must be **physically together** with the holder to scan an encrypted pairing QR code, which prevents remote social-engineering hijack [20] |
| 3. Sub-4 s AI screening | **Secure4U** engine | Every transfer is screened in real time by ML against **150+ warning signals and 700 fraud patterns in <4 s** [20] |
| 4. Hold + dual push alert | KBC Mobile + Secure4U | Risky payment goes on **temporary hold**; push notifications go to the holder ("Suspicious payment detected — paused") and to the Guardian Angel [20] |
| 5. Proactive phone verification | Secure4U response team (**+32 16 432 000**) | The 24/7 fraud team **phones the Guardian Angel** to check in with the holder, breaking the scammer's isolation and urgency [20] |
| 6. Privacy-preserving decision | Guardian Angel | Sees **only the flagged transaction** (no balance or history); after talking to the holder taps **Approve** or **Reject**; both get instant confirmation [20] |

- **Other security features** [20]:
  - **4-hour cooldown** before a raised payment limit takes effect, which defeats scammer urgency.
  - **"Check your conversation"**: verifies in real time whether the person on a call claiming to be from KBC really is KBC staff.
  - **IBAN-name check** (introduced with other Belgian banks): automatically matches the beneficiary name to the IBAN with no extra input, and shows a prominent warning before execution if they don't match [65].

## 8. Prototype Implementation Blueprint (Figma or React/TypeScript)
| Module | Spec / hierarchy | Exact rules |
|---|---|---|
| **1. Global theme & tokens** | Root CSS / Figma variables: surfaces, brand blues, typography, WCAG AAA / EAA contrast [1] | Background #F5F5F5. Cards #FFFFFF with 1px solid #D1D1D1. CTAs + Blue Swimmer in Cerulean #0097DB. Nav headers Biscay #1A4265. Display text Downriver #0D2A50. Font 'Open Sans', Verdana, Arial, sans-serif, 14px base [32] |
| **2. Login & start screen** | Pre-login utility bar; authenticated start screen with locked Favourites + ecosphere launchers [8] | Kate Coin widget at the bottom of login and top-left of the start screen next to current/savings accounts [51]. Favourites: **Kate Coins** (fixed first, non-removable) [51] → **4411 Parking**, **NMBS**, **De Lijn**, **MyHome**, **Kate Deals** [8] |
| **3. Kate hybrid chat state machine** | Full-screen chat overlay: Kate2You proactive banners, You2Kate text/voice input, two bubble types [1] | Deterministic banking replies in standard #FFFFFF/#0D2A50 bubbles. Third-party LLM replies in a distinct **EAA AI Disclosure Bubble** accented #0097DB, with an *"AI-generated answer"* badge and collapsible kbc.be source citation [1] |
| **4. Native spatial & security sheets** | Bottom-sheet / full-screen handoffs from action chips in Kate [1] | **ATM Locator**: action chip → clustered area map → capability detail sheet with audio-function badge [1]. **Guardian Angel**: in-person QR pairing screen + privacy-preserving single-transaction hold/approve card [20] |
| **5. Kate Coin Store & privacy gate** | Personalized token storefront (Offer tab) + commercial-consent onboarding [10] | Unconsented users: cogwheel → Privacy → Commercial settings → Personalised [51]. Show 1 KTC = €1.00 base next to boosted multipliers (€1.10 or 3×), year-end cash-out toggle, and the bottom **'Scan QR code'** / **'Enter voucher code manually'** bar [10] |

**Summary**: exact hex palette (#0097DB, #1A4265, #0D2A50, #F5F5F5, #FFFFFF, #D1D1D1) [32] + decoupled Beyond-Banking ecosphere [8] + EAA-compliant hybrid rule/LLM Kate [1] + Hyperledger-backed programmable Kate Coin [22] + Guardian Angel behavioral security loop [20] → a faithful replica of the world's top-ranked digital bank-insurance platform [3].

## Sources
1. Kate, KBC's Digital Assistant – Inti Valderas Caro: https://valderas.be/portfolio/kate-kbc/
2. Resume – Inti Valderas Caro: https://valderas.be/resume/
3. KBC 4Q2025 press presentation: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/4q2025/4q2025-press-presentation.pdf.cdn.res/last-modified/1770833285214/4q2025-press-presentation.pdf
4. KBC Mobile named best mobile banking app worldwide (Sia Partners): https://newsroom.kbc.com/kbc-mobile-named-best-mobile-banking-app-worldwide-by-independent-international-research-agency-sia-partners
5. KBC Mobile best mobile banking app in the world, 2nd year: https://newsroom.kbc.com/kbc-mobile-named-best-mobile-banking-app-in-the-world-for-second-year-in-a-row
6. KBC Customers Save Time and Earn Money – International Banker: https://internationalbanker.com/banking/kbc-customers-save-time-and-earn-money/
7. Our culture – KBC: https://www.kbc.com/en/working-at-kbc/our-culture.html
8. KBC Mobile best mobile banking app in Belgium (3rd time): https://newsroom.kbc.com/kbc-mobile-est-elue-pour-la-troisieme-fois-daffilee-meilleure-app-bancaire-mobile-de-belgique-par-le-bureau-detudes-international-independant-sia-partners
9. KBC Group company presentation 4Q2025: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/4q2025/4q2025-company-presentation.pdf?zone=footer-2
10. Kate Coin – ČSOB: https://www.csob.cz/people/accounts/kate-coin
11. Our brand – KBC: https://www.kbc.com/en/about-us/our-brand.html
12. KBC Brussels logo blue swimmer – CleanPNG: https://www.cleanpng.com/png-kbc-bank-foreign-exchange-market-insurance-investm-bdnh4b/
13. KBC logo illustrations – Dreamstime: https://www.dreamstime.com/illustration/kbc-logo.html
14. KBC – iconic logo on the Boerentoren – KAN Design: https://www.kandesign.com/en/work/kbc
15. Banks Go Beyond Banking (ResearchGate): https://www.researchgate.net/publication/381981675_Banks_Go_Beyond_Banking_The_Expansion_Towards_Non-Banking_Services
16. KBC Bank & Verzekering logo – CleanPNG: https://www.cleanpng.com/png-kbc-bank-ireland-insurance-foreign-exchange-market-c7uw2w/
17. KBC Brussels et ses clients font battre le coeur de Bruxelles: https://www.kbcbrussels.be/particuliers/fr/informations/bruxelles-bat-au-rythme-de-vos-projets.html
18. Our people – KBC: https://www.kbc.com/en/working-at-kbc/our-people.html
19. KBC Risk Report 2025: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/jvs-2025/risk-report-2025.pdf
20. KBC launches 'Guardian Angel' – FF News: https://ffnews.com/news/kbc-brings-guardian-angel-to-more-than-4-million-customers-in-belgium-89e8547e
21. Europe's best digital banks – Euromoney: https://www.euromoney.com/retail-banking/competitive-intelligence/europes-best-digital-banks-the-future-of-retail-banking/
22. Interview with Johan Thijs, CEO KBC Group – International Banker: https://internationalbanker.com/banking/interview-with-mr-johan-thijs-chief-executive-officer-kbc-group/
23. KBC Group's rules and policies: https://www.kbc.com/en/corporate-sustainability/setting-rules-and-policies.html
24. KBC Sustainability Report 2025: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/jvs-2025/csr-sr-2025.pdf
25. Banking is a blend of analog and digital – KPMG: https://kpmg.com/be/en/insights/industries/financial-services-insights/the-future-of-financial-services/banking-is-a-blend-of-analog-and-digital-courtesy-of-the-level-playing-field.html
26. KBC Group 4Q2021 debt presentation: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/4q2021/4q2021-debt-presentation.pdf.cdn.res/last-modified/1644910885881/4q2021-debt-presentation.pdf
27. KBC Sustainability Report 2024: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/jvs-2024/csr-sr-2024.pdf
28. KBC shifts digital transformation up a gear ("Differently: The Next Level"): https://newsroom.kbc.com/kbc-shifts-digital-transformation-and-customer-experience-up-a-gear-with-differently-the-next-level
29. Opening the Gates: Framework for an Open Banking Strategy – ORBi: https://orbi.uliege.be/bitstream/2268/246636/1/Standaert%20et%20al%2017.10.19.docx.pdf
30. KBC 1Q2026 press presentation: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/1q2026/1q2026-press-presentation.pdf.cdn.res/last-modified/1778517921913/1q2026-press-presentation.pdf
31. KBC Keeps Moving to Maintain its Lead – CFI.co: https://cfi.co/banking/2022/11/kbc-keeps-moving-to-maintain-its-lead/
32. KBC Bank&Verzekering brand assets – Brandfetch: https://brandfetch.com/kbc.be
33. 比利时2024年钓鱼诈骗经济损失的技术成因与社会防御机制研究 – Tencent Cloud: https://cloud.tencent.com/developer/article/2596182
34. KBC logo SVG – CDNLogo: https://cdnlogo.com/logo/kbc_34101.html
35. KBC Bank Ireland brand color codes – BrandColorCode: https://www.brandcolorcode.com/kbc-bank-ireland
36. 2024 KBC Brand Guidelines (Kentucky Blood Center): https://s3.amazonaws.com/ky-blood-center/65edb14a-7f35-4a29-a7b5-438f16decc40/2024KBCBrandGuidelines.pdf
37. KiDs Beach Club style guide: https://www.kidsbeachclub.org/images/uploads/KBC_style_FULL_UPDATED.pdf
38. keboola/kbc-ui-templates – GitHub: https://github.com/keboola/kbc-ui-templates
39. @keboola/eslint-plugin-design – npm: https://www.npmjs.com/package/%40keboola%2Feslint-plugin-design
40. keboola-adform-masterdata-extractor README_KBC.md: https://github.com/davidesner/keboola-adform-masterdata-extractor/blob/master/README_KBC.md
41. Gamerboostco: https://gamerboostco.com/
42. Paypage e-Commerce hosted payment page: https://support-paypage.ecom-psp.com/integration-solutions/integrations/hosted-payment-page
43. Paypage e-Commerce (DE): https://support-paypage.ecom-psp.com/de/integration-solutions/integrations/hosted-payment-page
44. Check HTTP Security Headers (doctena.be): https://www.securityheaders.nl/?domain=doctena.be
45. Baker Hughes logo – CleanPNG: https://www.cleanpng.com/png-baker-hughes-a-ge-company-logo-petroleum-industry-8igtfq/
46. KBC brings guardian angel to >4M customers – KBC newsroom: https://newsroom.kbc.com/kbc-brings-guardian-angel-to-more-than-4-million-customers-in-belgium
47. KBC Mobile again best mobile banking app in Belgium: https://newsroom.kbc.com/kbc-mobile-again-crowned-best-mobile-banking-app-in-belgium-by-independent-international-research-agency-sia-partners
48. Fintech Belgium – KBC Kate Voice User Interface – Ergomania: https://ergomania.eu/fintech-belgium-kbc-kate-voice-user-interface/
49. Open Banking Interviews: Karin Van Hoecke – The Banking Scene: https://thebankingscene.com/opinions/obi-karin-van-hoecke-general-manager-digital-transformation-kbc-bank-insurance-belgium/
50. Third-quarter result of 877 million euros – KBC: https://newsroom.kbc.com/kbc-group--third-quarter-result-of-877-million-euros
51. KBC Brussels Kate Coin FAQ: https://www.kbcbrussels.be/retail/en/products/payments/self-banking/on-your-smartphone/mobile/mobile-faq/kate-coin.html
52. Light as a Service – KBC Commercial Banking: https://www.kbc.be/commercial-banking/en/article/services/light-service.html
53. KBC Risk Report 2023: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/jvs-2023/risk-report-2023.pdf
54. KBC Annual Report 2025: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/jvs-2025/jvs-2025-grp-en.pdf
55. Research Handbook on FinTech – dokumen.pub: https://dokumen.pub/research-handbook-on-fintech.html
56. KBC company presentation 1Q2023: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/1q2023/1Q2023-presentation-company.pdf?zone=footer-2
57. KBC analysts' presentation 3Q2023: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/3q2023/3q2023-analysts-presentation.pdf?zone=
58. KBC press presentation 3Q2025: https://wcmassets.kbc.be/content/dam/kbccom/doc/investor-relations/Results/3q2025/3q2025-press-presentation.pdf.cdn.res/last-modified/1762964973241/3q2025-press-presentation.pdf
59. KBC press presentation 4Q2022: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/17-febr/20230217-4q2022-press-presentation.pdf
60. KBC analysts' presentation 2Q2022: https://www.kbc.com/content/dam/kbccom/doc/investor-relations/Results/2q2022/2q2022-analysts-presentation.pdf?zone=
61. All press releases 2022 – KBC: https://www.kbc.com/en/newsroom/press-release-archive/2022/alle-onderwerpen.html
62. KBC creates a first in Europe with the Kate Coin: https://newsroom.kbc.com/kbc-creates-a-first-in-europe-with-the-kate-coin-its-own-digital-coin-based-on-blockchain
63. Institutional adoption of LF Decentralized Trust technologies (2026): https://www.lfdecentralizedtrust.org/hubfs/LFDT%20Institutional%20Adoption%20-%20Ledger%20Insights%20Report%202026.pdf?hsLang=en
64. KBC rolls out 'guardian angel' to 4M+ customers – Renascence: https://www.renascence.io/news/66164/kbc-rolls-out-guardian-angel-fraud-feature-to-4m-customers
65. A first in Belgium: activate "Guardian Angel" – KBC newsroom: https://newsroom.kbc.com/a-first-of-its-kind-in-belgium-activate-guardian-angel-for-suspicious-payments
66. KBC brings 'guardian angel' to >4M customers – Finextra: https://www.finextra.com/newsarticle/48401/kbc-brings-guardian-angel-to-more-than-4-million-customers-in-belgium
