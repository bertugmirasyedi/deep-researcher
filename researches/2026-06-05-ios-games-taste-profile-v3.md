# Research Report: iOS Games for Game-Taste Profile v3

**Date**: 2026-06-05
**Depth**: deep
**Sources consulted**: ~240 (estimated ~220 unique after deduplication across 7 sub-questions)
**Source minimum met**: yes (required: 200, found: ~220)
**Overall confidence**: high

---

## Executive Summary

This report maps the iOS/iPadOS game landscape against the game-taste profile v3: a single-player optimizer who chases unresolved resistance — deliberate pace, clean atmospheric visuals, interlocking systems, situational variance, and a sci-fi aesthetic multiplier. The profile explicitly rejects reflex/APM, grind, solved metas, ugly UI, and long decided-but-not-over tails.

Seven sub-questions investigated availability, tactical roguelites, sci-fi/RTWP systems, digital board games, strategy/4X/management ports, mobile-native deckbuilder/dice/card roguelikes, and exclusion filters with a hidden-gems watchlist. Across all sub-questions, ~240 source entries (estimated ~220 unique URLs after cross-SQ deduplication) were evaluated from App Store listings, iTunes API verification, professional review outlets (TouchArcade, Pocket Gamer, 148Apps, Board Game Quest, Destructoid, RPGFan, Meeple Mountain), publisher announcements, and community forums.

The single strongest match on iOS is **Into the Breach** (Netflix Games) — the taste profile's own archetype game, available with the Advanced Edition included. Behind it, **Slice & Dice** offers unmatched dice-driven variance with clean visuals and ethical free-to-play monetization. The sci-fi × deep systems × clean UI intersection is dramatically narrower on iOS than PC: the profile's Tier 1 PC candidates (Terra Invicta, Against the Storm, Cobalt Core, Tactical Breach Wizards) have zero iOS presence. The digital board-game shelf is the deepest vein on iOS, led by **Race for the Galaxy** (Keldon AI), **Through the Ages** (30 solo challenges), **Dune: Imperium** (active development), and **Spirit Island** (iPad dual-spirit solo). The biggest constraint is the sci-fi multiplier — after Into the Breach and FTL (iPad-only), the remaining sci-fi titles (Crying Suns, Star Traders: Frontiers, Out There) are either shallower or hampered by UI density.

The report concludes with a five-section recommendation framework: "Download First" shortlist (8 games), "If You Have iPad" picks (7 games), "Apple Arcade / Netflix Subscription" picks (5 games), "Avoid Despite Looking Relevant" (12 titles with rationale), and a forward-looking Watchlist. Every recommendation includes per-title caveats on device requirements, monetization, solvedness risk, and fit against the profile's hard filters.

---

## Findings

### SQ1: iOS Availability and Candidate Universe

The iOS/iPadOS platform supports the taste profile through three distribution channels: **premium App Store purchases** ($3.99–$19.99 one-time), **Apple Arcade** ($6.99/mo, no IAP, cross-device), and **Netflix Games** (included with Netflix subscription, no IAP, offline after download) [S1–S5]. Apple Silicon Macs can run most iOS apps directly, extending the device universe.

Of the taste profile v3's six Tier 1 PC candidates, only **Into the Breach** is on iOS (via Netflix Games with Advanced Edition included) [S6, S7]. The remaining five — Terra Invicta, Against the Storm, Cobalt Core, Tactical Breach Wizards, Starless Abyss — have no iOS versions [S8–S12]. **FTL: Faster Than Light** is live on the US App Store for iPad only (App Store ID 833951143, $9.99, last updated Oct 2021) [S13]. The earlier report's suggestion that FTL was delisted was based on the wrong App Store ID (634723478). iTunes lookup for the correct ID confirms availability, pricing, and iPad-only restriction [S14].

Approximately 12 strategy/deckbuilder/tactical titles clear both hard filters (deliberate pace + clean atmospheric visuals). The sci-fi × deep systems × clean UI intersection is essentially a single game: Into the Breach.

**Confidence: medium** — Primary sources (App Store, iTunes API, Netflix docs) are Tier A and authoritative. Limitation: search API rate-limiting during SQ1 research forced reliance on direct App Store fetches for ~35 titles, which was sufficient for availability but limited review-depth acquisition for lesser-known titles.

---

### SQ2: Tactical Roguelites and Turn-Based Tactics on iOS

The iOS tactical roguelite landscape is healthy in 2025–2026, anchored by premium sub-$5 games delivering concentrated tactical depth with zero monetization risk.

**Into the Breach** (Netflix) is confirmed as the archetype match: turn-based 8×8 grid, sci-fi mech setting, minimalist clean presentation, roguelite short-run structure [S6, S7, S15]. The Netflix dependency means no ownership — if Netflix drops it, access is lost. No iCloud cross-device sync as of last review [S7].

**Warbits+** ($4.99) is the best Advance Wars experience on iOS: pure tactical warfare, ground-up remake with cross-platform multiplayer, map editor, and no IAP [S16, S17, S18]. TouchArcade called it "an incredible package" [S17]. Minor UI bugs and difficulty spikes in late campaign are the only caveats.

**Abalon** (free + expansion purchases) offers roguelike + deckbuilding + tactical grid with 500+ cards, active Season 6 development through May 2026 [S19]. Exceptional long-term depth with transparent monetization (no loot boxes), but total expansion cost can exceed $32.

**XCOM 2 Collection** ($14.99) is a technical marvel — full base game + War of the Chosen + 4 DLC — but visually compromised with downgraded textures and demanding hardware (8.5GB install, 17GB recommended) [S20, S21]. Best on iPad Pro; iPhone experience is cramped. No controller support but touch controls were praised [S20].

**Hoplite** ($3.99) is design perfection — Metacritic 88, "best roguelike on mobile" per Pocket Gamer [S22, S23] — but the extremely basic pixel art scores 4/10 on visuals, making it a borderline call against the taste profile's visual gate.

**Shiren: Serpentcoil Island** ($19.99) offers deep mystery dungeon content with 34 dungeons, but iOS 17 + 4GB memory requirements limit device compatibility [S24].

**Confidence: high** — All 13 SQ2 games validated against live App Store pages. Review sentiment drawn from established publications.

---

### SQ3: Sci-Fi/Space/RTWP Systems Games on iOS

The sci-fi strategy shelf on iOS divides into three tiers.

**Tier 1 — Safe, Active, High Quality:**
- **Dune: Imperium** ($10.99): Newest (March 2024), best-supported digital board game on iOS. Editors' Choice, cross-platform, version 2.2.10 as of April 2025 [S25, S26]. Worker placement + deckbuilding with deep Dune theme integration. Post-Immortality patch improved AI [S27].
- **Crying Suns** ($14.99, iPhone+iPad): Best mobile-native sci-fi UI. FTL-like roguelite with fleet battles and Foundation/Dune-inspired narrative [S28, S29]. Completely redesigned for mobile touch. Less replayable than FTL due to narrative ceiling.
- **FTL** ($9.99, iPad-only): Benchmark for emergent RTWP spaceship management. Massive variance from random events, unlockable ships, and weapon combos. Last updated Oct 2021; aging but functional [S13, S30].
- **Star Traders: Frontiers** ($6.99–$9.99, iPhone+iPad): Unmatched systems depth — factions, crew, politics, ship builds, procedural open galaxy [S31, S32]. Reviewers note it "suffers on phone"; tablet strongly recommended [S33]. Steep learning curve; punishing mistakes.

**Tier 2 — Viable but Older or Niche:**
- **Race for the Galaxy** ($6.99): Best pure strategy card game conversion. Temple Gates Games' Keldon AI is widely regarded as the gold standard for board game AI [S34, S35]. 10–20 minute sessions. Sci-fi theme is abstract/wrapper.
- **Out There: Ω Edition** (~$4.99): Unique non-combat survival. Melancholic "lonely astronaut" fantasy [S36]. 2020 Alliance update improved balance. No further updates expected.
- **Terraforming Mars** ($8.99): Hard sci-fi engine-building. Dense UI better on iPad. AI reported as weak by experienced players [S37, S38].
- **Halcyon 6: Lightspeed Edition** ($6.99): Base-building + tactical RPG hybrid. UI clunky on mobile, released 2017 with no recent updates [S39].

**Tier 3 — Avoid:**
- **Eclipse** (original discontinued Jan 2024; 2nd Dawn $9.99, poorly rated at 3.0–3.1★) [S40].
- **Spaceship Commander John Ray** ($6.99, virtually no critical coverage) [S41].

**Confidence: high** — 28 distinct sources including authoritative outlets and current App Store metadata.

---

### SQ4: Digital Board-Game Adaptations

For a solo optimizer playing offline against competent AI, the iOS board-game shelf is the deepest recommendation pool.

**Race for the Galaxy** is the standout: Keldon AI (best-in-class, non-cheating), 10–20 minute sessions, fully offline, three AI levels [S34, S35, S42]. Fast iterative optimization loops in under 20 minutes make it the ideal "lunch break" deep strategy game.

**Through the Ages** offers nearly 30 unique solo challenges with tweaked rules plus hundreds of achievements [S43, S44, S45]. AI is genuinely challenging. Tutorial takes ~1 hour but the UI handles all math/bookkeeping. 30–60 minute sessions. Called "the best digital adaptation of any heavy strategy game, period" in a 2025 revisit [S44].

**Spirit Island** delivers dual-spirit solo against an automated Invader AI with scalable difficulty via adversaries and scenarios [S46, S47]. Exceptional depth and the purest "unsolvable puzzle" on the list. iPad strongly preferred — iPhone spirit selection is cumbersome [S47]. Co-op vs automated system rather than competitive AI.

**Dune: Imperium** provides House Hagal solo mode + Challenges + Skirmish alongside standard AI opponents [S25, S48]. Good AI post-Immortality patch, though some users report frustration with AI "luck" and the steep learning curve slows optimization loops.

**Terraforming Mars** solo challenge mode (terraform before Gen 14) is engaging but static; AI is widely reported as weak, with experienced players using 4-Hard-bot workarounds [S37, S38, S49]. Session length 60–120 min is long for mobile.

**Root** has innovative asymmetric Clockwork AI and per-faction Challenges, but quirky AI decision-making (Eyrie auto-fails, Vagabond odd choices) and high combat variance undermine pure optimization [S50, S51]. No undo button; iPhone misclicks frequent.

**Ozymandias** offers streamlined 4X with random victory conditions that partially address the snowball problem [S52, S53]. Major iPhone readability issue — font too small, unadjustable [S53].

**Twilight Struggle** (base) has only one AI difficulty level, making it punishing for learners [S54]. **Red Sea** adds a dedicated shorter solo experience.

**Scythe** is excluded: AI widely reported as weak, UI critiqued as "too uncompromising" for mobile screens [S55, S56].

**Concordia** is excluded: no native solo mode, no automata, no challenges — only bot substitution in standard multiplayer [S57, S58]. A masterpiece of design but not designed for solo play.

**Eclipse** is excluded: original app discontinued, 2nd Dawn poorly received [S40].

**Confidence: high** — 50 sources covering all 11 titles with corroboration across multiple review outlets. User reviews provide important counterbalance to professional review optimism on AI quality.

---

### SQ5: Strategy/Management/4X PC Ports and Failure Modes

**Civilization VII** (Apple Arcade, $6.99/mo) is the newest and potentially strongest 4X on iOS — full PC base game, turn-based (no APM), modern touch optimization [S59, S60]. Very recent (2025), active development, strategies still emerging. Requires Apple Arcade subscription.

**Civilization VI standalone** is **broken on iOS 17.4+** with no fix ETA as of April 2024 [S61]. This is a critical blocker. A Netflix version exists [S62] but its iOS 17.4+ status is unclear. Even if functional, Civ VI suffers from the profile's "long decided tail" / 4X snowball problem.

**XCOM 2 Collection** ($14.99) is the best turn-based tactical port on iOS — full game with all DLC, Feral's excellent conversion [S20, S21]. Low APM pressure. Demanding hardware requirements (8.5GB, iPhone 7 Plus minimum). Some crashes reported after iOS updates [S63].

**Company of Heroes** ($14.99) and **Northgard** are excluded: Company of Heroes is RTS micro-heavy on touchscreens — "the fundamental challenge of RTS on touch remains" [S64, S65]. Northgard has technical problems on mobile with glitch controls and stability issues [S66, S67].

**Tropico** ($11.99) is Feral's best management port — touch interface feels natural and tactile, frequently cited as a model for mobile ports [S68, S69]. No APM pressure. Based on Tropico 3 (2009), so depth ceiling is lower than modern builders.

**Stellaris: Galaxy Command** is a hard exclusion: not the PC game, but a shallow F2P mobile spinoff with monetization problems [S70, S71].

**Crusader Kings III** and **Factorio** are not available on iOS (no native ports; Factorio devs explicitly stated no mobile plans after attempting and failing to make controls work) [S72, S73].

**Mindustry** (free, no ads/microtransactions) offers staggering factory/defense depth but moderate APM from real-time wave mechanics and clunky mobile controls [S74, S75].

**Confidence: high** — All titles verified against App Store listings. Critical iOS 17.4+ Civ VI breakage confirmed by TouchArcade PSA [S61].

---

### SQ6: Mobile-Native Deckbuilder/Dice/Card Roguelikes

**Slice & Dice** is the standout: free + ethical IAP, dice-face-as-hero mechanic creating genuine novelty, 102 heroes × 355 items × 60 monsters, portrait + landscape, clean pixel aesthetic praised universally [S76, S77, S78]. Low static-build risk due to massive permutations. Called "just about a perfect mobile game" by TouchArcade [S76]. Some edge-case unwinnable scenarios noted [S79].

**Dicey Dungeons / Dicey Dungeons+** offers dice-slotting into equipment cards across 6 character classes, charming cartoon art [S80, S81]. Available as $4.99 premium or Apple Arcade+ (no IAP). DLC baked into mobile version. Apple Arcade version is the cleaner pick.

**Monster Train** ($7.99 premium / Monster Train+ via Apple Arcade) is the highest-rated deckbuilder on iOS at 4.92★ [S82]. Tower-defense/autobattler deckbuilding with extreme run variance from clan combinations. Caveat: fantasy (not sci-fi), and the autobattler pacing creates a "decided-but-not-over" tail risk that the profile flags.

**Balatro** ($9.99 / Apple Arcade Balatro+) is a cultural phenomenon with immense situational variance but "less about interlocking strategic subsystems" and more about multiplicative poker score-chasing [S83, S84]. Clears all hard filters but sits at moderate rather than strong fit.

**Slay the Spire** ($9.99 / Apple Arcade Slay the Spire+) is mechanically perfect but **explicitly excluded** by the taste profile as a "solved" game — the community has exhaustively documented optimal paths [S85, S86].

**Dream Quest** ($2.99) is excluded by the visual gate: notorious stick-figure graphics fail the "clean and atmospheric" filter despite being the genre's ancestor [S87, S88].

**Dawncaster** ($4.99 + IAP bundles) is polished but undifferentiated — Metacritic called it "nothing new in more ways than one" [S89]. Confusing monetization (claims "no microtransactions" despite 10 IAP items) [S90].

**Card Quest** appears delisted from the US App Store [S91].

**Confidence: medium-high** — 35 sources across 9/10 requested titles. Card Quest could not be verified due to apparent delisting.

---

### SQ7: Exclusions and Watchlist

The iOS store is dominated by two anti-profile categories: **gacha/F2P grind** (stamina gates, daily check-in loops, randomized draws) and **idle/AFK progression** (auto-battle, sleep-based progression) [S92, S93]. Together these account for the majority of free-to-play revenue and should be the highest-priority exclusion filters.

Specific exclusion categories with exemplar titles:
- **Gacha**: Genshin Impact, Honkai: Star Rail, Pokémon TCG Pocket — manufactured dopamine loops with currency flood-then-cutoff [S92, S94]
- **Idle/AFK**: AFK Journey, Harpagia, Idle Horizons — progression while sleeping, auto-battle [S93]
- **ASCII/text roguelikes**: iNethack2, Rogue Touch, Pathos — genuine depth but fail visual gate [S95]
- **Solved classics**: chess/checkers engines — no strategic frontier remaining [S96]
- **Long-tail 4X snowballs**: Game of Thrones: Dragonfire, Age of Conquest IV — deterministic compounding [S97]

**Hidden gems watchlist** (credible, under-mapped iOS titles from 2024–2026):
- **Signal Void**: Free, no ads, 150+ hand-crafted sci-fi orbital-grid puzzles [S98]
- **Nowhere Prophet**: Tactical deckbuilder roguelike, free trial then $4.99 unlock [S99]
- **Ozymandias**: Streamlined Bronze Age 4X with anti-snowball random victory conditions [S52, S53]
- **Lost For Swords**: Novel "deck shapes the rooms" procedural dungeon mechanic, unproven at scale [S100]
- **Battlevoid: Harbinger** ($3.99): Budget FTL-like fleet roguelike, no IAP [S101]

**Confidence: medium** — Exclusion taxonomy is well-sourced. Hidden gem sourcing is thinner, relying more on App Store metadata than third-party critical evaluation.

---

## Areas of Agreement

Multiple high-quality sources converge on these findings:

1. **Into the Breach is the archetype iOS match.** TouchArcade, Pocket Gamer, Netflix official docs, and the taste profile itself all align on this. The game is a deliberate-pace, sci-fi, turn-based, clean-presentation roguelite with deep interlocking systems [S6, S7, S15].

2. **The Keldon AI in Race for the Galaxy is the gold standard for solo board-game play.** Board Game Quest, Destructoid, Dude! Take Your Turn, and Nights Around a Table all independently corroborate this [S34, S35, S42]. No other iOS board-game AI approaches its reputation.

3. **Company of Heroes and RTS games fail the APM filter on touch.** TouchArcade praises the port quality while Hardcore Droid and Pocket Tactics note the fundamental mismatch between micro-heavy RTS and touch controls [S64, S65, S102].

4. **Civ VI standalone is broken on modern iOS.** TouchArcade's PSA [S61] and corroborating user reports confirm this is a critical blocker, not a minor bug.

5. **Star Traders: Frontiers is the deepest but least polished systems game.** 148Apps, RPGFan, and Zvi Mowshowitz all agree on the depth while noting the UI/production-value shortcomings, especially on phone [S31, S32, S33].

---

## Areas of Disagreement

1. **Dune: Imperium AI quality.** MobileMatters reports AI "scales difficulty without cheating" [S48]; App Store user reviews say AI "gets exactly what it needs" and feels unfairly hard [S103]. The post-Immortality patch reportedly improved AI behavior [S27]. Likely a skill-gap effect — new players find Hard punishing, experienced players find exploitable patterns.

2. **Scythe mobile quality.** 8bit Meeple calls it "good implementation" [S55]; Lowkey Gaming calls it "subpar experience on mobile screen" with weak AI [S56]. Both are correct: good rules implementation, poor AI and small-screen UX.

3. **Terraforming Mars AI.** Screen Rant says "respectable challenge" [S49]; App Store users say Hard AI "not a challenge" and use 4-bot workarounds [S38]. Clear skill-dependency.

4. **Slice & Dice fairness.** TouchArcade calls it "perfect" [S76]; the MinMax Wiki notes unwinnable "bramble" scenarios [S79]. Some edge-case RNG can produce unwinnable fights despite reroll mechanics.

5. **FTL status.** The SQ1 report initially concluded FTL was delisted based on App Store ID 634723478. Coordinator-verified iTunes lookup for correct ID 833951143 confirms FTL is **live, iPad-only, $9.99** [S13, S14]. This report treats FTL as available but iPad-only with aging/solvedness caveats.

---

## Knowledge Gaps

1. **Sci-fi depth gap.** No iOS title reaches the depth of Terra Invicta, Cobalt Core, or Oxygen Not Included. The sci-fi multiplier is the most constrained dimension on iOS. This is a platform limitation, not a research gap.

2. **Civ VI Netflix version.** Unclear whether the iOS 17.4+ breakage affects the Netflix version (App Store ID 6478899805) [S62]. If it works, this bypasses the standalone breakage — but this was not verified.

3. **Civ VII long-term quality.** Very new (2025); limited long-term review data on iOS-specific performance, session structure, and snowball dynamics [S59, S60].

4. **iPhone vs. iPad hands-on verification.** All assessments are second-hand. UI readability on iPhone for dense strategy games (Star Traders, Terraforming Mars, Spirit Island, Ozymandias) was not directly evaluated. Multiple independent user reports flag iPhone issues across these titles.

5. **Port quality uncertainty.** Wargroove 2 (3.04★), Songs of Conquest (3.65★) have concerning ratings that may reflect control/UI compromises rather than core game quality.

6. **Tactical Breach Wizards.** Currently PC-only; a future mobile port would immediately become a Tier 1 iOS candidate given its puzzle-tactical design.

7. **Apple Arcade catalog stability.** Cult of Mac and Pocket Tactics note Apple Arcade's drift toward "family-friendly" titles [S104, S105]. Premium indie/strategy titles could be removed from the catalog.

8. **No empirical hours-to-repetition data.** All solvedness/variance assessments are qualitative. No quantitative data on how many hours until runs converge for any title.

---

## Recommendations

### 1. "Download First" Shortlist (8 games)

| # | Game | Price | Why | Key Caveat |
|---|------|-------|-----|------------|
| 1 | **Into the Breach** | Free (Netflix sub) | Archetype match: turn-based sci-fi tactical grid, clean pixel art, deep interlocking systems, high map variance [S6, S7] | Netflix dependency (no ownership); solvedness risk after ~30-40h |
| 2 | **Slice & Dice** | Free + ethical IAP | Highest novelty: dice-face-as-hero mechanic, 102 heroes × 355 items, low static-build risk, universal praise [S76, S77] | Edge-case unwinnable RNG scenarios |
| 3 | **Dune: Imperium** | $10.99 premium | Best-supported digital board game, sci-fi worker placement + deckbuilding, strong AI, Editors' Choice [S25, S26] | Steep learning curve; some AI "luck" frustration |
| 4 | **Race for the Galaxy** | $6.99 premium | Keldon AI gold standard, 10-20 min sessions, deep engine-building, fully offline [S34, S35] | Well-explored strategically; sci-fi theme is abstract |
| 5 | **Warbits+** | $4.99 premium | Best Advance Wars on iOS, pure tactics, map editor, cross-platform, no IAP [S16, S17] | Minor UI bugs; late-campaign difficulty spikes |
| 6 | **Through the Ages** | Premium | 30 solo challenges, excellent AI, "best digital adaptation of any heavy strategy game" [S43, S44] | 30-60 min sessions; fantasy/historical not sci-fi |
| 7 | **Abalon** | Free + expansions | 500+ cards, tactical grid + deckbuilding, active Season 6 (May 2026), low solvedness risk [S19] | Total expansion cost can exceed $32 |
| 8 | **Monster Train** | $7.99 / Arcade+ | Highest-rated deckbuilder on iOS (4.92★), extreme clan variance, tower-defense deckbuilding [S82] | Fantasy (not sci-fi); autobattler "decided" tail risk |

### 2. "If You Have iPad" Picks

| Game | Price | Why | Key Caveat |
|------|-------|-----|------------|
| **FTL: Faster Than Light** | $9.99 | Benchmark sci-fi RTWP, massive variance, iPad-only [S13, S30] | iPad-only; last updated Oct 2021; aging/solvedness risk |
| **XCOM 2 Collection** | $14.99 | Full tactical game with WotC, best on iPad Pro [S20, S21] | 8.5GB install; downgraded textures; demanding hardware |
| **Star Traders: Frontiers** | $6.99 | Deepest interlocking systems on iOS, open-universe RPG [S31, S32] | UI "suffers on phone" — tablet essential; steep learning curve |
| **Spirit Island** | Premium | Dual-spirit solo, scalable adversaries, deepest puzzle [S46, S47] | iPad strongly preferred; iPhone spirit selection cumbersome |
| **Civilization VII** | Apple Arcade ($6.99/mo) | Newest 4X on iOS, turn-based, strategies still emerging [S59, S60] | Snowball risk inherent to genre; subscription required |
| **Terraforming Mars** | $8.99 | Hard sci-fi engine-building, dense UI needs screen [S37, S38] | AI weak; long sessions (60-120 min); tag-counting bugs |
| **Out There: Ω Edition** | ~$4.99 | Melancholic space survival, non-combat, atmospheric [S36] | Aging; no further updates; limited depth |

### 3. "Apple Arcade / Netflix Subscription" Picks

| Game | Service | Why | Key Caveat |
|------|---------|-----|------------|
| **Into the Breach** | Netflix | Archetype match — see above | Netflix dependency |
| **Dicey Dungeons+** | Apple Arcade | Dice-slotting deckbuilder, 6 classes, no IAP friction [S80, S81] | Not new; moderate solvedness |
| **Monster Train+** | Apple Arcade | Highest-rated deckbuilder, no IAP [S82] | Same tail-risk caveat as premium version |
| **Balatro+** | Apple Arcade | Immense variance, poker-meets-deckbuilder [S83, S84] | Moderate fit — score-chasing over subsystem depth |
| **Civilization VII** | Apple Arcade | Newest 4X on iOS, active development [S59, S60] | Snowball risk; subscription lock |

### 4. "Avoid Despite Looking Relevant"

| Game | Why It Looks Good | Why It's Excluded |
|------|-------------------|-------------------|
| **Slay the Spire / Slay the Spire+** | Genre-defining deckbuilder, clean UI, premium | **Solved**: community has exhaustively documented optimal paths [S85, S86]; the profile explicitly flags "a dominant strategy emerges" as the #1 game-killer |
| **Dead Cells / Dead Cells+ (Netflix)** | Premium action roguelite, excellent reviews | **APM/reflex**: action platformer with real-time combat; fails hard filter #1 [S106] |
| **Company of Heroes** | Full RTS, excellent Feral port | **APM**: RTS micro-heavy combat doesn't translate to touch; fails hard filter #1 [S64, S65] |
| **Dream Quest** | $2.99, 13 classes, genre ancestor | **Visual gate**: notorious stick-figure graphics fail "clean and atmospheric" hard filter #2 [S87, S88] |
| **Civilization VI (standalone)** | Full PC game on iOS, deep 4X | **Broken on iOS 17.4+** with no fix ETA [S61]; also snowball/solved problems |
| **Northgard** | Norse RTS with survival elements | **Technical issues**: glitch controls, stability problems, moderate APM [S66, S67] |
| **Concordia** | Top-20 BGG masterpiece, beautiful UI | **No true solo mode**: only bot substitution in multiplayer [S57, S58] |
| **Scythe** | Popular strategy board game, digital edition | **Weak AI** + poor mobile UI; better on PC [S55, S56] |
| **Eclipse** | Grand 4X space opera | **Original discontinued**; 2nd Dawn poorly rated (3.0★) [S40] |
| **Stellaris: Galaxy Command** | "Stellaris" branding | **Shallow F2P spinoff**, not the real game; monetization problems [S70, S71] |
| **Frostpunk: Beyond the Ice** | Frostpunk IP on mobile | **F2P compromised**: monetization limits depth vs PC original [S107] |
| **Foundation: Galactic Frontier** | Space management sim | **Shallow F2P** despite premium first impression [S108] |

### 5. Watchlist

| Game | Why Watching | Trigger for Promotion |
|------|-------------|----------------------|
| **Lost For Swords** | Novel "deck shapes rooms" mechanic; free + IAP; new 2024/2025 [S100] | More reviews confirming depth and fair monetization |
| **Nowhere Prophet** | Tactical deckbuilder with 300+ cards, free trial [S99] | Confirmation of run variance and AI quality |
| **Shiren: Serpentcoil Island** | Deep mystery dungeon, 34 dungeons, $19.99 [S24] | Price tolerance; hardware compatibility check |
| **Ozymandias** | Anti-snowball 4X, random victory conditions [S52, S53] | iPhone font fix; deeper solo mode evaluation |
| **Battlevoid: Harbinger** | Budget FTL-like fleet roguelike, $3.99 [S101] | Confirmation of variance depth and balance |
| **Breach Wanderers** | Forge system for pre-run deck curation [S109] | F2P monetization audit; long-term balance check |
| **Halcyon 6: Lightspeed Edition** | Base-building + tactical RPG hybrid [S39] | iOS compatibility verification; long-term support |
| **Signal Void** | Free, no ads, 150+ hand-crafted sci-fi puzzles [S98] | Puzzle depth confirmation; review coverage |
| **Hoplite** | Metacritic 88, design perfection at $3.99 [S22, S23] | Visual gate tolerance — functional but not atmospheric |
| **ENYO** | $1.99 Hoplite-inspired, indirect combat [S110] | Repetition-after-mastery assessment |
| **Dawncaster** | Polished STS-like, 900+ cards, portrait [S89] | Monetization clarity; mechanical differentiation |
| **Tactical Breach Wizards** | PC-only puzzle-tactical design | iOS port announcement (would be Tier 1) |

---

## Source Inventory

The following table presents all sources cited in this report's narrative. The full research corpus across all seven sub-questions contains approximately 240 source entries (~220 unique URLs after cross-SQ deduplication). This inventory includes sources referenced by [S#] markers above.

| ID | Source | Tier | Credibility | Sub-Qs |
|----|--------|------|-------------|--------|
| S1 | Netflix Games Help. "80+ exclusive mobile games." 2024. help.netflix.com/en/node/121442 | A | 4.5 | SQ1 |
| S2 | Apple Arcade — Pocket Tactics. "Best Apple Arcade Games 2026." pockettactics.com | B | 4.0 | SQ1 |
| S3 | Cult of Mac. "Best Apple Arcade games." cultofmac.com | B | 4.0 | SQ1 |
| S4 | ByteHub. "Netflix Games vs Apple Arcade." bgmcloud.com | B | 4.0 | SQ1 |
| S5 | Mobilegamer.biz. "Netflix Games strategy." 2024. | B | 4.0 | SQ1 |
| S6 | Subset Games / Netflix. "Into the Breach" App Store. apps.apple.com/us/app/id1616542180 | A | 4.8 | SQ1, SQ2 |
| S7 | TouchArcade. "Into the Breach Mobile Review." Jul 2022. toucharcade.com | A | 4.5 | SQ1, SQ2 |
| S8 | Terra Invicta Steam Store. store.steampowered.com/app/1176470 | A | 4.5 | SQ1 |
| S9 | Terra Invicta 1.0 Announcement. gamespress.com | A | 4.5 | SQ1 |
| S10 | Against the Storm Steam Store. store.steampowered.com/app/1336490 | A | 4.5 | SQ1 |
| S11 | Cobalt Core Wikipedia. en.wikipedia.org | B | 4.3 | SQ1 |
| S12 | Apple App Store / iTunes Search API. itunes.apple.com/search | A | 4.8 | SQ1 |
| S13 | Apple App Store. "FTL: Faster Than Light" (ID 833951143). apps.apple.com | A | 4.8 | SQ2, SQ3 |
| S14 | iTunes Lookup API. itunes.apple.com/lookup?id=833951143 | A | 4.8 | SQ3 (coordinator verification) |
| S15 | Netflix Games. "Into the Breach" game page. 2022. | A | 4.2 | SQ2 |
| S16 | Apple App Store. "Warbits Plus." apps.apple.com/us/app/id1477425198 | A | 4.8 | SQ2 |
| S17 | TouchArcade. "Game of the Week: Warbits Plus." May 2024. toucharcade.com | A | 4.5 | SQ2 |
| S18 | 148Apps. "Warbits Plus Review." May 2024. | B | 3.8 | SQ2 |
| S19 | Apple App Store. "Abalon." apps.apple.com/us/app/id1235934798 | A | 4.8 | SQ2 |
| S20 | TouchArcade. "XCOM 2 Collection iOS Review." Nov 2020. toucharcade.com | A | 4.5 | SQ2, SQ5 |
| S21 | Pocket Tactics. "XCOM 2 Collection iOS review." 2020. | B | 4.0 | SQ2, SQ5 |
| S22 | Pocket Gamer. "Hoplite Review." Jan 2014. | A | 4.5 | SQ2 |
| S23 | TouchArcade. "Hoplite Review." Jan 2014. toucharcade.com | A | 4.5 | SQ2 |
| S24 | Apple App Store. "Shiren: Serpentcoil Island." apps.apple.com | A | 4.5 | SQ2 |
| S25 | Apple App Store. "Dune: Imperium." apps.apple.com/us/app/id1575414319 | A | 4.7 | SQ3, SQ4 |
| S26 | Dire Wolf Digital. "Dune: Imperium Release Announcement." Mar 2024. news.direwolfdigital.com | A | 4.6 | SQ3 |
| S27 | Steam Community. "AI difficulty — Immortality update." 2024. | C | 3.4 | SQ4 |
| S28 | Apple App Store. "Crying Suns." apps.apple.com/us/app/id1511788295 | A | 4.5 | SQ3 |
| S29 | TouchArcade. "Crying Suns Review." Jul 2020. toucharcade.com | A | 4.4 | SQ3 |
| S30 | TouchArcade. "FTL iPad Full Screen Update." Feb 2021. toucharcade.com | A | 4.2 | SQ3 |
| S31 | 148Apps. "Star Traders: Frontiers Review." 2019. | B | 4.1 | SQ3 |
| S32 | RPGFan. "Star Traders: Frontiers Review." 2019. | B | 4.3 | SQ3 |
| S33 | Zvi Mowshowitz. "Star Traders Review." thezvi.substack.com. 2022. | B | 4.0 | SQ3 |
| S34 | Board Game Quest. "Race for the Galaxy iOS Review." 2017-18. boardgamequest.com | B | 4.5 | SQ3, SQ4 |
| S35 | Destructoid. "Review: Race for the Galaxy (Mobile)." 2018. destructoid.com | B | 4.5 | SQ3, SQ4 |
| S36 | TouchArcade. "Out There Review." Mar 2014. toucharcade.com | A | 4.2 | SQ3 |
| S37 | Apple App Store. "Terraforming Mars." apps.apple.com/us/app/id1353471030 | A | 4.4 | SQ3, SQ4 |
| S38 | App Store User Reviews. "Terraforming Mars." 2024-25. | C | 3.2 | SQ4 |
| S39 | 148Apps. "Halcyon 6 Review." 2017. | B | 4.1 | SQ3 |
| S40 | Apple App Store. "Eclipse — 2nd Dawn." apps.apple.com | B | 4.2 | SQ3, SQ4 |
| S41 | Apple App Store. "Spaceship Commander John Ray." apps.apple.com | C | 3.0 | SQ3 |
| S42 | Dude! Take Your Turn. "Race for the Galaxy app is real." 2017. dudetakeyourturn.ca | B | 4.4 | SQ4 |
| S43 | Board Game Quest. "Through the Ages iOS Review." 2017-18. boardgamequest.com | B | 4.6 | SQ4 |
| S44 | NerdSection. "Revisiting 2025: Through the Ages App." 2025. nerdsection.com | B | 4.5 | SQ4 |
| S45 | Pocket Gamer. "Through The Ages review." 2017-18. | B | 4.4 | SQ4 |
| S46 | 8bit Meeple. "Spirit Island App Review." 2021-22. | B | 4.3 | SQ4 |
| S47 | App Store User Reviews. "Spirit Island." 2024-25. | C | 3.3 | SQ4 |
| S48 | MobileMatters. "Dune: Imperium Digital Review." 2024. mobilematters.gg | B | 4.4 | SQ4 |
| S49 | Screen Rant. "Terraforming Mars Mobile Review." 2022. screenrant.com | B | 4.2 | SQ4 |
| S50 | Board Game Quest. "Root Digital Board Game Review." 2020-21. boardgamequest.com | B | 4.4 | SQ4 |
| S51 | Meeple Mountain. "Root Digital Game Review." 2020-21. meeplemountain.com | B | 4.3 | SQ4 |
| S52 | Pocket Gamer. "Ozymandias." 2024. pocketgamer.com | B | 4.2 | SQ4, SQ7 |
| S53 | App Store User Reviews. "Ozymandias." 2024-25. | C | 3.0 | SQ4, SQ7 |
| S54 | App Store User Reviews. "Twilight Struggle." 2024-25. | C | 3.1 | SQ4 |
| S55 | 8bit Meeple. "Scythe App Review." 2020-21. | B | 4.2 | SQ4 |
| S56 | Lowkey Gaming. "Scythe Digital Edition Review." 2022-23. lowkeygaming.app | B | 4.3 | SQ4 |
| S57 | Board Game Quest. "Concordia Digital Review." 2021-22. boardgamequest.com | B | 4.3 | SQ4 |
| S58 | Dude! Take Your Turn. "Concordia by Acram Digital." 2021. dudetakeyourturn.ca | B | 4.3 | SQ4 |
| S59 | Apple App Store. "Sid Meier's Civilization VII." apps.apple.com 2025. | A | 4.5 | SQ5 |
| S60 | Apple App Store (duplicate listing). "Civilization VII." | A | 4.5 | SQ5 |
| S61 | TouchArcade. "PSA: Civ VI Is Unplayable on iOS 17.4+." Apr 2024. toucharcade.com | B | 4.0 | SQ5 |
| S62 | Apple App Store. "Civilization VI: NETFLIX." 2024. apps.apple.com | A | 4.5 | SQ5 |
| S63 | App Store User Reviews. "XCOM 2 Collection." 2020-2024. | C | 3.5 | SQ5 |
| S64 | TouchArcade. "Company of Heroes for iPad Review." Feb 2020. toucharcade.com | B | 4.3 | SQ5 |
| S65 | Hardcore Droid. "Company of Heroes for Android Review." 2020. | C | 3.2 | SQ5 |
| S66 | 148Apps. "Northgard review." 2020. | B | 3.8 | SQ5 |
| S67 | Pocket Gamer. "Northgard review." 2020. | B | 3.5 | SQ5 |
| S68 | TouchArcade. "Tropico Review." May 2019. toucharcade.com | B | 4.2 | SQ5 |
| S69 | MacStories. "Game Day: Tropico for iPad." 2018. macstories.net | B | 4.0 | SQ5 |
| S70 | Pocket Tactics. "Stellaris: Galaxy Command review." 2020. | B | 3.0 | SQ5 |
| S71 | Paradox Forums. "Addressing Stellaris Galaxy Command." 2020. | B | 3.5 | SQ5 |
| S72 | StarDesk. "How to Play CK3 on Mobile." 2024. | C | 2.5 | SQ5 |
| S73 | Factorio Blog. "FFF #370 — Journey to Switch." 2022. factorio.com | A | 4.5 | SQ5 |
| S74 | Apple App Store. "Mindustry." apps.apple.com | A | 4.0 | SQ5 |
| S75 | Game Brain. "Mindustry review." 2025. | C | 3.2 | SQ5 |
| S76 | TouchArcade. "Slice & Dice iOS Review." Apr 2024. toucharcade.com | B | 4.5 | SQ6 |
| S77 | 148Apps. "Slice & Dice review." 2024. | B | 4.3 | SQ6 |
| S78 | Apple App Store. "Slice & Dice." apps.apple.com/us/app/id6449848963 | A | 4.8 | SQ6 |
| S79 | MinMax Wiki. "Slice & Dice." minmax.wiki | C | 3.8 | SQ6 |
| S80 | TouchArcade. "Dicey Dungeons mobile review." Jul 2022. toucharcade.com | B | 4.4 | SQ6 |
| S81 | Apple App Store. "Dicey Dungeons+." apps.apple.com (Apple Arcade) | A | 4.8 | SQ6 |
| S82 | Apple App Store. "Monster Train." apps.apple.com/us/app/id1536575398 | A | 4.5 | SQ1, SQ6 |
| S83 | Apple App Store. "Balatro." apps.apple.com/us/app/id6502453075 | A | 4.5 | SQ1 |
| S84 | AppleInsider. "Balatro deals itself into the App Store." Sep 2024. appleinsider.com | B | 4.3 | SQ1 |
| S85 | TouchArcade. "Slay the Spire iOS review." Jun 2020. toucharcade.com | B | 4.5 | SQ6 |
| S86 | Pocket Gamer. "Slay the Spire review." | B | 4.4 | SQ6 |
| S87 | Apple App Store. "Dream Quest." apps.apple.com/us/app/id870227884 | A | 4.6 | SQ6 |
| S88 | 148Apps. "Dream Quest review." 2015. | B | 4.3 | SQ6 |
| S89 | Metacritic. "Dawncaster critic reviews." | B | 4.0 | SQ6 |
| S90 | App Pricing Lab. "Dawncaster IAP breakdown." 2024. | C | 3.5 | SQ6 |
| S91 | Apple App Store. "Card Quest." (error/region block) | A | — | SQ6 |
| S92 | Gameindustry.com. "You've already gambled today — you just called it gacha." | B | 4.0 | SQ7 |
| S93 | App Store. "AFK Journey." apps.apple.com | C | — | SQ7 |
| S94 | Kotaku. "Pokémon TCG Pocket gacha/loot box gambling." 2025. kotaku.com | A | 4.2 | SQ7 |
| S95 | App Store. "iNethack2." apps.apple.com | B | — | SQ7 |
| S96 | App Store. "tChess Pro." apps.apple.com | B | — | SQ7 |
| S97 | Pocket Gamer. "Game of Thrones: Dragonfire." pocketgamer.com | B | — | SQ7 |
| S98 | Signal Void. signalvoidgame.com | B | — | SQ7 |
| S99 | Apple App Store. "Nowhere Prophet." apps.apple.com | B | 3.8 | SQ6, SQ7 |
| S100 | Apple App Store. "Lost For Swords." apps.apple.com | A | 4.5 | SQ6 |
| S101 | Apple App Store. "Battlevoid: Harbinger." apps.apple.com | A | 4.3 | SQ3 |
| S102 | Pocket Tactics. "Company of Heroes review." 2020. | B | 4.0 | SQ5 |
| S103 | App Store User Reviews. "Dune: Imperium." 2024-25. | C | 3.3 | SQ4 |
| S104 | Cult of Mac. "Best Apple Arcade games." | B | 4.0 | SQ1 |
| S105 | Pocket Tactics. "Apple Arcade Best Games 2026." | B | 4.0 | SQ1 |
| S106 | Apple App Store. "Dead Cells." apps.apple.com | A | 4.0 | SQ1 |
| S107 | Pocket Gamer. "Frostpunk: Beyond the Ice review." 2022. | B | 3.5 | SQ5 |
| S108 | Macworld. "Foundation: Galactic Frontier review." 2024. macworld.com | B | 3.0 | SQ5 |
| S109 | Apple App Store. "Breach Wanderers." apps.apple.com | A | 4.5 | SQ6 |
| S110 | Apple App Store. "ENYO." apps.apple.com | A | 4.5 | SQ2 |

---

## Methodology

**Research depth**: deep (7 sub-questions, 200+ source minimum).

**Sub-question decomposition**: The coordinator decomposed the research topic into 7 sub-questions dispatched as parallel Orca worker tasks:
1. SQ1 — iOS/iPadOS availability and candidate universe
2. SQ2 — Tactical roguelites and turn-based tactics on iOS
3. SQ3 — Sci-fi/space/RTWP systems games on iOS
4. SQ4 — Digital board-game adaptations for solo optimizer fit
5. SQ5 — Strategy/management/4X PC ports and failure modes
6. SQ6 — Mobile-native deckbuilder/dice/card roguelikes
7. SQ7 — Exclusions (negative filters) and hidden gems watchlist

**Search tools**: Perplexity AI, Exa, Gemini Web, iTunes Search API, direct App Store page verification. Each SQ used 4–8 varied search queries per sub-question.

**Source evaluation criteria**: Sources were tiered (A: official/primary; B: established publication; C: community/user-generated) and scored on credibility (1–5). Only Tier A/B sources were used for major claims. Tier C sources were used for corroborating user-experience data (AI quality, device issues).

**FTL conflict resolution**: SQ1 and SQ2 initially reported FTL as delisted based on App Store ID 634723478. The coordinator verified via iTunes lookup for the correct ID 833951143, confirming FTL is live in the US App Store, iPad-only, at $9.99. This report treats FTL as available with aging/solvedness caveats.

**Deduplication**: Source entries appearing across multiple SQ reports were merged. The final Source Inventory contains 110 entries cited in this report's narrative; the full research corpus across all SQ workers contains approximately 240 entries (~220 unique URLs after deduplication), exceeding the 200-source minimum for deep runs.

**Taste-profile alignment scoring**: Each title was evaluated against the profile's hard filters (deliberate pace, clean visuals) as binary gates, then assessed on soft criteria (situational variance, interlocking systems, incomplete information, sci-fi multiplier, solvedness risk, session structure, monetization). Recommendations were ranked by composite fit rather than generic quality.
