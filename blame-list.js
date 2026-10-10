// ─── LISTE HEBDOMADAIRE DES BLÂMES ──────────────────────────────
// Chaque semaine va du lundi 00h01 au dimanche minuit (même découpage
// que les rapports). Une fois la semaine terminée, la liste des
// personnes qui prennent un blâme est calculée à partir de l'effectif
// et enregistrée dans Firebase (chemin "blameLists/<lundi AAAA-MM-JJ>").
//
// Le site n'a pas de serveur : la liste est créée par le premier
// visiteur (n'importe quelle page, auth.js charge ce fichier) qui
// arrive après le dimanche minuit. Elle est figée dès sa création (les
// changements de l'effectif ne la modifient plus), puis les ✔ de la
// colonne « Rapport » repassent à ✘ pour la nouvelle semaine.
// Elle reste TEMPORAIRE jusqu'au mardi 00h00 qui suit (un « rapport à
// rattraper » envoyé depuis rapport.html en retire la personne), puis
// devient VERROUILLÉE. Le Gérant peut toujours y retirer un blâme
// (blame.html). Elle est supprimée 2 semaines après la fin de sa semaine.
//
// Une personne est dans la liste si sa case « Rapport » est ✘, SAUF :
//   • CT promu le jeudi, vendredi, samedi ou dimanche de la semaine ;
//   • absente en fin de semaine, avec un début d'absence le lundi,
//     mardi ou mercredi de la semaine, ou avant ;
//   • (case « Rapport » ✔, « GR » ou vide : jamais dans la liste).
(function () {
  'use strict';
  if (window.blameList) return;   // déjà chargé (page Blâme + auth.js)

  const FB_PATH = 'blameLists';
  // Première semaine gérée : les semaines d'avant ne peuvent pas être
  // recalculées (l'effectif a changé depuis).
  const FIRST_WEEK = '2026-10-05';
  const WEEK_SHIFT_MS = 60 * 1000;   // la semaine commence le lundi à 00h01
  const BLAME_LEVELS = ['', '1 Blâme', '2 Blâmes', '3 Blâmes'];
  const PLACEHOLDERS = ['', '/', '///', 'N/A'];

  // ── Dates ────────────────────────────────────────────────────
  function weekStart(ts) {
    const d = new Date((ts || 0) - WEEK_SHIFT_MS);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  // Une liste disparaît 2 semaines après la fin de sa semaine.
  // Ex. : semaine du lundi 5 au dimanche 11 → liste créée le dimanche 11
  // à minuit, toujours là le dimanche 18, supprimée à la fin du dimanche
  // 25 (lundi 26 à 00h01).
  function listExpiry(key) {
    const p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2] + 21).getTime() + WEEK_SHIFT_MS;
  }

  function isExpired(key, now) {
    return (now || Date.now()) >= listExpiry(key);
  }

  // La liste est temporaire du dimanche minuit au mardi 00h00 qui suit :
  // pendant ce temps le formulaire « Rapport à rattraper » s'appuie sur
  // elle. Au mardi 00h00 elle est verrouillée, et le formulaire attend la
  // liste du dimanche suivant.
  function finalAt(key) {
    const p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2] + 8).getTime();   // mardi suivant 00h00
  }

  // Fenêtre du formulaire « Rapport à rattraper » : uniquement le lundi,
  // de 00h01 jusqu'au mardi 00h00 (heure locale).
  function isCatchUpWindow(now) {
    const d = new Date(now || Date.now());
    return d.getDay() === 1 && (d.getHours() * 60 + d.getMinutes()) >= 1;
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Même lecture que effectif.html (jj/mm/aaaa ou aaaa-mm-jj)
  function parseFrDate(str) {
    const s = String(str || '').trim();
    let y, mo, d;
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else return null;
    const date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  // ── Blâmes (même calcul que effectif.html, à la date donnée) ──
  function blameCount(row, at, blamesReset) {
    if (!blamesReset) return 0;
    // Insensible à la casse : « 1 blâme » (ancien Sheet) = « 1 Blâme »
    const level = String(row.blames || '').trim().toLowerCase();
    let n = Math.max(0, BLAME_LEVELS.map(function (b) { return b.toLowerCase(); }).indexOf(level));
    // Blâmes datés expirés (un mois après leur date) : déjà retirés
    let log;
    try { log = JSON.parse(row.blameLog || '[]'); } catch (e) { log = []; }
    (Array.isArray(log) ? log : []).forEach(function (b) {
      if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b.d)) return;
      const p = b.d.split('-').map(Number);
      const last = new Date(p[0], p[1] + 1, 0).getDate();
      const expiry = new Date(p[0], p[1], Math.min(p[2], last));
      if (expiry <= at) n--;
    });
    return Math.max(0, n);
  }

  function entries(v) {
    if (!v || typeof v !== 'object') return [];
    return Object.keys(v).map(function (k) { return v[k]; }).filter(Boolean);
  }

  // ── Calcul de la liste d'une semaine ─────────────────────────
  // monday : lundi (00h00) de la semaine terminée.
  function computeList(effectif, monday) {
    const thursday = addDays(monday, 3);
    const sunday = addDays(monday, 6);
    const wednesday = addDays(monday, 2);
    const weekEnd = new Date(addDays(monday, 7).getTime() + WEEK_SHIFT_MS);   // lundi suivant 00h01

    const list = [];
    entries(effectif.sections).forEach(function (sec) {
      entries(sec.rows).forEach(function (row) {
        const matricule = String(row.matricule || '').replace(/\s+/g, ' ').trim();
        if (PLACEHOLDERS.indexOf(matricule) !== -1) return;
        const grade = String(row.grade || '').trim();

        // Case « Rapport » : seul ✘ peut donner un blâme (✔, GR, vide → non)
        if (String(row.rapport || '').trim() !== 'FALSE') return;

        // CT promu du jeudi au dimanche de la semaine
        if (grade === 'CT' || grade === 'Clone Trooper') {
          const promo = parseFrDate(row.promotion);
          if (promo && promo >= thursday && promo <= sunday) return;
        }

        // Absent en fin de semaine (dimanche), absence commencée au plus tard le mercredi
        const debut = parseFrDate(row.absDebut);
        if (debut) {
          const fin = parseFrDate(row.absFin);
          const absent = sunday >= debut && (!fin || sunday <= fin);
          if (absent && debut <= wednesday) return;
        }

        const before = blameCount(row, weekEnd, effectif.blamesReset);
        list.push({ matricule: matricule, grade: grade, before: before, after: before + 1 });
      });
    });
    return list;
  }

  // ── Remise à ✘ de la colonne « Rapport » ───────────────────
  // Juste après la création de la liste : toutes les cases ✔ repassent
  // à ✘ pour la nouvelle semaine (« GR » et cases vides : pas touchées).
  // Seules ces cases sont écrites (PATCH), le reste de l'effectif ne bouge pas.
  async function resetRapports() {
    const s = window.site327;
    const effectif = await s.firebaseGet('effectif');
    if (!effectif || !effectif.sections) return 0;

    const fields = {};
    const keysOf = function (v) { return v && typeof v === 'object' ? Object.keys(v).filter(function (k) { return v[k]; }) : []; };
    keysOf(effectif.sections).forEach(function (si) {
      const rows = effectif.sections[si].rows;
      keysOf(rows).forEach(function (ri) {
        if (String(rows[ri].rapport || '').trim() === 'TRUE') {
          fields['sections/' + si + '/rows/' + ri + '/rapport'] = 'FALSE';
        }
      });
    });

    const count = Object.keys(fields).length;
    if (!count) return 0;
    fields.updatedAt = Date.now();
    fields.updatedBy = 'Remise à zéro des rapports (liste des blâmes)';
    await s.firebasePatch('effectif', fields);
    return count;
  }

  // ── Création de la liste de la semaine qui vient de se terminer ──
  let running = null;

  function ensureLastWeek() {
    if (running) return running;
    running = (async function () {
      const s = window.site327;
      if (!s || !s.isFirebaseConfigured()) return null;

      // Suppression des listes de plus de 2 semaines
      const all = await s.firebaseGet(FB_PATH);
      const expired = {};
      Object.keys(all || {}).forEach(function (k) { if (isExpired(k)) expired[k] = null; });
      if (Object.keys(expired).length) await s.firebasePatch(FB_PATH, expired);

      const monday = addDays(weekStart(Date.now()), -7);   // semaine terminée
      const key = isoDate(monday);
      if (key < FIRST_WEEK) return null;

      // Déjà créée : elle ne change plus, même si l'effectif change
      const existing = all && all[key];
      if (existing) return existing;

      const effectif = await s.firebaseGet('effectif');
      if (!effectif || !effectif.sections) return null;

      const entry = {
        week: key,
        generatedAt: Date.now(),
        list: computeList(effectif, monday)
      };
      if (!entry.list.length) entry.empty = true;   // Firebase n'enregistre pas les tableaux vides

      // Créée entre-temps par un autre visiteur : on garde la sienne
      const again = await s.firebaseGet(FB_PATH + '/' + key);
      if (again) return again;
      await s.firebasePut(FB_PATH + '/' + key, entry);

      // Nouvelle semaine : les ✔ de la colonne « Rapport » repassent à ✘
      try {
        entry.rapportsReset = await resetRapports();
        await s.firebasePatch(FB_PATH + '/' + key, { rapportsReset: entry.rapportsReset });
      } catch (e) { /* la liste est créée ; la remise à ✘ pourra se faire à la main */ }
      return entry;
    })().catch(function () { return null; }).finally(function () { running = null; });
    return running;
  }

  window.blameList = {
    FB_PATH: FB_PATH,
    weekStart: weekStart,
    listExpiry: listExpiry,
    finalAt: finalAt,
    isCatchUpWindow: isCatchUpWindow,
    isExpired: isExpired,
    computeList: computeList,
    resetRapports: resetRapports,
    ensureLastWeek: ensureLastWeek
  };

  // Vérification à chaque chargement de page (sans bloquer la page)
  setTimeout(ensureLastWeek, 1500);
})();
