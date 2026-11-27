# Ahsan Raza · Portfolio

Personal portfolio of **Ahsan Raza**, Senior Flutter & Android Developer.

Live: **https://ahsanrazapk.github.io**

- Ink neutrals and one "connected" green, in light and dark themes
- Plain HTML, CSS and JavaScript: no framework, no build step
- The portrait is a call tile with a live status line (availability, Lahore's clock, a call timer)
- Motion follows the call idea: the tile connects on load, the lead is transcribed word by word,
  a voice meter and speaker ring answer scrolling, rows light up as they cross the middle of the
  screen, posters stream in and lean toward the pointer, and the contact panel has a listening
  waveform. Plus FLIP project filters, view-transition popups and a circular theme switch.
- All hidden start states sit under `.motion` (set in `<head>`), so the page is complete without JS
- Respects `prefers-reduced-motion`

## Edit

- Text and sections: `index.html`
- Styles and animations: `assets/css/style.css`
- Interactions: `assets/js/main.js`
- Project popups read the JSON block `#work-data` at the bottom of `index.html`

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
