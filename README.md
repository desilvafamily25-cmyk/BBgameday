# U12 Game Day Coach

An interactive coaching and sideline planner for **EDJBA Under-12 D-grade** basketball: six players, simple basketball, calm coaching.

It's a single self-contained web app (`index.html`). Open it by double-clicking the file. There's no build step and nothing to install.

## What's inside

| | |
|---|---|
| **Game-Day Mode** | A full-screen courtside view: lineup, next sub with a big **Sub done** button, timeouts (2 → 1 → 0 per half), six cue buttons, offence/defence/transition reminders, fouls and fatigue per player, and quick notes. It has four phases (1st half, half-time, 2nd half, final 5 minutes), each of which reorders the screen. It keeps the screen awake where the browser supports it. |
| **Game clock & sub beeps** | A 20:00 countdown for each half in Game-Day Mode and on the dashboard, with Start/Pause, ±10s and Set to match the scoreboard. It beeps and vibrates 20 seconds before each planned sub ("Get Ruby to the table") and again at sub time, when a **SUB NOW** banner with its own **Sub done** button appears. It also alerts at 3:00 left in the 1st half (no more timeouts), at the final 5:00 and final 2:00, and at the end of each half. The 1st-half buzzer switches to the half-time view. Tap 🔔 to mute. The clock keeps time even if the phone locks or the app reloads.
| **Substitution rotation** | 12 blocks of ~3:20. Each player rests once per half (≈33:20 each). The second half is the first half reversed, so the starting five finishes the game. It tracks playing time, lets you edit who rests, marks players absent or injured, and has Undo and Reset. |
| **20 swipeable chapters** | Swipe, use the arrows or the keyboard, or open the contents. A progress bar shows where you are, and the app reopens at the last page you visited. |
| **Animated court diagrams** | An SVG half-court and full-court engine with step-by-step controls for players, passes, cuts, dribbles and defensive movement. Tap ⤢ to enlarge a diagram. It respects reduced-motion settings. |
| **Quick access** | Bottom nav: Offence, Defence, Game Day, Subs and More (Inbounds, Timeouts, Rules, Dashboard, and more). From Game Day you can open any play on top of the screen, or jump to its chapter and come back with **Back to Game Day**. |
| **Game notes** | Opponent, date, venue, what they do well, what we struggle with, ball-handling, rest, foul concerns, 2nd-half plan and a timestamped live log. **Copy all notes** copies everything for sharing after the game. |
| **Print** | Prints the whole handbook, the game-day cheat sheet, the substitution plan or the quick rules. Each printed diagram shows every step, numbered, on one court. |

All data is saved automatically in the browser's `localStorage` on that device. **More → Start a new game** clears that game's data but keeps the player names.

## Rules source

The app summarises the EDJBA U12 D-grade quick rules: 2 × 20 min, 2 min half-time, 2 timeouts per half (none in the final 3:00 of the 1st half), the clock stops for all whistles in the final 2:00, a size 6 ball, an advanced foul line, the 5-second key, the inner 3-point line, the 20-point retreat rule (not in grading rounds 1–6), and **no zone defence**. Every defensive concept in the app is legal player-to-player defence.

## Deploy to Netlify as an installable app (PWA)

The repo is ready for Netlify. `netlify.toml` sets the publish folder and the cache headers, so there's no build step.

1. Netlify → **Add new site → Import from Git**, then pick this repo and branch (or drag the folder onto app.netlify.com/drop).
2. Leave the build command empty. `netlify.toml` already sets the publish directory to `.`.
3. Open the site on a phone and install it:
   - **Android (Chrome):** Install app.
   - **iPhone (Safari):** Share → Add to Home Screen.

**How updates and offline work:**
- `sw.js` loads the app page from the network first, so installed phones get a new deploy on their next open. When there's no signal, it uses the last saved copy.
- Netlify never caches `sw.js` (`no-cache` header), so phones always pick up a new service worker.
- Coach data (names, rotation, notes) is stored on each phone in `localStorage` and survives updates.

**Deep links:** `#gameday`, `#p5` (subs), `#p20` (dashboard). Android also offers these as home-screen shortcuts.

## Test

```bash
npm i -D playwright   # or use a global install
node tests/workflow.test.js
node tests/clock.test.js
```

The test simulates a full game day on a 390 px touch phone and checks each step:

1. entering six names
2. swipe and keyboard navigation
3. Game-Day Mode
4. the starting five
5. subs with undo
6. timeouts
7. jumping to defence and back
8. quick notes, fouls and fatigue
9. the half-time timer and 2nd-half start
10. stepping through a diagram
11. the dashboard
12. a refresh, checking that everything persists
