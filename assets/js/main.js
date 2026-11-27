/* Ahsan Raza · Portfolio interactions. Plain JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // .motion is set in <head> when the visitor has not asked for reduced motion. Its CSS start
  // states hide content until this script reveals it, so tell the head failsafe we are running.
  const motion = root.classList.contains('motion');
  window.__motion = true;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const canVT = typeof document.startViewTransition === 'function' && !reduce;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- theme (the new theme grows out of the toggle) ---------- */
  const themeBtn = $('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  let onTheme = () => {};
  function setTheme(t) {
    root.dataset.theme = t;
    themeMeta.content = t === 'light' ? '#f5f7fa' : '#0b0d14';
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode */ }
    onTheme();
  }
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (!canVT) { setTheme(next); return; }
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-vt');
    const vt = document.startViewTransition(() => setTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 700, easing: EASE, pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('theme-vt'));
  });

  /* ---------- the voice: one energy level drives the meter and the speaker ring ---------- */
  const tile = $('.call-tile');
  const meterBars = $$('.meter i');
  let energy = 0; // 0..1, fed by the transcript and by scrolling, decays on its own
  let voiceRaf = 0;
  function voice() {
    const t = performance.now() / 1000;
    meterBars.forEach((b, i) => {
      b.style.setProperty('--v', (0.25 + energy * 0.75 * Math.abs(Math.sin(t * (5 + i * 1.7) + i * 2.1))).toFixed(2));
    });
    tile.style.setProperty('--lvl', (energy * 0.9).toFixed(2));
    energy *= 0.93;
    if (energy > 0.02) { voiceRaf = requestAnimationFrame(voice); return; }
    energy = 0;
    voiceRaf = 0;
    meterBars.forEach((b) => b.style.removeProperty('--v'));
    tile.style.removeProperty('--lvl');
  }
  function speak(amount) {
    if (!motion || !tile) return;
    energy = Math.min(1, energy + amount);
    if (!voiceRaf) voiceRaf = requestAnimationFrame(voice);
  }

  /* ---------- hero: the call connects, then the lead is transcribed ---------- */
  function startTimer() {
    const el = $('.call-timer');
    if (!el) return;
    const t0 = Date.now();
    const pad = (n) => String(n).padStart(2, '0');
    setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      el.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 1000);
  }
  if (motion && tile) {
    // name: one span per letter, each rising out of the line's mask
    const name = $('.hero-name');
    const text = name.textContent.trim();
    name.setAttribute('aria-label', text);
    name.textContent = '';
    [...text].forEach((ch, i) => {
      if (ch === ' ') { name.append(' '); return; }
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      s.style.setProperty('--i', i);
      name.appendChild(s);
    });
    name.classList.add('split');

    // lead: one span per word, lit in order like a live transcript
    const lead = $('.hero-lead');
    const words = lead.textContent.trim().split(/\s+/).map((w) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      return s;
    });
    lead.textContent = '';
    words.forEach((s, i) => lead.append(s, i < words.length - 1 ? ' ' : ''));
    lead.classList.add('split');

    setTimeout(() => {
      tile.classList.add('connected');
      startTimer();
      let i = 0;
      const next = () => {
        if (i >= words.length) return;
        words[i++].classList.add('on');
        speak(0.5);
        setTimeout(next, 70);
      };
      setTimeout(next, 400);
    }, 1300); // long enough for "Connecting" to be read once the tile has faded in
  } else {
    startTimer();
  }

  /* ---------- nav: active section, sliding underline ---------- */
  const links = $$('.links a');
  let activeLink = null;
  let indicator = null;
  let ruler = null;
  if (motion) {
    indicator = document.createElement('span');
    indicator.className = 'indicator';
    $('.links').appendChild(indicator);
    ruler = document.createElement('div');
    ruler.className = 'ruler';
    ruler.setAttribute('aria-hidden', 'true');
    ruler.append(document.createElement('i'), document.createElement('span'));
    ruler.lastChild.textContent = 'Intro';
    document.body.appendChild(ruler);
  }
  function moveIndicator() {
    if (!indicator) return;
    if (!activeLink || !activeLink.offsetWidth) { indicator.style.opacity = 0; return; }
    indicator.style.opacity = 1;
    // 12px is the link's side padding, so the line sits under the word only
    indicator.style.transform = `translateX(${activeLink.offsetLeft + 12}px) scaleX(${activeLink.offsetWidth - 24})`;
  }
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      activeLink = id ? links.find((a) => a.hash === '#' + id) || null : null;
      links.forEach((a) => a.classList.toggle('active', a === activeLink));
      moveIndicator();
      if (ruler) ruler.lastChild.textContent = activeLink ? activeLink.textContent : 'Intro';
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.hero, main section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#mobile-menu');
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  if (motion) {
    /* ---------- scroll: nav steps aside, the ruler mark travels, the voice answers ---------- */
    const navWrap = $('.nav-wrap');
    let lastY = scrollY;
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scrollY;
        const dy = y - lastY;
        lastY = y;
        navWrap.classList.toggle('hide', dy > 0 && y > 400 && !menu.classList.contains('open'));
        ruler.style.setProperty('--p', clamp(y / Math.max(1, root.scrollHeight - innerHeight), 0, 1).toFixed(4));
        speak(Math.min(0.6, Math.abs(dy) / 300));
      });
    }, { passive: true });
    addEventListener('resize', moveIndicator);
    if (document.fonts) document.fonts.ready.then(moveIndicator);

    /* ---------- scroll reveals ---------- */
    // h2: wrap each line so it can rise out of its own mask
    $$('h2').forEach((h) => {
      h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="line"><span>${l}</span></span>`).join(' ');
    });

    // mono labels resolve left to right out of noise. The real text never leaves the DOM:
    // the noise is drawn by ::after from data-s, so screen readers and copy still get the label.
    const GLYPHS = '/\\|-_=+<>';
    function decode(el) {
      const text = el.textContent;
      const t0 = performance.now();
      el.classList.add('scr');
      (function frame(now) {
        const p = clamp((now - t0) / 600, 0, 1);
        const done = Math.floor(p * text.length);
        el.dataset.s = text.slice(0, done) + [...text.slice(done)].map((c) => (c === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0])).join('');
        if (p < 1) { requestAnimationFrame(frame); return; }
        el.classList.remove('scr');
        delete el.dataset.s;
      })(t0);
    }

    const revealIO = new IntersectionObserver((entries) => {
      let n = 0;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        revealIO.unobserve(el);
        // cards entering together stagger; the tech list waits for the hero when it is on the first screen
        const d = el.matches('.card') ? n++ * 90 : el.matches('.tech') && performance.now() < 1500 ? 700 : 0;
        if (d) {
          el.style.setProperty('--d', d + 'ms');
          setTimeout(() => el.style.removeProperty('--d'), d + 1300); // so hover is never delayed afterwards
        }
        el.classList.add('in');
        const label = el.matches('.edu-label') ? el : el.matches('.sec-head, .contact') ? $('.eyebrow', el) : null;
        if (label) decode(label);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.sec-head, .tech, .filters, .row, .job, .card, .contact, .edu-label').forEach((el) => revealIO.observe(el));

    // transcript focus: the row crossing the middle of the screen is the one being said
    const inBand = new Set();
    const lists = $$('.rows, .jobs');
    const focusIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) inBand.add(e.target); else inBand.delete(e.target); });
      lists.forEach((list) => {
        const rows = [...list.children];
        const live = rows.filter((r) => inBand.has(r)).pop();
        list.classList.toggle('focus', !!live);
        rows.forEach((r) => r.classList.toggle('live', r === live));
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    $$('.row, .job').forEach((el) => focusIO.observe(el));

    /* ---------- pointer: the call tile and the cards lean toward it ---------- */
    if (finePointer) {
      const heroSplit = $('.hero-split');
      heroSplit.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--tx', clamp((e.clientX - r.left - r.width / 2) / innerWidth * 2, -1, 1).toFixed(3));
        tile.style.setProperty('--ty', clamp((e.clientY - r.top - r.height / 2) / innerHeight * 2, -1, 1).toFixed(3));
      });
      heroSplit.addEventListener('pointerleave', () => {
        tile.style.removeProperty('--tx');
        tile.style.removeProperty('--ty');
      });

      $$('.card').forEach((card) => {
        const shot = $('.shot', card);
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const s = shot.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
          card.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
          card.style.setProperty('--px', (-px * 12).toFixed(1) + 'px'); // the poster drifts against the tilt
          card.style.setProperty('--py', (-py * 12).toFixed(1) + 'px');
          card.style.setProperty('--mx', (e.clientX - s.left).toFixed(0) + 'px');
          card.style.setProperty('--my', (e.clientY - s.top).toFixed(0) + 'px');
        });
        card.addEventListener('pointerleave', () => {
          ['--rx', '--ry', '--px', '--py'].forEach((p) => card.style.removeProperty(p));
        });
      });
    }

    /* ---------- contact: a listening waveform that answers the pointer ---------- */
    const contact = $('.contact');
    if (contact) {
      const cv = document.createElement('canvas');
      cv.className = 'wave';
      cv.setAttribute('aria-hidden', 'true');
      contact.appendChild(cv);
      const ctx = cv.getContext('2d');
      const bar = (ctx.roundRect || ctx.rect).bind(ctx); // rect ignores the radius on older browsers
      let w = 0, h = 0, dpr = 1, visible = false, raf = 0, last = 0, mx = -1e4, push = 0, colors = [];
      const readColors = () => {
        const cs = getComputedStyle(root);
        colors = [cs.getPropertyValue('--text-3').trim(), cs.getPropertyValue('--accent').trim()];
      };
      const size = () => {
        dpr = Math.min(2, devicePixelRatio || 1);
        w = cv.clientWidth;
        h = cv.clientHeight;
        cv.width = w * dpr;
        cv.height = h * dpr;
      };
      const draw = (now) => {
        raf = visible ? requestAnimationFrame(draw) : 0;
        if (now - last < 33) return; // ~30fps is plenty for bars
        last = now;
        const t = now / 1000;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (let x = 0, i = 0; x < w; x += 6, i++) {
          const near = Math.exp(-(((x - mx) / 140) ** 2)) * push; // a bump under the pointer
          const idle = 0.08 + 0.16 * (0.5 + 0.5 * Math.sin(i * 0.37 + t * 1.6)) * (0.5 + 0.5 * Math.sin(i * 0.11 - t * 0.9));
          const bh = Math.max(2, Math.min(1, idle + near * (0.45 + 0.4 * Math.abs(Math.sin(i * 0.9 + t * 9)))) * h);
          ctx.fillStyle = colors[near > 0.15 ? 1 : 0];
          ctx.globalAlpha = near > 0.15 ? 1 : 0.5;
          ctx.beginPath();
          bar(x, (h - bh) / 2, 2, bh, 1);
          ctx.fill();
        }
        push *= 0.95;
      };
      contact.addEventListener('pointermove', (e) => {
        mx = e.clientX - cv.getBoundingClientRect().left;
        push = Math.min(1, push + 0.25);
      });
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) { size(); readColors(); raf = requestAnimationFrame(draw); }
      }).observe(cv);
      addEventListener('resize', size);
      onTheme = readColors;
    }
  }

  /* ---------- work filters (FLIP re-layout) ---------- */
  const filterBtns = $$('.filters button');
  const cards = $$('.card');
  function applyFilter(f) {
    const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    cards.forEach((c) => c.classList.toggle('is-hidden', !(f === 'all' || c.dataset.cat === f)));
    if (reduce) return;
    cards.forEach((c) => {
      if (c.classList.contains('is-hidden')) return;
      const a = before.get(c);
      const b = c.getBoundingClientRect();
      if (a.width === 0) {
        c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE });
      } else {
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (dx || dy) {
          c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 400, easing: EASE });
        }
      }
    });
  }
  filterBtns.forEach((b) => b.addEventListener('click', () => {
    filterBtns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    applyFilter(b.dataset.filter);
  }));

  /* ---------- project popup (image morphs from the card) ---------- */
  const data = JSON.parse($('#work-data').textContent);
  const modal = $('#project-modal');
  const mImg = $('.m-shot img', modal);
  let current = 0;
  const cardImg = (i) => {
    const c = cards.find((x) => +x.dataset.i === i);
    return c && !c.classList.contains('is-hidden') ? $('img', c) : null;
  };
  function fill(i) {
    const d = data[i];
    current = i;
    mImg.src = `assets/img/work/${d.slug}.webp`;
    mImg.alt = d.title + ' poster';
    $('.cat', modal).textContent = d.label;
    const [name, stack = ''] = d.title.split(' | ');
    $('#m-title').textContent = name;
    $('.stack', modal).textContent = stack;
    $('.role', modal).textContent = d.role;
    const desc = $('.desc', modal);
    desc.textContent = '';
    d.desc.forEach((par) => {
      const p = document.createElement('p');
      const m = par.match(/^(Goal|Solution|Result):\s*/);
      if (m) {
        const b = document.createElement('b');
        b.textContent = m[1] + ': ';
        p.append(b, par.slice(m[0].length));
      } else {
        p.textContent = par;
      }
      desc.appendChild(p);
    });
    const skills = $('.skills', modal);
    skills.textContent = '';
    d.skills.forEach((s) => {
      const span = document.createElement('span');
      span.textContent = s;
      skills.appendChild(span);
    });
  }
  function openModal(i) {
    fill(i);
    const from = cardImg(i);
    const show = () => { modal.showModal(); document.body.style.overflow = 'hidden'; };
    if (!canVT || !from) { modal.classList.remove('vt'); show(); return; }
    modal.classList.add('vt');
    from.style.viewTransitionName = 'shot';
    const vt = document.startViewTransition(() => {
      from.style.viewTransitionName = '';
      mImg.style.viewTransitionName = 'shot';
      show();
    });
    vt.finished.finally(() => { mImg.style.viewTransitionName = ''; });
  }
  function closeModal() {
    if (!modal.open) return;
    const done = () => { modal.close(); };
    const to = cardImg(current);
    if (!canVT || !to) { done(); return; }
    mImg.style.viewTransitionName = 'shot';
    const vt = document.startViewTransition(() => {
      mImg.style.viewTransitionName = '';
      to.style.viewTransitionName = 'shot';
      done();
    });
    vt.finished.finally(() => { to.style.viewTransitionName = ''; });
  }
  cards.forEach((c) => c.addEventListener('click', () => openModal(+c.dataset.i)));
  modal.addEventListener('close', () => { document.body.style.overflow = ''; });
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  $('.close', modal).addEventListener('click', closeModal);
  const step = (dir) => fill((current + dir + data.length) % data.length);
  $('.prev', modal).addEventListener('click', () => step(-1));
  $('.next', modal).addEventListener('click', () => step(1));
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  /* ---------- copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  $$('.copy-email').forEach((b) => b.addEventListener('click', async () => {
    const email = b.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Copied ' + email);
    } catch (e) {
      showToast(email);
    }
  }));

  /* ---------- live details ---------- */
  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();

  // Lahore's clock, in the call tile and the contact list
  const localTimes = $$('.local-time');
  if (localTimes.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
    const upd = () => {
      const t = fmt.format(new Date()) + ' UTC+5';
      localTimes.forEach((el) => { el.textContent = t; });
    };
    upd();
    setInterval(upd, 30000);
  }
})();
