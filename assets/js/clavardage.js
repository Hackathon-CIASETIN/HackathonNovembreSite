/* ==========================================================================
   AsetinBot 2000 — widget de clavardage du Buildathon ASETIN

   Le gag : le visiteur croit parler à un robot. Le robot déraille, « transfère
   à un agent humain », et l'agent humain, c'est Félix, qui reçoit le message
   pour vrai et débarque dans la conversation quand ça lui tente.

   Le widget s'injecte tout seul : il suffit d'inclure ce fichier et
   assets/css/clavardage.css dans la page.

   ---------------------------------------------------------------------------
   CONFIGURATION — tout se passe dans l'objet CONFIG ci-dessous.
   ---------------------------------------------------------------------------

   MODE 'formsubmit'  (le plus simple, aucun compte à créer)
     1. Allez sur https://formsubmit.co et entrez votre courriel pour obtenir
        une chaîne aléatoire (évite d'exposer votre adresse dans le code).
     2. Collez-la dans CONFIG.cle.
     3. Le tout premier envoi déclenche un courriel de confirmation à activer.
     Messages à sens unique : ils arrivent dans votre boîte, vous répondez
     par courriel.

   MODE 'web3forms'   (équivalent, autre fournisseur)
     1. https://web3forms.com → entrez votre courriel → access key.
     2. Collez la clé dans CONFIG.cle.

   MODE 'discord'     (les messages tombent dans un salon Discord)
     1. Paramètres du salon → Intégrations → Webhooks → Nouveau webhook.
     2. Copiez l'URL dans CONFIG.cle.
     ATTENTION : une URL de webhook dans du code client est publique. N'importe
     qui peut la lire et y poster. À réserver à un salon jetable, et à révoquer
     après l'événement.

   MODE 'tawk'        (vrai clavardage bidirectionnel, app mobile)
     1. Créez une propriété sur https://tawk.to et récupérez votre lien de
        widget (de la forme .../<propertyId>/<widgetId>).
     2. Collez propertyId et widgetId dans CONFIG.tawk.
     3. Ce fichier charge Tawk, masque leur bulle, et branche le bouton
        « Parler à un agent » sur leur fenêtre. Vous répondez en direct depuis
        votre téléphone.

   MODE 'demo'        (par défaut) : rien n'est envoyé nulle part. Le robot
     répond quand même, pour que la page soit présentable avant la config.
   ========================================================================== */

(function () {
  'use strict';

  var CONFIG = {
    /* 'demo' | 'formsubmit' | 'web3forms' | 'discord' | 'tawk' */
    mode: 'demo',

    /* chaîne FormSubmit, access key Web3Forms, ou URL de webhook Discord */
    cle: '',

    /* uniquement pour le mode 'tawk' */
    tawk: { propertyId: '', widgetId: 'default' },

    /* chemin de la mascotte, relatif à la page */
    avatar: 'assets/img/hibou-construction.svg',

    /* ouvrir le widget tout seul après N ms (0 = jamais) */
    ouvertureAuto: 0
  };

  /* ----------------------------------------------------------------------
     Répliques du « robot ». Elles s'enchaînent dans l'ordre, puis la
     dernière se répète.
     ---------------------------------------------------------------------- */
  var REPLIQUES = [
    'Un instant, je consulte ma base de connaissances…',
    'Je n’ai rien trouvé. Je transfère votre demande à un agent humain.',
    'Tous nos agents sont présentement occupés. Vous êtes en position 1 dans la file.',
    'Vous êtes toujours en position 1.',
    'L’agent a été notifié sur son téléphone. Il a vu la notification.',
    'Il n’a pas encore ouvert le message.',
    'Il va l’ouvrir. Éventuellement.'
  ];

  var ACCUEIL = 'Bonjour&nbsp;! Je suis <b>AsetinBot&nbsp;2000</b>, votre assistant virtuel. ' +
    'Un problème pour naviguer sur le site&nbsp;? Écrivez-moi, je suis là pour ça.';

  /* ----------------------------------------------------------------------
     Petits utilitaires
     ---------------------------------------------------------------------- */

  function el(tag, classe, html) {
    var n = document.createElement(tag);
    if (classe) { n.className = classe; }
    if (html !== undefined) { n.innerHTML = html; }
    return n;
  }

  function heure() {
    return new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  }

  function echapper(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------------
     Construction du widget
     ---------------------------------------------------------------------- */

  var widget, fil, zoneTexte, btnEnvoyer, etat, alerte;
  var indexReplique = 0;
  var envoiEnCours = false;

  function construire() {
    widget = el('div', 'cv-widget');
    widget.id = 'cv-widget';
    widget.setAttribute('data-ouvert', 'false');

    widget.innerHTML =
      '<div class="cv-cadre">' +
        '<button type="button" class="cv-barre" id="cv-barre" aria-expanded="false" aria-controls="cv-corps">' +
          '<span class="cv-titre"><span class="cv-pastille"></span>AsetinBot 2000</span>' +
          '<span class="cv-boutons">' +
            '<span class="cv-alerte" id="cv-alerte" data-actif="false">1</span>' +
            '<i aria-hidden="true">_</i><i aria-hidden="true">×</i>' +
          '</span>' +
        '</button>' +
        '<div class="cv-corps" id="cv-corps">' +
          '<div class="cv-fil" id="cv-fil" role="log" aria-live="polite" aria-label="Conversation"></div>' +
          '<form class="cv-saisie" id="cv-form">' +
            '<label class="cv-etiquette" for="cv-texte" hidden>Votre message</label>' +
            '<textarea id="cv-texte" placeholder="Votre message…" maxlength="1200" required></textarea>' +
            '<div class="cv-rangee">' +
              '<button type="submit" class="cv-envoyer" id="cv-envoyer">Envoyer</button>' +
            '</div>' +
          '</form>' +
          '<p class="cv-etat" id="cv-etat"></p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);

    fil = widget.querySelector('#cv-fil');
    zoneTexte = widget.querySelector('#cv-texte');
    btnEnvoyer = widget.querySelector('#cv-envoyer');
    etat = widget.querySelector('#cv-etat');
    alerte = widget.querySelector('#cv-alerte');

    widget.querySelector('#cv-barre').addEventListener('click', basculer);
    widget.querySelector('#cv-form').addEventListener('submit', soumettre);

    zoneTexte.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        soumettre(e);
      }
    });

    ajouterBot(ACCUEIL);
    marquerNonLu(true);
  }

  function basculer() {
    var ouvert = widget.getAttribute('data-ouvert') === 'true';
    widget.setAttribute('data-ouvert', ouvert ? 'false' : 'true');
    widget.querySelector('#cv-barre').setAttribute('aria-expanded', ouvert ? 'false' : 'true');
    if (!ouvert) {
      marquerNonLu(false);
      zoneTexte.focus();
      defiler();
    }
  }

  function marquerNonLu(actif) {
    if (alerte) { alerte.setAttribute('data-actif', actif ? 'true' : 'false'); }
  }

  function defiler() {
    if (fil) { fil.scrollTop = fil.scrollHeight; }
  }

  function ajouterBot(html) {
    var msg = el('div', 'cv-msg');
    msg.innerHTML =
      '<img src="' + CONFIG.avatar + '" alt="">' +
      '<span class="cv-bulle">' + html +
        '<span class="cv-horodatage">AsetinBot 2000 · ' + heure() + '</span>' +
      '</span>';
    fil.appendChild(msg);
    defiler();
    if (widget.getAttribute('data-ouvert') !== 'true') { marquerNonLu(true); }
  }

  function ajouterMoi(texte) {
    var msg = el('div', 'cv-msg cv-msg--moi');
    msg.innerHTML =
      '<span class="cv-bulle">' + echapper(texte).replace(/\n/g, '<br>') +
        '<span class="cv-horodatage">Vous · ' + heure() + '</span>' +
      '</span>';
    fil.appendChild(msg);
    defiler();
  }

  function ajouterSysteme(texte) {
    fil.appendChild(el('div', 'cv-msg cv-msg--systeme', '— ' + texte + ' —'));
    defiler();
  }

  function montrerEcriture() {
    var msg = el('div', 'cv-msg');
    msg.id = 'cv-ecriture';
    msg.innerHTML =
      '<img src="' + CONFIG.avatar + '" alt="">' +
      '<span class="cv-bulle cv-points"><span></span><span></span><span></span></span>';
    fil.appendChild(msg);
    defiler();
  }

  function cacherEcriture() {
    var n = document.getElementById('cv-ecriture');
    if (n && n.parentNode) { n.parentNode.removeChild(n); }
  }

  function repondreRobot() {
    montrerEcriture();
    var delai = 900 + Math.random() * 1100;
    window.setTimeout(function () {
      cacherEcriture();
      ajouterBot(REPLIQUES[Math.min(indexReplique, REPLIQUES.length - 1)]);
      indexReplique += 1;
    }, delai);
  }

  /* ----------------------------------------------------------------------
     Envoi réel du message
     ---------------------------------------------------------------------- */

  function charge(texte) {
    var contexte = {
      message: texte,
      page: document.title,
      url: window.location.href,
      date: new Date().toLocaleString('fr-CA')
    };

    if (CONFIG.mode === 'discord') {
      return {
        url: CONFIG.cle,
        corps: {
          content: '**AsetinBot 2000** — nouveau message\n' +
            '> ' + texte.replace(/\n/g, '\n> ') + '\n' +
            '_' + contexte.page + ' · ' + contexte.date + '_'
        }
      };
    }

    if (CONFIG.mode === 'web3forms') {
      return {
        url: 'https://api.web3forms.com/submit',
        corps: {
          access_key: CONFIG.cle,
          subject: 'AsetinBot 2000 — message du site Buildathon',
          from_name: 'AsetinBot 2000',
          message: texte,
          page: contexte.page,
          url: contexte.url
        }
      };
    }

    /* formsubmit */
    return {
      url: 'https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.cle),
      corps: {
        _subject: 'AsetinBot 2000 — message du site Buildathon',
        message: texte,
        page: contexte.page,
        url: contexte.url,
        date: contexte.date
      }
    };
  }

  function envoyer(texte) {
    if (CONFIG.mode === 'demo' || !CONFIG.cle) {
      return Promise.resolve({ demo: true });
    }

    var req = charge(texte);

    return fetch(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req.corps)
    }).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r;
    });
  }

  function soumettre(e) {
    e.preventDefault();
    if (envoiEnCours) { return; }

    var texte = zoneTexte.value.trim();
    if (!texte) { return; }

    /* En mode tawk, c'est leur fenêtre qui prend le relais. */
    if (CONFIG.mode === 'tawk' && window.Tawk_API && window.Tawk_API.maximize) {
      window.Tawk_API.maximize();
      return;
    }

    envoiEnCours = true;
    btnEnvoyer.disabled = true;
    etat.className = 'cv-etat';
    etat.textContent = 'Transmission…';

    ajouterMoi(texte);
    zoneTexte.value = '';

    envoyer(texte).then(function (res) {
      etat.innerHTML = res && res.demo
        ? 'Mode démonstration — <b>rien n’a été envoyé</b>. Voir CONFIG dans clavardage.js.'
        : '<b>Message transmis.</b> Un humain le lira pour vrai.';
      repondreRobot();
    }).catch(function (err) {
      etat.className = 'cv-etat cv-echec';
      etat.innerHTML = '<b>Échec de l’envoi.</b> ' + echapper(err.message);
      ajouterSysteme('la transmission a échoué');
    }).then(function () {
      envoiEnCours = false;
      btnEnvoyer.disabled = false;
    });
  }

  /* ----------------------------------------------------------------------
     Mode Tawk.to — vrai clavardage, bulle d'origine masquée
     ---------------------------------------------------------------------- */

  function chargerTawk() {
    if (!CONFIG.tawk.propertyId) { return; }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = function () {
      if (window.Tawk_API.hideWidget) { window.Tawk_API.hideWidget(); }
    };

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://embed.tawk.to/' + CONFIG.tawk.propertyId + '/' + CONFIG.tawk.widgetId;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------------------------
     Démarrage
     ---------------------------------------------------------------------- */

  function demarrer() {
    construire();
    if (CONFIG.mode === 'tawk') { chargerTawk(); }
    if (CONFIG.ouvertureAuto > 0) {
      window.setTimeout(function () {
        if (widget.getAttribute('data-ouvert') === 'false') { basculer(); }
      }, CONFIG.ouvertureAuto);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
}());
