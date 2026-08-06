// ─── REMPLACEMENT DES IMAGES PNG PAR DES LIENS IMGUR ─────────────
//
// Comment ça marche :
// - Pour chaque image PNG à remplacer, ajoute une ligne ci-dessous :
//     "nomDuFichier.png": "https://i.imgur.com/xxxxxxx.png",
//   La clé doit être EXACTEMENT le nom de fichier utilisé dans le
//   <img src="..."> des pages HTML (même casse, ex: ".PNG" vs ".png").
// - Le lien Imgur doit être un lien DIRECT vers l'image, pas la page
//   de visualisation. Sur imgur.com, clique droit sur l'image →
//   "Copier l'adresse de l'image" (le lien se termine par .png/.jpg
//   et commence par https://i.imgur.com/...).
// - Logo_327th.png n'est volontairement pas dans cette liste : il
//   reste servi en local (logo du menu, favicon, écran de connexion).
//
// Exemple :
// const IMG_OVERRIDES = {
//   "mois1.png": "https://i.imgur.com/abcd123.png",
//   "arc1.png": "https://i.imgur.com/efgh456.png",
// };

const IMG_OVERRIDES = {
  "2ndltn7th.png": "https://i.imgur.com/iymqySQ.png",
  "2ndltnbacta.png": "https://i.imgur.com/4ARHcVx.png",
  "2ndltnck.png": "https://imgur.com/TLOmy8j.png",
  "2ndltnsp.png": "https://imgur.com/5ZC0GEv.png",
  "aden.png": "https://imgur.com/bsPlF0N.png",
  "adj7th.png": "https://imgur.com/wEAjmAR.png",
  "adjbacta.png": "https://imgur.com/r8y9joS.png",
  "adj-c7th.png": "https://imgur.com/s6QTDLH.png",
  "adj-cck.png": "https://imgur.com/3TgVYnK.png",
  "adjck.png": "https://imgur.com/3FRdQYh.png",
  "adj-csp.png": "https://imgur.com/GbHKpot.png",
};

(function () {
  document.querySelectorAll('img[src]').forEach(function (img) {
    var filename = img.getAttribute('src').split('/').pop();
    if (filename === 'Logo_327th.png') return;
    if (Object.prototype.hasOwnProperty.call(IMG_OVERRIDES, filename)) {
      img.src = IMG_OVERRIDES[filename];
    }
  });
})();
