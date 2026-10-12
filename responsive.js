// ─── RESPONSIVE COMMUN À TOUTES LES PAGES ───────────────────────
// - Construit le menu hamburger à partir du <nav> existant de la
//   page (index.html a déjà le sien : on n'y touche pas).
// - Enveloppe les tableaux pour qu'ils défilent horizontalement sur
//   mobile au lieu de faire déborder la page.
// Les styles associés sont dans responsive.css.
(function () {
  'use strict';

  // ── Menu hamburger ────────────────────────────────────────────
  const nav = document.querySelector('nav');
  if (nav && !document.getElementById('navToggle')) {
    const logo = nav.querySelector('.nav-logo');

    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.id = 'navLinks';
    Array.from(nav.children).forEach(function (child) {
      if (child !== logo) navLinks.appendChild(child);
    });

    const navToggle = document.createElement('button');
    navToggle.type = 'button';
    navToggle.className = 'nav-toggle';
    navToggle.id = 'navToggle';
    navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.innerHTML = '<span></span><span></span><span></span>';

    nav.appendChild(navToggle);
    nav.appendChild(navLinks);

    const mobileMQ = window.matchMedia('(max-width: 1100px)');

    function closeMenu() {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Sur mobile, un appui sur un lien navigue et referme le panneau
    navLinks.addEventListener('click', function (e) {
      if (mobileMQ.matches && e.target.closest('a')) closeMenu();
    });

    mobileMQ.addEventListener('change', function (mq) {
      if (!mq.matches) closeMenu();
    });
  }

  // ── Tableaux défilants ────────────────────────────────────────
  document.querySelectorAll('table').forEach(function (table) {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();
