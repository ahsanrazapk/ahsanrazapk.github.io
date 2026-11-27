/* Ahsan Raza · Portfolio interactions. Plain JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canVT = typeof document.startViewTransition === 'function' && !reduce;
  const EASE = 'cubic-bezier(.22,1,.36,1)';

  /* ---------- theme ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  $('.theme-toggle').addEventListener('click', () => {
    const t = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = t;
    themeMeta.content = t === 'light' ? '#f5f7fa' : '#0b0d14';
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode */ }
  });

  /* ---------- nav: active section ---------- */
  const links = $$('.links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      links.forEach((a) => a.classList.toggle('active', !!id && a.hash === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.hero, main section[id]').forEach((s) => sectionIO.observe(s));

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

  // call timer: time since the page opened, like the timer on a live call
  const timer = $('.call-timer');
  if (timer) {
    const t0 = Date.now();
    const pad = (n) => String(n).padStart(2, '0');
    setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 1000);
  }
})();
