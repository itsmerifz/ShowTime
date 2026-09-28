# Showtime

A calmer way to keep time. A responsive, animated clock app built with HTML, CSS, and vanilla JavaScript. No runtime libraries, API keys, or build step are required.

## Run locally

```sh
npm ci
npm start
```

Open `http://localhost:3000`. The development server binds to `0.0.0.0` for remote previews.

You can also serve the repository with any static web server. Deploy `index.html`, `style.css`, `app.js`, `favicon.svg`, `img/`, and `fonts/` together. Fonts and the original forest photograph are local assets; the app does not depend on a CDN.

## Your space

- **Overview:** live device-local time, 12/24-hour display, optional seconds, fullscreen clock, world-clock previews, and a daylight-saving-aware day-progress ring.
- **World clock:** search 26 curated cities, add or remove clocks, and see local dates and timezone differences. Uses the browser's IANA timezone data to account for daylight saving and fractional offsets.
- **Focus timer:** 25-minute focus, 50-minute deep work, and 5-minute break presets, with an intention field and pause/resume/reset controls. Absolute deadlines keep the countdown accurate when the tab is inactive.
- **Stopwatch:** hundredths of a second, pause/resume, lap splits, totals, and reset. Uses a monotonic clock rather than counting interval callbacks.
- **Guided breathing:** a repeating four-second inhale, four-second hold, and six-second exhale exercise.
- **Settings:** persistent appearance, time format, seconds, and animation preferences. Press `Ctrl+,` or `⌘+,` to open settings.

Timers continue while navigating within the app, but reset when the page is reloaded or closed. Only display preferences and selected cities are stored locally. The intention field and timer activity are not saved or sent anywhere. Time follows the device clock; there is no external synchronization service.

## Motion and accessibility

The motion system uses CSS animations, transitions, and the Web Animations API: staggered entrances, clock-number updates, slow forest movement, orbiting focus details, breathing rings, progress indicators, and button/card feedback.

The animation control pauses decorative movement. System `prefers-reduced-motion` takes precedence, including changes made while the app is open. The live clocks and timers still function with motion disabled. Native dialogs support keyboard focus trapping, Escape dismissal, and focus restoration; navigation uses real links and supports browser history.

## Tests

```sh
npx playwright install --with-deps chromium
npm test
```

The Playwright suite covers clock updates and formats, timezone offsets, city persistence, timer completion, stopwatch laps, settings, reduced motion, guided breathing, routing, unavailable storage, and responsive overflow checks at five viewport widths.

For an existing Chromium installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm test
```

## Credits

Original Showtime app and forest photograph from this repository by Muhamad Arief. DM Sans and Manrope are bundled under their SIL Open Font Licenses; see `fonts/` for license text.
