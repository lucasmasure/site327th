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
  // skins
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
  "adjsp.png": "https://imgur.com/IZt7KlX.png",
  "arc1.png": "https://imgur.com/7Fnrhvt.png",
  "arc2.png": "https://imgur.com/GSa0cde.png",
  "barr.png": "https://imgur.com/rHOmAmS.png",
  "bly.png": "https://imgur.com/bP3dHuz.png",
  "CPL7th.png": "https://imgur.com/A3EhadY.png",
  "CPLbacta.png": "https://imgur.com/5qK4toa.png",
  "cpl-c7th.png": "https://imgur.com/MLAIz8b.png",
  "cpl-cbacta.png": "https://imgur.com/vxBqJJl.png",
  "cpl-cck.png": "https://imgur.com/bwtsNO7.png",
  "CPLck.png": "https://imgur.com/SbKtX2Z.png",
  "cpl-csp.png": "https://imgur.com/cxUVICa.png",
  "CPLsp.png": "https://imgur.com/pYxTvnw.png",
  "cpt2nd7th.png": "https://imgur.com/3aUhuuc.png",
  "cpt2ndbacta.png": "https://imgur.com/PnuOlFI.png",
  "cpt2ndck.png": "https://imgur.com/ZpZA2Ph.png",
  "cpt2ndsp.png": "https://imgur.com/GKuuo1s.png",
  "cpt7th.png": "https://imgur.com/cxs3Be2.png",
  "cptbacta.png": "https://imgur.com/OjFpPSJ.png",
  "cptck.png": "https://imgur.com/Wsenv48.png",
  "cptsp.png": "https://imgur.com/L7eG881.png",
  "CTsp.png": "https://imgur.com/YkMEyzY.png",
  "deviss.png": "https://imgur.com/GOePlBS.png",
  "flame.png": "https://imgur.com/UYyJsV6.png",
  "galle.png": "https://imgur.com/iAu9UKn.png",
  "green.png": "https://imgur.com/htpLOA2.png",
  "kyber.png": "https://imgur.com/OwTo9Ej.png",
  "otto.png": "https://imgur.com/tt8U4nR.png",
  "ltn7th.png": "https://imgur.com/x9TANi4.png",
  "ltnbacta.png": "https://imgur.com/Bv8pyOd.png",
  "ltnck.png": "https://imgur.com/fRUxQ53.png",
  "ltnsp.png": "https://imgur.com/Vl5hOwB.png",
  "mjr7th.png": "https://imgur.com/BbkPZuk.png",
  "mjrbacta.png": "https://imgur.com/VsK245i.png",
  "mjrck.png": "https://imgur.com/3uZSpXD.png",
  "mjrsp.png": "https://imgur.com/JzH4vpA.png",
  "sgt7th.png": "https://imgur.com/U0fHwvf.png",
  "sgtbacta.png": "https://imgur.com/KVb6YBW.png",
  "sgt-c7th.png": "https://imgur.com/Wia7hNE.png",
  "sgt-cbacta.png": "https://imgur.com/dL5XDP7.png",
  "sgt-cck.png": "https://imgur.com/FQ5FIsO.png",
  "sgtck.png": "https://imgur.com/ndH2J37.png",
  "sgt-csp.png": "https://imgur.com/Xpmb8iX.png",
  "sgtsp.png": "https://imgur.com/KnJpLXv.png",
  "twelve.png": "https://imgur.com/bkcX51H.png",
  "tyto.png": "https://imgur.com/jgsZk1J.png",
  "vcmd7th.png": "https://imgur.com/a5VhMNM.png",
  "vcmdbacta.png": "https://imgur.com/sIJk4RY.png",
  "vcmdck.png": "https://imgur.com/kZzVliu.png",
  "vcmdsp.png": "https://imgur.com/dfPSk2k.png",
  // véhicule
  "tx-427.png": "https://imgur.com/hLx77xu.png",
  "barc.png": "https://imgur.com/fRjtFhB.png",
  // Page RC
  "rc.png": "https://imgur.com/NQu5x3K.png",
  "rc1.png": "https://imgur.com/0Es37x9.png",
  "rc3.jpg": "https://imgur.com/R6BxxDJ.png",
  // Mando pour les nuls
  "mando.PNG": "https://imgur.com/32wwHUE.png",
  // radio
  "radio1.png": "https://imgur.com/MQXKANY.png",
  "radio2.png": "https://imgur.com/ZZLJc7x.png",
  "radio3.png": "https://imgur.com/54JDH5d.png",
  "radio4.png": "https://imgur.com/b8roRy1.png",
  "radio5.png": "https://imgur.com/fo950x7.png",
  "radio6.png": "https://imgur.com/RMCHzx8.png",
  "radio7.png": "https://imgur.com/y4tS9On.png",
  "radio8.png": "https://imgur.com/uWFa2zY.png",
  "radio9.png": "https://imgur.com/h8lErui.png",
  "radio10.png": "https://imgur.com/xkpdDxG.png",
  "radio11.png": "https://imgur.com/bBaeVBN.png",
  "radio12.png": "https://imgur.com/OhxGg4i.png",
  "radio13.png": "https://imgur.com/gsUwgBT.png",
  "radio14.png": "https://imgur.com/RyYo7tN.png",
  "radio15.png": "https://imgur.com/CNMAdZz.png",
  "radio16.png": "https://imgur.com/S7KPiWC.png",
  "radio17.png": "https://imgur.com/QnjwNSX.png",
  // médailles
  "médaille1.png": "https://imgur.com/mfiiZBB.png",
  "médaille2.png": "https://imgur.com/wTwtfD1.png",
  "médaille3.png": "https://imgur.com/oJzH7dS.png",
  "médaille4.png": "https://imgur.com/GQSdwuF.png",
  "médaille5.png": "https://imgur.com/AaaKzMY.png",
  "médaille6.png": "https://imgur.com/ZkepGsd.png",
  "médaille7.png": "https://imgur.com/upboosI.png",
  "médaille8.png": "https://imgur.com/Iw55MkR.png",
  "médaille9.png": "https://imgur.com/gxiGCZa.png",
  "médaille10.png": "https://imgur.com/ZSSW0eK.png",
  "médaille11.png": "https://imgur.com/LsFjGF6.png",
  "médaille12.png": "https://imgur.com/26CfL9v.png",
  "médaille13.png": "https://imgur.com/1Yds1Pb.png",
  "médaille14.png": "https://imgur.com/E48YXpc.png",
  "médaille15.png": "https://imgur.com/npT0DtX.png",
  "médaille16.png": "https://imgur.com/mFLJbWh.png",
  "médaille17.png": "https://imgur.com/KqEXSxv.png",
  "médaille18.png": "https://imgur.com/AldEIo2.png",
  "médaille19.png": "https://imgur.com/JtDeqm7.png",
  // 327th du mois
  "mois1.png": "https://imgur.com/M3jMgFS.png",
  "mois2.png": "https://imgur.com/cAiDVs1.png",
  "mois3.png": "https://imgur.com/H59nwL8.png",
  "mois4.png": "https://imgur.com/f1Pbn0n.png",
  "mois5.png": "https://imgur.com/kmXzvsj.png",
  "mois6.png": "https://imgur.com/M1pRlGr.png",
  "mois7.png": "https://imgur.com/fMrj84u.png",
  "mois8.png": "https://imgur.com/xKQYSuW.png",
  "mois9.png": "https://imgur.com/DCyHm2e.png",
  "mois10.png": "https://imgur.com/feKveZm.png",
  "mois11.png": "https://imgur.com/7z68icO.png",
  "mois12.png": "https://imgur.com/rc0ke3D.png",
  "mois13.png": "https://imgur.com/5AGTSrj.png",
  "mois14.png": "https://imgur.com/exBdXw7.png",
  "mois15.png": "https://imgur.com/Q0GFcoT.png",
  "mois16.png": "https://imgur.com/NFHKPx3.png",
  "mois17.png": "https://imgur.com/VL0NYJy.png",
  "mois18.png": "https://imgur.com/CDEfXE9.png",
  "mois19.png": "https://imgur.com/C9wHjko.png",
  "mois20.png": "https://imgur.com/twbz29X.png",
  "mois21.png": "https://imgur.com/Kmrdp4J.png",
  "mois22.png": "https://imgur.com/tvpa8Di.png",
  "mois23.png": "https://imgur.com/ItUpxZV.png",
  "mois24.png": "https://imgur.com/JSBryva.png",
  "mois25.png": "https://imgur.com/b35SNKI.png",
  "mois26.png": "https://imgur.com/GWE6DYj.png",
  "mois27.png": "https://imgur.com/9cpDmC7.png",
  "mois28.png": "https://imgur.com/OxSy09T.png",
  "mois29.png": "https://imgur.com/Mhhn3BJ.png",
  "mois30.png": "https://imgur.com/tjvN0bU.png",
  "mois31.png": "https://imgur.com/6dXyHFE.png",
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
