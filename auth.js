// ─── SYSTÈME DE CONNEXION 327TH (100% côté navigateur) ───────────
//
// Il n'y a pas de serveur derrière ce site (pages statiques). Les
// comptes créés ici (email / pseudo / mot de passe) sont donc
// enregistrés UNIQUEMENT dans le navigateur de la personne qui les
// crée (localStorage), pas partagés entre appareils, et ne
// constituent pas une vraie sécurité. C'est une connexion "cosmétique"
// (personnalisation + petite barrière d'accès), pas un système
// d'authentification sécurisé.
//
(function () {
  'use strict';

  const KEY_ACCOUNTS = '327th_accounts';
  const KEY_SESSION   = '327th_session';
  const KEY_RESET     = '327th_reset';

  // ── Configuration EmailJS (envoi du code de réinitialisation) ──
  // Pour activer l'envoi réel du mail : créer un compte gratuit sur
  // https://www.emailjs.com puis renseigner ci-dessous le Service ID,
  // le Template ID et la Public Key trouvés dans le tableau de bord
  // EmailJS. Le template doit utiliser les variables {{to_email}},
  // {{pseudo}} et {{code}}, avec le champ "To email" réglé sur
  // {{to_email}}. Tant que ces valeurs ne sont pas renseignées, la
  // demande de réinitialisation affichera un message d'erreur.
  const EMAILJS_PUBLIC_KEY  = 'ctGv3zbS59CFZm7gw';
  const EMAILJS_SERVICE_ID  = 'service_g812ffp';
  const EMAILJS_TEMPLATE_ID = 'template_citjqcq';

  // ── Rôles ────────────────────────────────────────────────────
  // Rôle attribué automatiquement selon l'adresse mail du compte.
  // ATTENTION : comme il n'y a pas de vérification d'email à
  // l'inscription, ce n'est pas une vraie protection — n'importe qui
  // peut créer un compte avec cette adresse sur son propre appareil
  // et obtenir ce rôle. C'est purement déclaratif/cosmétique, comme
  // le reste du système (voir note en haut de fichier).
  const ADMIN_EMAILS = ['lucas.masure@gmail.com'];

  // ── Synchronisation des Gérants (Firebase Realtime Database) ──
  // La liste des Gérants ajoutés depuis le panneau doit être visible
  // par TOUT LE MONDE, sur n'importe quel appareil — localStorage ne
  // suffit pas pour ça. Pour l'activer : créer un projet Firebase
  // gratuit, activer Realtime Database, et renseigner l'URL ci-dessous.
  // Tant que ce n'est pas configuré, seule la liste ADMIN_EMAILS
  // codée en dur ci-dessus fonctionne.
  const FIREBASE_DB_URL = 'https://th-site-f3656-default-rtdb.europe-west1.firebasedatabase.app';

  let remoteAdminEmailsCache = [];
  let remoteAdminEmailsLoaded = false;
  let remoteAdminEmailsPromise = null;

  function isFirebaseConfigured() {
    return !!FIREBASE_DB_URL && FIREBASE_DB_URL.indexOf('REMPLACER') !== 0;
  }

  // ── API publique minimale exposée aux pages ─────────────────
  // Permet à une page (ex: 327mois.html) de lire/écrire dans la même
  // base Firebase que le reste du site, et de réagir au mode
  // modification / à l'ouverture du menu Gérant, sans dupliquer la
  // config Firebase ni le système d'auth dans chaque page.
  window.site327 = {
    isEditMode: isEditMode,
    isFirebaseConfigured: isFirebaseConfigured,
    firebaseGet: function (path) {
      if (!isFirebaseConfigured()) return Promise.resolve(null);
      return fetch(FIREBASE_DB_URL + '/' + path + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    },
    firebasePut: function (path, value) {
      if (!isFirebaseConfigured()) {
        return Promise.reject(new Error("La synchronisation n'est pas encore configurée sur ce site. Contactez un administrateur."));
      }
      return fetch(FIREBASE_DB_URL + '/' + path + '.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      }).then(function (r) {
        if (!r.ok) throw new Error('Erreur de synchronisation (' + r.status + '). Réessayez.');
        return value;
      });
    }
  };

  function fetchRemoteAdminEmails() {
    if (!isFirebaseConfigured()) {
      remoteAdminEmailsLoaded = true;
      return Promise.resolve(remoteAdminEmailsCache);
    }
    return fetch(FIREBASE_DB_URL + '/adminEmails.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        remoteAdminEmailsCache = Array.isArray(data) ? data.filter(Boolean) : [];
        remoteAdminEmailsLoaded = true;
        return remoteAdminEmailsCache;
      })
      .catch(function () {
        remoteAdminEmailsLoaded = true;
        return remoteAdminEmailsCache;
      });
  }

  function ensureAdminEmailsLoaded() {
    if (!remoteAdminEmailsPromise) remoteAdminEmailsPromise = fetchRemoteAdminEmails();
    return remoteAdminEmailsPromise;
  }

  function saveRemoteAdminEmails(list) {
    if (!isFirebaseConfigured()) {
      return Promise.reject(new Error("La synchronisation des Gérants n'est pas encore configurée sur ce site. Contactez un administrateur."));
    }
    return fetch(FIREBASE_DB_URL + '/adminEmails.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    }).then(function (r) {
      if (!r.ok) throw new Error('Erreur de synchronisation (' + r.status + '). Réessayez.');
      remoteAdminEmailsCache = list;
    });
  }

  function getAllAdminEmails() {
    return ADMIN_EMAILS.map(function (e) { return e.toLowerCase(); })
      .concat(remoteAdminEmailsCache.map(function (e) { return e.toLowerCase(); }));
  }

  // Pseudo affiché dans le panneau de gestion pour chaque Gérant, peu
  // importe l'appareil sur lequel il s'est inscrit. Limité aux emails
  // ayant le rôle Gérant (pas besoin de publier le pseudo de tous les
  // membres pour cette fonctionnalité).
  let remotePseudosCache = [];
  let remotePseudosPromise = null;

  function fetchRemotePseudos() {
    if (!isFirebaseConfigured()) return Promise.resolve(remotePseudosCache);
    return fetch(FIREBASE_DB_URL + '/pseudos.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        remotePseudosCache = Array.isArray(data) ? data.filter(Boolean) : [];
        return remotePseudosCache;
      })
      .catch(function () { return remotePseudosCache; });
  }

  function ensurePseudosLoaded() {
    if (!remotePseudosPromise) remotePseudosPromise = fetchRemotePseudos();
    return remotePseudosPromise;
  }

  function saveRemotePseudos(list) {
    if (!isFirebaseConfigured()) return Promise.reject(new Error('Synchronisation non configurée.'));
    return fetch(FIREBASE_DB_URL + '/pseudos.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    }).then(function (r) {
      if (!r.ok) throw new Error('Erreur de synchronisation (' + r.status + ').');
      remotePseudosCache = list;
    });
  }

  async function upsertRemotePseudo(email, pseudo) {
    await ensurePseudosLoaded();
    const emailLc = email.trim().toLowerCase();
    const updated = remotePseudosCache.filter(function (e) { return e.email.toLowerCase() !== emailLc; });
    updated.push({ email: email, pseudo: pseudo });
    try { await saveRemotePseudos(updated); } catch (e) { /* best-effort, pas bloquant */ }
  }

  function getRemotePseudo(email) {
    const emailLc = email.trim().toLowerCase();
    const entry = remotePseudosCache.find(function (e) { return e.email.toLowerCase() === emailLc; });
    return entry ? entry.pseudo : null;
  }

  function getRole(email) {
    if (email && getAllAdminEmails().indexOf(email.trim().toLowerCase()) !== -1) return 'Gérant';
    return 'Membre';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  (function loadEmailJsSdk() {
    if (window.emailjs || document.querySelector('script[data-emailjs]')) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.setAttribute('data-emailjs', '1');
    document.head.appendChild(s);
  })();

  function waitForEmailJs(timeoutMs) {
    return new Promise(function (resolve, reject) {
      const start = Date.now();
      (function poll() {
        if (window.emailjs) return resolve(window.emailjs);
        if (Date.now() - start > timeoutMs) return reject(new Error("Service mail indisponible pour le moment. Réessayez plus tard."));
        setTimeout(poll, 150);
      })();
    });
  }

  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async function sendResetEmail(account, code) {
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.indexOf('REMPLACER') === 0) {
      throw new Error("L'envoi de mail n'est pas encore configuré sur ce site. Contactez un administrateur.");
    }
    const ejs = await waitForEmailJs(4000);
    return ejs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: account.email,
      pseudo: account.pseudo,
      code: code
    }, EMAILJS_PUBLIC_KEY);
  }

  // ── Stockage local ──────────────────────────────────────────
  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(KEY_ACCOUNTS)) || []; }
    catch (e) { return []; }
  }
  function saveAccounts(list) {
    localStorage.setItem(KEY_ACCOUNTS, JSON.stringify(list));
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEY_SESSION)); }
    catch (e) { return null; }
  }
  function setSession(data) {
    localStorage.setItem(KEY_SESSION, JSON.stringify(data));
  }
  function clearSession() {
    localStorage.removeItem(KEY_SESSION);
  }

  const KEY_EDIT_MODE = '327th_edit_mode';
  function isEditMode() {
    return localStorage.getItem(KEY_EDIT_MODE) === 'true';
  }
  function setEditMode(on) {
    localStorage.setItem(KEY_EDIT_MODE, on ? 'true' : 'false');
    document.body.classList.toggle('edit-mode-active', on);
    document.dispatchEvent(new CustomEvent('327th-editmode-change', { detail: { editMode: on } }));
  }

  function findAccount(identifier) {
    const id = identifier.trim().toLowerCase();
    return getAccounts().find(function (a) {
      return a.email.toLowerCase() === id || a.pseudo.toLowerCase() === id;
    });
  }

  async function hashPassword(pwd) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const enc = new TextEncoder().encode(pwd);
        const buf = await window.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map(function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      } catch (e) { /* repli ci-dessous */ }
    }
    // Repli si SubtleCrypto indisponible (contexte non sécurisé)
    let h = 0;
    for (let i = 0; i < pwd.length; i++) { h = (h * 31 + pwd.charCodeAt(i)) >>> 0; }
    return 'f' + h.toString(16);
  }

  // ── Styles ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .auth-widget {
      position: fixed; right: 24px; bottom: 24px; z-index: 500;
      display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
    }

    .menu-btn {
      display: none;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--gold);
      background: rgba(13,13,26,0.92);
      border: 1px solid rgba(240,180,41,0.4);
      border-radius: 999px; padding: 9px 18px; cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 16px rgba(240,180,41,0.12);
      backdrop-filter: blur(6px);
      transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s;
    }
    .menu-btn.show { display: block; }
    .menu-btn:hover { background: var(--gold); color: var(--bg); border-color: var(--gold); transform: translateY(-2px); }

    body.edit-mode-active nav a,
    body.edit-mode-active .dropdown-content a {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .edit-mode-toast {
      position: fixed; left: 50%; bottom: 96px; z-index: 10500;
      max-width: min(420px, calc(100vw - 40px));
      background: rgba(13,13,26,0.97); border: 1px solid rgba(240,180,41,0.4);
      border-radius: 6px; padding: 12px 18px; color: var(--text);
      font-family: 'Exo 2', sans-serif; font-size: 0.8rem; text-align: center; line-height: 1.4;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      opacity: 0; pointer-events: none;
      transform: translateX(-50%) translateY(20px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .edit-mode-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    .auth-btn {
      display: flex; align-items: center; gap: 7px;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--gold);
      background: rgba(13,13,26,0.92);
      border: 1px solid rgba(240,180,41,0.4);
      border-radius: 999px; padding: 12px 20px; cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 16px rgba(240,180,41,0.12);
      backdrop-filter: blur(6px);
      transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s;
    }
    .auth-btn:hover { background: var(--gold); color: var(--bg); border-color: var(--gold); transform: translateY(-2px); }

    .auth-user-menu {
      display: none; position: absolute; bottom: calc(100% + 10px); top: auto; right: 0;
      min-width: 220px; background: rgba(13,13,26,0.97);
      border: 1px solid rgba(200,146,42,0.3); border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6); padding: 14px; z-index: 260;
    }
    .auth-user-menu.open { display: block; }
    .auth-user-name-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
    .auth-user-name { font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 0.05em; color: var(--gold); }
    .auth-settings-btn {
      flex-shrink: 0; background: none; border: none; cursor: pointer;
      font-size: 0.85rem; line-height: 1; padding: 2px; color: var(--text-dim);
      transition: color 0.2s, transform 0.3s;
    }
    .auth-settings-btn:hover { color: var(--gold); transform: rotate(45deg); }
    .auth-user-email { font-size: 0.72rem; color: var(--text-dim); margin-bottom: 8px; word-break: break-all; }
    .auth-user-role {
      display: none; font-family: 'Orbitron', sans-serif; font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--bg);
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
      padding: 3px 9px; border-radius: 999px; margin-bottom: 12px;
    }
    .auth-user-role.show { display: inline-block; }
    .auth-manage-btn {
      display: none; width: 100%; font-family: 'Exo 2', sans-serif; font-size: 0.72rem;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--gold);
      background: rgba(240,180,41,0.1); border: 1px solid rgba(240,180,41,0.35);
      border-radius: 4px; padding: 8px; cursor: pointer; margin-bottom: 8px;
      transition: background 0.2s;
    }
    .auth-manage-btn.show { display: block; }
    .auth-manage-btn:hover { background: rgba(240,180,41,0.22); }
    .auth-logout-btn {
      width: 100%; font-family: 'Exo 2', sans-serif; font-size: 0.75rem;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--text);
      background: rgba(200,30,30,0.12); border: 1px solid rgba(220,80,80,0.4);
      border-radius: 4px; padding: 8px; cursor: pointer; transition: background 0.2s;
    }
    .auth-logout-btn:hover { background: rgba(220,60,60,0.28); }

    .auth-overlay {
      position: fixed; inset: 0; z-index: 10000;
      display: none; align-items: center; justify-content: center;
      background: rgba(4,4,9,0.72); backdrop-filter: blur(4px);
      padding: 20px; opacity: 0; transition: opacity 0.25s ease;
    }
    .auth-overlay.open { display: flex; }
    .auth-overlay.show { opacity: 1; }

    .auth-modal {
      position: relative; width: min(380px, 100%);
      background: linear-gradient(180deg, rgba(13,13,26,0.98), rgba(6,6,13,0.98));
      border: 1px solid rgba(240,180,41,0.35); border-radius: 8px;
      box-shadow: 0 0 0 1px rgba(240,180,41,0.08), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(240,180,41,0.08);
      padding: 30px 26px 26px;
      transform: translateY(-14px) scale(0.97);
      transition: transform 0.25s ease;
    }
    .auth-overlay.show .auth-modal { transform: translateY(0) scale(1); }

    .auth-close {
      position: absolute; top: 14px; right: 14px; width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid rgba(200,146,42,0.3); border-radius: 4px;
      color: var(--text-dim); font-size: 0.9rem; cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .auth-close:hover { color: var(--gold); border-color: var(--gold); }

    .auth-title {
      font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 0.95rem;
      letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold);
      margin-bottom: 4px; padding-right: 30px;
    }
    .auth-subtitle { font-size: 0.75rem; color: var(--text-dim); letter-spacing: 0.03em; margin-bottom: 20px; }

    .auth-tabs {
      display: flex; gap: 6px; margin-bottom: 20px;
      border: 1px solid rgba(200,146,42,0.25); border-radius: 5px; padding: 3px;
    }
    .auth-tab {
      flex: 1; background: none; border: none; padding: 8px 6px;
      font-family: 'Exo 2', sans-serif; font-size: 0.66rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim);
      border-radius: 3px; cursor: pointer; transition: background 0.2s, color 0.2s;
    }
    .auth-tab.active { background: rgba(240,180,41,0.15); color: var(--gold); }

    .auth-form { display: none; flex-direction: column; gap: 14px; }
    .auth-form.active { display: flex; }

    .auth-field { display: flex; flex-direction: column; gap: 6px; }
    .auth-field label { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
    .auth-field input {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(200,146,42,0.3);
      border-radius: 4px; padding: 10px 12px; font-family: 'Exo 2', sans-serif;
      font-size: 0.85rem; color: var(--text); outline: none;
      transition: border-color 0.2s, background 0.2s;
    }
    .auth-field input:focus { border-color: var(--gold); background: rgba(240,180,41,0.05); }

    .auth-hint { font-size: 0.68rem; color: var(--text-dim); opacity: 0.8; line-height: 1.4; }

    .auth-error {
      display: none; font-size: 0.72rem; color: #ff8080;
      background: rgba(220,50,50,0.1); border: 1px solid rgba(220,80,80,0.3);
      border-radius: 4px; padding: 8px 10px;
    }
    .auth-error.show { display: block; }

    .auth-success {
      display: none; font-size: 0.72rem; color: #7fe0a0;
      background: rgba(40,180,100,0.1); border: 1px solid rgba(80,200,120,0.3);
      border-radius: 4px; padding: 8px 10px;
    }
    .auth-success.show { display: block; }

    .auth-link {
      background: none; border: none; align-self: center;
      font-family: 'Exo 2', sans-serif; font-size: 0.7rem; letter-spacing: 0.03em;
      color: var(--text-dim); text-decoration: underline; cursor: pointer;
    }
    .auth-link:hover { color: var(--gold); }

    .auth-link-back {
      background: none; border: none; align-self: flex-start;
      font-family: 'Exo 2', sans-serif; font-size: 0.68rem; letter-spacing: 0.03em;
      color: var(--text-dim); text-decoration: underline; cursor: pointer;
    }
    .auth-link-back:hover { color: var(--gold); }

    .auth-submit {
      margin-top: 4px; padding: 12px; font-family: 'Orbitron', sans-serif;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--bg); background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
      border: none; border-radius: 4px; cursor: pointer;
      transition: filter 0.2s, transform 0.2s;
    }
    .auth-submit:hover { filter: brightness(1.12); transform: translateY(-1px); }

    .admin-list {
      margin-top: 20px; display: flex; flex-direction: column; gap: 8px;
      max-height: 260px; overflow-y: auto;
    }
    .admin-list-item {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 12px; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(200,146,42,0.2); border-radius: 4px;
    }
    .admin-list-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .admin-list-pseudo { font-family: 'Orbitron', sans-serif; font-size: 0.72rem; color: var(--gold); }
    .admin-list-email { font-size: 0.68rem; color: var(--text-dim); word-break: break-all; }
    .admin-list-tag { font-size: 0.6rem; color: var(--text-dim); opacity: 0.7; text-transform: uppercase; letter-spacing: 0.05em; }
    .admin-remove-btn {
      flex-shrink: 0; font-family: 'Exo 2', sans-serif; font-size: 0.64rem;
      text-transform: uppercase; letter-spacing: 0.05em; color: var(--text);
      background: rgba(200,30,30,0.12); border: 1px solid rgba(220,80,80,0.4);
      border-radius: 4px; padding: 6px 10px; cursor: pointer; transition: background 0.2s;
    }
    .admin-remove-btn:hover { background: rgba(220,60,60,0.28); }
    .admin-remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    @media (max-width: 480px) {
      .auth-modal { padding: 26px 20px 22px; }
      .auth-btn { padding: 7px 10px; font-size: 0.6rem; gap: 5px; }
    }
    @media (max-width: 380px) {
      .auth-btn .auth-text { display: none; }
    }
  `;
  document.head.appendChild(style);

  // ── Structure DOM ───────────────────────────────────────────
  const widget = document.createElement('div');
  widget.className = 'auth-widget';
  widget.innerHTML = `
    <button class="menu-btn" id="menuBtn" type="button">Menu</button>
    <button class="auth-btn" id="authBtn" type="button">
      <span id="authBtnIcon">🔐</span>
      <span class="auth-text" id="authBtnText">Connexion</span>
      <span id="authBtnCaret" style="display:none;">⌄</span>
    </button>
    <div class="auth-user-menu" id="authUserMenu">
      <div class="auth-user-name-row">
        <div class="auth-user-name" id="authUserName"></div>
        <button class="auth-settings-btn" id="authSettingsBtn" type="button" title="Modifier mon pseudo" aria-label="Modifier mon pseudo">⚙️</button>
      </div>
      <div class="auth-user-email" id="authUserEmail"></div>
      <div class="auth-user-role" id="authUserRole"></div>
      <button class="auth-manage-btn" id="authManageBtn" type="button">🛠️ Gérer les Gérants</button>
      <button class="auth-logout-btn" id="authLogoutBtn" type="button">Se déconnecter</button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  overlay.id = 'authOverlay';
  overlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="auth-close" id="authCloseBtn" type="button" aria-label="Fermer">✕</button>
      <div class="auth-title" id="authTitle">Accès 327th</div>
      <div class="auth-subtitle" id="authSubtitle">Connectez-vous pour accéder à votre espace.</div>

      <div class="auth-tabs">
        <button class="auth-tab active" id="authTabLogin" type="button">Connexion</button>
        <button class="auth-tab" id="authTabRegister" type="button">Première connexion</button>
      </div>

      <form class="auth-form active" id="authFormLogin" novalidate>
        <div class="auth-field">
          <label for="authLoginId">Pseudo ou email</label>
          <input type="text" id="authLoginId" autocomplete="username" required>
        </div>
        <div class="auth-field">
          <label for="authLoginPwd">Mot de passe</label>
          <input type="password" id="authLoginPwd" autocomplete="current-password" required>
        </div>
        <div class="auth-error" id="authLoginError"></div>
        <button type="submit" class="auth-submit">Se connecter</button>
        <button type="button" class="auth-link" id="authForgotBtn">Mot de passe oublié ?</button>
      </form>

      <form class="auth-form" id="authFormReset" novalidate>
        <div class="auth-field">
          <label for="authResetId">Pseudo ou email</label>
          <input type="text" id="authResetId" autocomplete="username" required>
        </div>
        <div class="auth-hint">Un code de confirmation à 6 chiffres va être envoyé à l'adresse mail associée à ce compte.</div>
        <div class="auth-error" id="authResetError"></div>
        <div class="auth-success" id="authResetSuccess"></div>
        <button type="submit" class="auth-submit">Envoyer le code</button>
        <button type="button" class="auth-link-back" id="authResetBackBtn">← Retour à la connexion</button>
      </form>

      <form class="auth-form" id="authFormResetConfirm" novalidate>
        <div class="auth-field">
          <label for="authResetCode">Code reçu par mail</label>
          <input type="text" id="authResetCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
        </div>
        <div class="auth-field">
          <label for="authResetNewPwd">Nouveau mot de passe</label>
          <input type="password" id="authResetNewPwd" autocomplete="new-password" required>
        </div>
        <div class="auth-error" id="authResetConfirmError"></div>
        <button type="submit" class="auth-submit">Réinitialiser le mot de passe</button>
        <button type="button" class="auth-link-back" id="authResetConfirmBackBtn">← Retour à la connexion</button>
      </form>

      <form class="auth-form" id="authFormRegister" novalidate>
        <div class="auth-field">
          <label for="authRegPseudo">Pseudo</label>
          <input type="text" id="authRegPseudo" autocomplete="nickname" required>
        </div>
        <div class="auth-field">
          <label for="authRegEmail">Adresse mail</label>
          <input type="email" id="authRegEmail" autocomplete="email" required>
        </div>
        <div class="auth-field">
          <label for="authRegPwd">Définir un mot de passe</label>
          <input type="password" id="authRegPwd" autocomplete="new-password" required>
        </div>
        <div class="auth-hint">Ce compte est enregistré uniquement sur cet appareil / ce navigateur.</div>
        <div class="auth-error" id="authRegError"></div>
        <button type="submit" class="auth-submit">Créer mon compte</button>
      </form>
    </div>
  `;

  const adminOverlay = document.createElement('div');
  adminOverlay.className = 'auth-overlay';
  adminOverlay.id = 'adminOverlay';
  adminOverlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="adminTitle">
      <button class="auth-close" id="adminCloseBtn" type="button" aria-label="Fermer">✕</button>
      <div class="auth-title" id="adminTitle">Gestion des Gérants</div>
      <div class="auth-subtitle">Ajoutez ou retirez des adresses mail du rôle Gérant.</div>
      <div class="auth-hint" style="margin-bottom:18px;">Ces changements sont synchronisés et s'appliquent à tout le monde, sur n'importe quel appareil.</div>

      <form class="auth-form active" id="adminAddForm" novalidate>
        <div class="auth-field">
          <label for="adminAddEmail">Adresse mail à ajouter</label>
          <input type="email" id="adminAddEmail" autocomplete="off" required>
        </div>
        <div class="auth-error" id="adminAddError"></div>
        <button type="submit" class="auth-submit">Ajouter comme Gérant</button>
      </form>

      <div class="admin-list" id="adminList"></div>
    </div>
  `;

  const settingsOverlay = document.createElement('div');
  settingsOverlay.className = 'auth-overlay';
  settingsOverlay.id = 'settingsOverlay';
  settingsOverlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <button class="auth-close" id="settingsCloseBtn" type="button" aria-label="Fermer">✕</button>
      <div class="auth-title" id="settingsTitle">Mon profil</div>
      <div class="auth-subtitle">Modifiez votre pseudo.</div>

      <form class="auth-form active" id="settingsForm" novalidate>
        <div class="auth-field">
          <label for="settingsPseudo">Pseudo</label>
          <input type="text" id="settingsPseudo" autocomplete="nickname" required>
        </div>
        <div class="auth-error" id="settingsError"></div>
        <div class="auth-success" id="settingsSuccess"></div>
        <button type="submit" class="auth-submit">Enregistrer</button>
      </form>
    </div>
  `;

  const menuOverlay = document.createElement('div');
  menuOverlay.className = 'auth-overlay';
  menuOverlay.id = 'menuOverlay';
  menuOverlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
      <button class="auth-close" id="menuCloseBtn" type="button" aria-label="Fermer">✕</button>
      <div class="auth-title" id="menuTitle">Menu Gérant</div>
      <div class="auth-subtitle">Basculez le mode d'affichage du site.</div>
      <button type="button" class="auth-submit" id="modeToggleBtn">Passage en mode modification</button>
      <div id="menuPageExtra"></div>
    </div>
  `;

  document.body.appendChild(widget);
  document.body.appendChild(overlay);
  document.body.appendChild(adminOverlay);
  document.body.appendChild(settingsOverlay);
  document.body.appendChild(menuOverlay);

  const editModeToast = document.createElement('div');
  editModeToast.className = 'edit-mode-toast';
  editModeToast.id = 'editModeToast';
  editModeToast.textContent = "Mode modification actif : fermez-le depuis le bouton Menu pour changer de page.";
  document.body.appendChild(editModeToast);

  function q(id) { return document.getElementById(id); }

  const authBtn        = q('authBtn');
  const authUserMenu    = q('authUserMenu');
  const authManageBtn   = q('authManageBtn');
  const authLogoutBtn   = q('authLogoutBtn');
  const adminCloseBtn   = q('adminCloseBtn');
  const adminAddForm    = q('adminAddForm');
  const adminList       = q('adminList');
  const authSettingsBtn   = q('authSettingsBtn');
  const settingsCloseBtn  = q('settingsCloseBtn');
  const settingsForm      = q('settingsForm');
  const menuBtn        = q('menuBtn');
  const menuCloseBtn   = q('menuCloseBtn');
  const modeToggleBtn  = q('modeToggleBtn');
  const authCloseBtn    = q('authCloseBtn');
  const authTabLogin    = q('authTabLogin');
  const authTabRegister = q('authTabRegister');
  const authFormLogin    = q('authFormLogin');
  const authFormRegister = q('authFormRegister');
  const authFormReset        = q('authFormReset');
  const authFormResetConfirm = q('authFormResetConfirm');
  const authForgotBtn         = q('authForgotBtn');
  const authResetBackBtn      = q('authResetBackBtn');
  const authResetConfirmBackBtn = q('authResetConfirmBackBtn');
  const authTabsEl = overlay.querySelector('.auth-tabs');

  function showError(el, msg) { el.textContent = msg; el.classList.add('show'); }
  function clearErrors() {
    ['authLoginError', 'authRegError', 'authResetError', 'authResetConfirmError'].forEach(function (id) {
      q(id).classList.remove('show');
    });
    q('authResetSuccess').classList.remove('show');
  }

  const VIEW_SUBTITLES = {
    login: 'Connectez-vous pour accéder à votre espace.',
    register: 'Première connexion : créez votre compte sur cet appareil.',
    reset: 'Recevez un code de confirmation par mail pour changer votre mot de passe.',
    resetConfirm: 'Saisissez le code reçu par mail et votre nouveau mot de passe.'
  };

  function showView(view) {
    authTabsEl.style.display = (view === 'login' || view === 'register') ? 'flex' : 'none';
    authTabLogin.classList.toggle('active', view === 'login');
    authTabRegister.classList.toggle('active', view === 'register');
    authFormLogin.classList.toggle('active', view === 'login');
    authFormRegister.classList.toggle('active', view === 'register');
    authFormReset.classList.toggle('active', view === 'reset');
    authFormResetConfirm.classList.toggle('active', view === 'resetConfirm');
    q('authSubtitle').textContent = VIEW_SUBTITLES[view];
  }

  function openModal() {
    clearErrors();
    showView(getAccounts().length === 0 ? 'register' : 'login');
    overlay.classList.add('open');
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      const input = overlay.querySelector('.auth-form.active input');
      if (input) input.focus();
    }, 60);
  }

  function closeModal() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.classList.remove('open'); }, 250);
  }

  function updateWidget() {
    const session = getSession();
    if (session) {
      const role = session.role || getRole(session.email);
      const isAdmin = role === 'Gérant';
      q('authBtnIcon').textContent = isAdmin ? '👑' : '👤';
      q('authBtnText').textContent = session.pseudo;
      q('authBtnCaret').style.display = 'inline';
      q('authUserName').textContent = session.pseudo;
      q('authUserEmail').textContent = session.email;
      const roleEl = q('authUserRole');
      roleEl.textContent = role;
      roleEl.classList.toggle('show', isAdmin);
      authManageBtn.classList.toggle('show', isAdmin);
      menuBtn.classList.toggle('show', isAdmin);
    } else {
      q('authBtnIcon').textContent = '🔐';
      q('authBtnText').textContent = 'Connexion';
      q('authBtnCaret').style.display = 'none';
      authUserMenu.classList.remove('open');
      authManageBtn.classList.remove('show');
      menuBtn.classList.remove('show');
    }
  }

  function refreshSessionRole() {
    const session = getSession();
    if (!session) return;
    const newRole = getRole(session.email);
    if (newRole !== session.role) {
      session.role = newRole;
      setSession(session);
    }
    updateWidget();
    if (newRole === 'Gérant') upsertRemotePseudo(session.email, session.pseudo);
  }

  function renderAdminList() {
    const entries = ADMIN_EMAILS.map(function (e) { return { email: e, removable: false }; })
      .concat(remoteAdminEmailsCache.map(function (e) { return { email: e, removable: true }; }));

    if (entries.length === 0) {
      adminList.innerHTML = '<div class="auth-hint">Aucun Gérant pour le moment.</div>';
      return;
    }

    adminList.innerHTML = entries.map(function (entry) {
      const remotePseudo = getRemotePseudo(entry.email);
      const pseudo = remotePseudo ? escapeHtml(remotePseudo) : '(pas encore connecté avec ce compte)';
      const tag = entry.removable ? 'Ajouté via le panneau' : 'Intégré au site';
      const removeBtn = entry.removable
        ? '<button type="button" class="admin-remove-btn" data-email="' + escapeHtml(entry.email) + '">Retirer</button>'
        : '<button type="button" class="admin-remove-btn" disabled title="Modifiable uniquement dans le code du site">Retirer</button>';
      return '<div class="admin-list-item">'
        + '<div class="admin-list-info">'
        +   '<div class="admin-list-pseudo">' + pseudo + '</div>'
        +   '<div class="admin-list-email">' + escapeHtml(entry.email) + '</div>'
        +   '<div class="admin-list-tag">' + tag + '</div>'
        + '</div>'
        + removeBtn
        + '</div>';
    }).join('');
  }

  function openAdminModal() {
    q('adminAddError').classList.remove('show');
    adminAddForm.reset();
    adminList.innerHTML = '<div class="auth-hint">Chargement de la liste…</div>';
    adminOverlay.classList.add('open');
    requestAnimationFrame(function () { adminOverlay.classList.add('show'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { q('adminAddEmail').focus(); }, 60);
    // Toujours aller chercher les données les plus fraîches à l'ouverture
    // du panneau (ne pas se contenter du cache figé au chargement de la
    // page), sinon un onglet resté ouvert affiche des infos périmées.
    Promise.all([fetchRemoteAdminEmails(), fetchRemotePseudos()]).then(renderAdminList);
  }

  function closeAdminModal() {
    adminOverlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { adminOverlay.classList.remove('open'); }, 250);
  }

  function openSettingsModal() {
    const session = getSession();
    q('settingsError').classList.remove('show');
    q('settingsSuccess').classList.remove('show');
    q('settingsPseudo').value = session ? session.pseudo : '';
    settingsOverlay.classList.add('open');
    requestAnimationFrame(function () { settingsOverlay.classList.add('show'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { q('settingsPseudo').focus(); }, 60);
  }

  function closeSettingsModal() {
    settingsOverlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { settingsOverlay.classList.remove('open'); }, 250);
  }

  function updateModeToggleBtn() {
    modeToggleBtn.textContent = isEditMode() ? 'Passage en mode visionnage' : 'Passage en mode modification';
  }

  function openMenuModal() {
    updateModeToggleBtn();
    menuOverlay.classList.add('open');
    requestAnimationFrame(function () { menuOverlay.classList.add('show'); });
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('327th-menu-open'));
  }

  function closeMenuModal() {
    menuOverlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { menuOverlay.classList.remove('open'); }, 250);
    document.dispatchEvent(new CustomEvent('327th-menu-close'));
  }

  authBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (getSession()) {
      authUserMenu.classList.toggle('open');
    } else {
      openModal();
    }
  });

  document.addEventListener('click', function (e) {
    if (!widget.contains(e.target)) authUserMenu.classList.remove('open');
  });

  authLogoutBtn.addEventListener('click', function () {
    clearSession();
    updateWidget();
  });

  authManageBtn.addEventListener('click', function () {
    authUserMenu.classList.remove('open');
    openAdminModal();
  });

  authSettingsBtn.addEventListener('click', function () {
    authUserMenu.classList.remove('open');
    openSettingsModal();
  });

  authCloseBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  adminCloseBtn.addEventListener('click', closeAdminModal);
  adminOverlay.addEventListener('click', function (e) {
    if (e.target === adminOverlay) closeAdminModal();
  });
  settingsCloseBtn.addEventListener('click', closeSettingsModal);
  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) closeSettingsModal();
  });

  menuBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    authUserMenu.classList.remove('open');
    openMenuModal();
  });
  menuCloseBtn.addEventListener('click', closeMenuModal);
  menuOverlay.addEventListener('click', function (e) {
    if (e.target === menuOverlay) closeMenuModal();
  });
  modeToggleBtn.addEventListener('click', function () {
    setEditMode(!isEditMode());
    updateModeToggleBtn();
  });

  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (adminOverlay.classList.contains('open')) return closeAdminModal();
    if (settingsOverlay.classList.contains('open')) return closeSettingsModal();
    if (menuOverlay.classList.contains('open')) return closeMenuModal();
    if (overlay.classList.contains('open')) return closeModal();
  });

  settingsForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('settingsError');
    const successEl = q('settingsSuccess');
    errorEl.classList.remove('show');
    successEl.classList.remove('show');

    const session = getSession();
    if (!session) return;

    const newPseudo = q('settingsPseudo').value.trim();
    if (newPseudo.length < 3) return showError(errorEl, 'Le pseudo doit contenir au moins 3 caractères.');

    const accounts = getAccounts();
    const idx = accounts.findIndex(function (a) { return a.email === session.email; });
    if (idx === -1) return showError(errorEl, 'Compte introuvable.');

    if (newPseudo.toLowerCase() !== accounts[idx].pseudo.toLowerCase()) {
      const clash = accounts.some(function (a, i) { return i !== idx && a.pseudo.toLowerCase() === newPseudo.toLowerCase(); });
      if (clash) return showError(errorEl, 'Ce pseudo est déjà utilisé par un autre compte sur cet appareil.');
    }

    accounts[idx].pseudo = newPseudo;
    saveAccounts(accounts);
    session.pseudo = newPseudo;
    setSession(session);
    updateWidget();

    successEl.textContent = 'Pseudo mis à jour.';
    successEl.classList.add('show');
    setTimeout(closeSettingsModal, 700);

    if (getRole(session.email) === 'Gérant') upsertRemotePseudo(session.email, newPseudo);
  });

  adminAddForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('adminAddError');
    errorEl.classList.remove('show');

    const email = q('adminAddEmail').value.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError(errorEl, 'Adresse mail invalide.');

    await ensureAdminEmailsLoaded();
    if (getAllAdminEmails().indexOf(email) !== -1) return showError(errorEl, 'Cette adresse a déjà le rôle Gérant.');

    const submitBtn = adminAddForm.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ajout en cours...';

    const updated = remoteAdminEmailsCache.concat([email]);
    try {
      await saveRemoteAdminEmails(updated);
      adminAddForm.reset();
      renderAdminList();
      refreshSessionRole();
      const knownAccount = findAccount(email);
      if (knownAccount) upsertRemotePseudo(knownAccount.email, knownAccount.pseudo).then(renderAdminList);
    } catch (err) {
      showError(errorEl, (err && err.message) || 'Échec de la sauvegarde. Réessayez.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ajouter comme Gérant';
    }
  });

  adminList.addEventListener('click', async function (e) {
    const btn = e.target.closest('.admin-remove-btn');
    if (!btn || btn.disabled) return;
    const email = btn.getAttribute('data-email');
    btn.disabled = true;
    btn.textContent = '...';

    const updated = remoteAdminEmailsCache.filter(function (e2) { return e2.toLowerCase() !== email.toLowerCase(); });
    try {
      await saveRemoteAdminEmails(updated);
      renderAdminList();
      refreshSessionRole();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Retirer';
    }
  });

  authTabLogin.addEventListener('click', function () { clearErrors(); showView('login'); });
  authTabRegister.addEventListener('click', function () { clearErrors(); showView('register'); });

  authForgotBtn.addEventListener('click', function () {
    clearErrors();
    const idVal = q('authLoginId').value.trim();
    q('authResetId').value = idVal;
    showView('reset');
  });
  authResetBackBtn.addEventListener('click', function () { clearErrors(); showView('login'); });
  authResetConfirmBackBtn.addEventListener('click', function () { clearErrors(); showView('login'); });

  authFormRegister.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('authRegError');
    errorEl.classList.remove('show');

    const email  = q('authRegEmail').value.trim();
    const pseudo = q('authRegPseudo').value.trim();
    const pwd    = q('authRegPwd').value;

    if (!email || !pseudo || !pwd) return showError(errorEl, 'Merci de remplir tous les champs.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError(errorEl, 'Adresse mail invalide.');
    if (pseudo.length < 3) return showError(errorEl, 'Le pseudo doit contenir au moins 3 caractères.');
    if (pwd.length < 6) return showError(errorEl, 'Le mot de passe doit contenir au moins 6 caractères.');
    if (findAccount(email) || findAccount(pseudo)) return showError(errorEl, 'Ce pseudo ou cet email est déjà utilisé sur cet appareil.');

    const passHash = await hashPassword(pwd);
    await ensureAdminEmailsLoaded();
    const accounts = getAccounts();
    accounts.push({ email: email, pseudo: pseudo, passHash: passHash });
    saveAccounts(accounts);
    const role = getRole(email);
    setSession({ email: email, pseudo: pseudo, role: role });
    updateWidget();
    closeModal();
    authFormRegister.reset();
    if (role === 'Gérant') upsertRemotePseudo(email, pseudo);
  });

  authFormLogin.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('authLoginError');
    errorEl.classList.remove('show');

    const idVal = q('authLoginId').value.trim();
    const pwd   = q('authLoginPwd').value;
    if (!idVal || !pwd) return showError(errorEl, 'Merci de remplir tous les champs.');

    const account = findAccount(idVal);
    if (!account) return showError(errorEl, "Aucun compte trouvé sur cet appareil. Utilisez l'onglet « Première connexion ».");

    const passHash = await hashPassword(pwd);
    if (passHash !== account.passHash) return showError(errorEl, 'Mot de passe incorrect.');

    await ensureAdminEmailsLoaded();
    const loginRole = getRole(account.email);
    setSession({ email: account.email, pseudo: account.pseudo, role: loginRole });
    updateWidget();
    closeModal();
    authFormLogin.reset();
    if (loginRole === 'Gérant') upsertRemotePseudo(account.email, account.pseudo);
  });

  authFormReset.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('authResetError');
    const successEl = q('authResetSuccess');
    errorEl.classList.remove('show');
    successEl.classList.remove('show');

    const idVal = q('authResetId').value.trim();
    if (!idVal) return showError(errorEl, 'Merci de renseigner votre pseudo ou votre email.');

    const account = findAccount(idVal);
    if (!account) return showError(errorEl, 'Aucun compte trouvé sur cet appareil avec cet identifiant.');

    const code = genCode();
    localStorage.setItem(KEY_RESET, JSON.stringify({
      email: account.email,
      pseudo: account.pseudo,
      code: code,
      expiresAt: Date.now() + 10 * 60 * 1000
    }));

    const submitBtn = authFormReset.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
      await sendResetEmail(account, code);
      successEl.textContent = 'Code envoyé à ' + account.email + '. Vérifiez votre boîte mail (et les spams).';
      successEl.classList.add('show');
      setTimeout(function () { showView('resetConfirm'); }, 900);
    } catch (err) {
      localStorage.removeItem(KEY_RESET);
      showError(errorEl, (err && err.message) || "Échec de l'envoi du mail. Réessayez plus tard.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer le code';
    }
  });

  authFormResetConfirm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = q('authResetConfirmError');
    errorEl.classList.remove('show');

    const codeVal = q('authResetCode').value.trim();
    const newPwd  = q('authResetNewPwd').value;

    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(KEY_RESET)); } catch (e) { pending = null; }

    if (!pending) return showError(errorEl, 'Aucune demande de réinitialisation en cours. Recommencez.');
    if (Date.now() > pending.expiresAt) {
      localStorage.removeItem(KEY_RESET);
      return showError(errorEl, 'Ce code a expiré. Recommencez la procédure.');
    }
    if (!codeVal || codeVal !== pending.code) return showError(errorEl, 'Code incorrect.');
    if (!newPwd || newPwd.length < 6) return showError(errorEl, 'Le mot de passe doit contenir au moins 6 caractères.');

    const accounts = getAccounts();
    const idx = accounts.findIndex(function (a) { return a.email === pending.email; });
    if (idx === -1) return showError(errorEl, 'Compte introuvable.');

    accounts[idx].passHash = await hashPassword(newPwd);
    saveAccounts(accounts);
    localStorage.removeItem(KEY_RESET);

    await ensureAdminEmailsLoaded();
    const resetRole = getRole(accounts[idx].email);
    setSession({ email: accounts[idx].email, pseudo: accounts[idx].pseudo, role: resetRole });
    updateWidget();
    closeModal();
    authFormResetConfirm.reset();
    authFormReset.reset();
    if (resetRole === 'Gérant') upsertRemotePseudo(accounts[idx].email, accounts[idx].pseudo);
  });

  let editModeToastTimer = null;
  function showEditModeToast() {
    editModeToast.classList.add('show');
    clearTimeout(editModeToastTimer);
    editModeToastTimer = setTimeout(function () { editModeToast.classList.remove('show'); }, 2600);
  }

  // En mode modification, on bloque uniquement la navigation vers une
  // AUTRE page du site (liens internes) — pas les liens externes
  // (Google Docs/Forms/Sites...), pas les ancres sur la page en cours,
  // et on peut toujours changer d'onglet/fenêtre du navigateur.
  document.addEventListener('click', function (e) {
    if (!isEditMode()) return;
    const link = e.target.closest('a[href]');
    if (!link) return;

    let url;
    try { url = new URL(link.href, location.href); } catch (err) { return; }

    if (url.protocol !== location.protocol) return;
    if (url.hostname !== location.hostname) return;
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    e.stopPropagation();
    showEditModeToast();
  }, true);

  document.body.classList.toggle('edit-mode-active', isEditMode());
  updateWidget();
  ensureAdminEmailsLoaded().then(refreshSessionRole);
})();
