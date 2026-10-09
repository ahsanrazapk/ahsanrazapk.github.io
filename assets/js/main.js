/* Ahsan Raza · Portfolio interactions. Plain JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const canVT = typeof document.startViewTransition === 'function' && !reduce;

  /* ---------- theme (circular reveal from the toggle) ---------- */
  const themeBtn = $('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  function setTheme(t) {
    root.dataset.theme = t;
    themeMeta.content = t === 'light' ? '#EDF0F7' : '#05060B';
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode */ }
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
        { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('theme-vt'));
  });

  /* ---------- split the hero name into animated letters ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi, words) => {
      const w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--i', i++);
        w.appendChild(s);
      }
      el.appendChild(w);
      if (wi < words.length - 1) { el.appendChild(document.createTextNode(' ')); i++; }
    });
  });

  /* ---------- voice waveform bars ---------- */
  $$('[data-wave]').forEach((w) => {
    const n = +w.dataset.wave;
    for (let k = 0; k < n; k++) {
      const bar = document.createElement('i');
      bar.style.setProperty('--i', k);
      bar.style.setProperty('--h', (0.3 + 0.7 * Math.abs(Math.sin(k * 1.7) * Math.cos(k * 0.45))).toFixed(2));
      w.appendChild(bar);
    }
  });

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- count-up numbers ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      if (reduce) return;
      const el = e.target;
      const to = +el.dataset.count;
      const from = +(el.dataset.from || 0);
      el.textContent = from;
      setTimeout(() => {
        const t0 = performance.now();
        const dur = 1700;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, el.closest('.hero') ? 1300 : 0);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- nav: sliding indicator + active section ---------- */
  const links = $$('.links a');
  const indicator = $('.links .indicator');
  let activeLink = null;
  function moveIndicator(a) {
    if (!a || !a.offsetWidth) { indicator.style.opacity = 0; return; }
    indicator.style.opacity = 1;
    indicator.style.left = a.offsetLeft + 'px';
    indicator.style.width = a.offsetWidth + 'px';
  }
  links.forEach((a) => {
    a.addEventListener('mouseenter', () => moveIndicator(a));
    a.addEventListener('mouseleave', () => moveIndicator(activeLink));
  });
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      activeLink = id ? links.find((a) => a.hash === '#' + id) || null : null;
      links.forEach((a) => a.classList.toggle('active', a === activeLink));
      moveIndicator(activeLink);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.hero, main section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------- scroll progress + timeline fill ---------- */
  const progress = $('.progress');
  const timeline = $('.timeline');
  const railFill = $('.timeline .rail i');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      if (timeline) {
        const r = timeline.getBoundingClientRect();
        const p = (innerHeight * 0.62 - r.top) / r.height;
        railFill.style.setProperty('--fill', Math.max(0, Math.min(1, p)).toFixed(3));
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- pointer effects (desktop only) ---------- */
  if (finePointer && !reduce) {
    root.classList.add('has-pointer');

    // soft light that trails the cursor
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 3, tx = gx, ty = gy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    })();

    // hero portrait tilts and floating chips drift with the cursor
    const hero = $('[data-parallax]');
    const stage = hero && $('.stage3d', hero);
    if (hero) {
      addEventListener('pointermove', (e) => {
        if (scrollY > innerHeight) return;
        const px = e.clientX / innerWidth - 0.5;
        const py = e.clientY / innerHeight - 0.5;
        stage.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
        hero.style.setProperty('--px', px.toFixed(3));
        hero.style.setProperty('--py', py.toFixed(3));
      }, { passive: true });
    }

    // magnetic buttons
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.32).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    // 3D tilt on project cards
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .15s ease-out, opacity .5s';
        card.style.transform = `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transition = ''; card.style.transform = ''; });
    });
  }

  // spotlight follows the pointer inside glass panels
  $$('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ripple on press
  $$('.btn').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      if (reduce) return;
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left - d / 2) + 'px';
      s.style.top = (e.clientY - r.top - d / 2) + 'px';
      b.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  });

  /* ---------- work filters (FLIP re-layout) ---------- */
  const filterBtns = $$('.filters button');
  const pill = $('.filters .pill');
  const cards = $$('.card');
  function movePill(btn) {
    pill.style.left = btn.offsetLeft + 'px';
    pill.style.width = btn.offsetWidth + 'px';
  }
  function applyFilter(f) {
    const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    cards.forEach((c) => c.classList.toggle('is-hidden', !(f === 'all' || c.dataset.cat === f)));
    if (reduce) return;
    cards.forEach((c) => {
      if (c.classList.contains('is-hidden')) return;
      const a = before.get(c);
      const b = c.getBoundingClientRect();
      if (a.width === 0) {
        c.animate(
          [{ opacity: 0, transform: 'scale(.88)', filter: 'blur(10px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
          { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      } else {
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (dx || dy) {
          c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
            { duration: 750, easing: 'cubic-bezier(.34,1.3,.64,1)' });
        }
      }
    });
  }
  filterBtns.forEach((b) => b.addEventListener('click', () => {
    filterBtns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    movePill(b);
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

  /* ---------- small details ---------- */
  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();
  const localTime = $('.local-time');
  if (localTime) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
    const upd = () => { localTime.textContent = fmt.format(new Date()) + ' in Lahore'; };
    upd();
    setInterval(upd, 30000);
  }

  // keep the sliding pills aligned after fonts load and on resize
  const realign = () => {
    movePill(filterBtns.find((b) => b.getAttribute('aria-selected') === 'true') || filterBtns[0]);
    moveIndicator(activeLink);
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(realign);
  addEventListener('resize', realign);
  realign();
})();
