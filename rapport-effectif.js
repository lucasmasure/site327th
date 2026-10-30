// ─── LIEN ENTRE LES RAPPORTS ET LA COLONNE « RAPPORT » DE L'EFFECTIF ───
// Utilisé par rapport.html (envoi : ✘ → ✔) et reponsesrapport.html
// (refus : ✔ → ✘). Seule la case « Rapport » de la personne est écrite
// (PATCH), le reste de l'effectif n'est pas touché. Une case vide (pas
// de case rapport pour ce grade) ou « GR » n'est jamais modifiée.
// À charger après auth.js.
(function () {
  'use strict';

  const FB_PATH = 'effectif';

  function fold(str) {
    return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ').toLowerCase().trim();
  }

  // Firebase renvoie les tableaux tels quels ou en objets { "0": …, "1": … } :
  // on parcourt les vraies clés pour pouvoir réécrire au bon endroit.
  function entries(v) {
    if (!v || typeof v !== 'object') return [];
    return Object.keys(v).filter(function (k) { return v[k]; }).map(function (k) { return [k, v[k]]; });
  }

  // Passe la case « Rapport » de `identity` de `from` à `to`.
  // Renvoie true si la case a été modifiée, false sinon (personne
  // introuvable, ou case différente de `from` : vide, GR, déjà à jour…).
  async function setRapport(identity, from, to) {
    if (!window.site327 || !window.site327.isFirebaseConfigured()) return false;
    const raw = await window.site327.firebaseGet(FB_PATH);
    if (!raw || !raw.sections) return false;

    const target = fold(identity);
    let path = null;
    entries(raw.sections).some(function (s) {
      return entries(s[1].rows).some(function (r) {
        if (fold(r[1].matricule) !== target) return false;
        if (String(r[1].rapport || '').trim() !== from) return true;   // trouvé, mais pas à modifier
        path = 'sections/' + s[0] + '/rows/' + r[0] + '/rapport';
        return true;
      });
    });
    if (!path) return false;

    const fields = {};
    fields[path] = to;
    // Nouvelle date : la page Effectif ouverte se met à jour, et une
    // personne en train de modifier l'effectif est prévenue avant d'écraser.
    fields.updatedAt = Date.now();
    fields.updatedBy = 'Rapport automatique';
    await window.site327.firebasePatch(FB_PATH, fields);
    return true;
  }

  window.rapportEffectif = {
    // Rapport envoyé : ✘ → ✔
    markSent: function (identity) { return setRapport(identity, 'FALSE', 'TRUE'); },
    // Rapport refusé : ✔ → ✘
    markRefused: function (identity) { return setRapport(identity, 'TRUE', 'FALSE'); }
  };
})();
