/* ==========================================================================
   Buildathon ASETIN — page «&nbsp;Santé&nbsp;» (IGEA)
   1. Le fax s'imprime feuillet par feuillet.
   2. Fausse recherche d'appareils de télécopie, puis vraie boîte d'impression.
   3. Tonalité de télécopieur synthétisée (Web Audio), sur clic seulement.
   ========================================================================== */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* JS actif : on autorise l'animation. Sans JS, tout reste visible. */
  html.className += ' js';

  /* ----------------------------------------------------------------------
     1. Impression progressive des feuillets
     ---------------------------------------------------------------------- */
  var feuillets = Array.prototype.slice.call(document.querySelectorAll('.a-imprimer'));

  function imprimerFeuillets(apres) {
    if (reduit) {
      feuillets.forEach(function (f) { f.classList.add('imprime'); });
      if (apres) { apres(); }
      return;
    }

    var i = 0;
    (function suivant() {
      if (i >= feuillets.length) {
        if (apres) { window.setTimeout(apres, 400); }
        return;
      }
      feuillets[i].classList.add('imprime');
      i += 1;
      window.setTimeout(suivant, 700);
    }());
  }

  /* ----------------------------------------------------------------------
     2. Tonalité de télécopieur (synthétisée, aucun fichier audio)
     ---------------------------------------------------------------------- */
  var contexteAudio = null;

  function jouerTonalite() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { return; }

    try {
      if (!contexteAudio) { contexteAudio = new Ctx(); }
      if (contexteAudio.state === 'suspended') { contexteAudio.resume(); }
    } catch (e) {
      return;
    }

    var ctx = contexteAudio;
    var t0 = ctx.currentTime + 0.05;
    var maitre = ctx.createGain();
    maitre.gain.value = 0.07;
    maitre.connect(ctx.destination);

    /* bips d'appel (CNG, ~1100 Hz) */
    [0, 1.1].forEach(function (decalage) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1100;
      g.gain.setValueAtTime(0, t0 + decalage);
      g.gain.linearRampToValueAtTime(1, t0 + decalage + 0.02);
      g.gain.setValueAtTime(1, t0 + decalage + 0.48);
      g.gain.linearRampToValueAtTime(0, t0 + decalage + 0.5);
      osc.connect(g).connect(maitre);
      osc.start(t0 + decalage);
      osc.stop(t0 + decalage + 0.55);
    });

    /* poignée de main : deux porteuses qui se chevauchent */
    var debutHs = t0 + 2.2;
    [1650, 1850].forEach(function (freq, idx) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, debutHs);
      osc.frequency.linearRampToValueAtTime(freq + (idx ? -420 : 380), debutHs + 1.1);
      g.gain.setValueAtTime(0.25, debutHs);
      g.gain.setValueAtTime(0.25, debutHs + 1.05);
      g.gain.linearRampToValueAtTime(0, debutHs + 1.15);
      osc.connect(g).connect(maitre);
      osc.start(debutHs);
      osc.stop(debutHs + 1.2);
    });

    /* le grésillement de données */
    var duree = 1.6;
    var tampon = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duree), ctx.sampleRate);
    var donnees = tampon.getChannelData(0);
    for (var i = 0; i < donnees.length; i += 1) {
      donnees[i] = (Math.random() * 2 - 1) * 0.8;
    }
    var source = ctx.createBufferSource();
    var filtre = ctx.createBiquadFilter();
    var gBruit = ctx.createGain();
    source.buffer = tampon;
    filtre.type = 'bandpass';
    filtre.frequency.value = 1900;
    filtre.Q.value = 2.5;
    gBruit.gain.setValueAtTime(0.45, debutHs + 1.1);
    gBruit.gain.setValueAtTime(0.45, debutHs + 1.1 + duree - 0.15);
    gBruit.gain.linearRampToValueAtTime(0, debutHs + 1.1 + duree);
    source.connect(filtre).connect(gBruit).connect(maitre);
    source.start(debutHs + 1.1);
  }

  /* ----------------------------------------------------------------------
     3. Fausse recherche d'appareils → vraie boîte d'impression

     NOTE : un navigateur ne peut pas (et ne doit pas pouvoir) scruter le
     réseau local à la recherche d'imprimantes. On met donc en scène la
     recherche, puis on appelle window.print(), qui ouvre la vraie boîte
     de dialogue du système avec les vraies imprimantes de la personne.
     ---------------------------------------------------------------------- */
  var voile = document.getElementById('voile');
  var message = document.getElementById('message-dialogue');
  var jauge = document.getElementById('jauge');
  var barre = jauge ? jauge.querySelector('span') : null;
  var btnOk = document.getElementById('btn-ok');
  var btnAnnuler = document.getElementById('btn-annuler');
  var btnImprimer = document.getElementById('btn-imprimer');
  var btnSon = document.getElementById('btn-son');
  var minuteries = [];

  function nettoyer() {
    minuteries.forEach(window.clearTimeout);
    minuteries = [];
  }

  function fermerDialogue() {
    nettoyer();
    if (voile) { voile.hidden = true; }
    if (btnImprimer) { btnImprimer.focus(); }
  }

  function majJauge(pct) {
    if (barre) { barre.style.width = pct + '%'; }
    if (jauge) { jauge.setAttribute('aria-valuenow', String(pct)); }
  }

  function lancerRecherche() {
    if (!voile) { return; }

    nettoyer();
    voile.hidden = false;
    btnOk.disabled = true;
    btnOk.textContent = 'Imprimer';
    message.textContent = "Recherche d'appareils de télécopie sur votre réseau local…";
    majJauge(0);

    var etapes = [
      [350,  18, 'Analyse du sous-réseau 192.168.0.0/24…'],
      [900,  41, 'Interrogation du port 9100…'],
      [1500, 63, 'Aucun télécopieur détecté. Nouvelle tentative…'],
      [2100, 86, 'Recherche d’un modem compatible V.34…'],
      [2700, 100, null]
    ];

    etapes.forEach(function (etape) {
      minuteries.push(window.setTimeout(function () {
        majJauge(etape[1]);
        if (etape[2]) { message.textContent = etape[2]; }
      }, etape[0]));
    });

    minuteries.push(window.setTimeout(function () {
      message.innerHTML = '<strong>0 appareil de télécopie trouvé.</strong><br>' +
        'Souhaitez-vous imprimer ce document sur une imprimante ordinaire à la place&nbsp;?';
      btnOk.disabled = false;
      btnOk.focus();
    }, 3100));
  }

  if (btnOk) {
    btnOk.addEventListener('click', function () {
      fermerDialogue();
      window.setTimeout(function () { window.print(); }, 120);
    });
  }

  if (btnAnnuler) { btnAnnuler.addEventListener('click', fermerDialogue); }

  if (voile) {
    voile.addEventListener('click', function (e) {
      if (e.target === voile) { fermerDialogue(); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && voile && !voile.hidden) { fermerDialogue(); }
  });

  if (btnImprimer) { btnImprimer.addEventListener('click', lancerRecherche); }
  if (btnSon) { btnSon.addEventListener('click', jouerTonalite); }

  /* ----------------------------------------------------------------------
     Enchaînement au chargement
     ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    imprimerFeuillets(function () {
      /* la proposition d'impression arrive une fois le fax « sorti » */
      lancerRecherche();
    });
  });
}());
