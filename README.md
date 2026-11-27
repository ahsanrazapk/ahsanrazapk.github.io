# Ahsan Raza · Portfolio

Personal portfolio of **Ahsan Raza**, Senior Flutter & Android Developer.

Live: **https://ahsanrazapk.github.io**

- Ink neutrals and one "connected" green, in light and dark themes
- Plain HTML, CSS and JavaScript: no framework, no build step
- The portrait is a call tile with a live status line (availability, Lahore's clock, a call timer)
- Motion only where it explains something: one entrance on load, FLIP project filters and
  view-transition project popups
- Respects `prefers-reduced-motion`

## Edit

- Text and sections: `index.html`
- Styles and animations: `assets/css/style.css`
- Interactions: `assets/js/main.js`
- Project popups read the JSON block `#work-data` at the bottom of `index.html`

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
