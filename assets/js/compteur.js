/* ==========================================================================
   Compteur de visiteurs — Buildathon ASETIN

   Vrai compteur partagé entre tous les visiteurs, via Abacus
   (https://abacus.jasoncameron.dev) : service gratuit, aucun compte requis.
   GET /hit/<espace>/<cle> incrémente et renvoie {"value": N}.

   Si le service est injoignable (hors ligne, bloqueur de pub, quota), on
   retombe sur un compte local par navigateur. La page ne casse jamais.

   Pour remettre le compteur à zéro avant l'événement, changez simplement CLE
   (ex. 'accueil-v2') : un nouveau compteur est créé au premier visiteur.
   ========================================================================== */

(function () {
  'use strict';

  var ESPACE = 'buildathon-asetin';   /* 3-64 car. : A-Z a-z 0-9 _ - . */
  var CLE    = 'accueil';
  var BASE   = 13370;                 /* décalage cosmétique : on n'ouvre pas à 1 */
  var CHIFFRES = 6;

  function dessiner(n, reel) {
    var boite = document.getElementById('compteur');
    var rang = document.getElementById('rang');
    if (!boite) { return; }

    var texte = String(n);
    if (texte.length < CHIFFRES) {
      texte = new Array(CHIFFRES - texte.length + 1).join('0') + texte;
    }

    boite.textContent = '';
    texte.split('').forEach(function (c) {
      var cellule = document.createElement('i');
      cellule.textContent = c;
      boite.appendChild(cellule);
    });

    boite.setAttribute('aria-label', 'Compteur de visiteurs : ' + n);
    if (rang) { rang.textContent = n.toLocaleString('fr-CA'); }

    var note = document.getElementById('note-compteur');
    if (note && !reel) {
      note.textContent = '(compte local — le compteur partagé est injoignable)';
    }
  }

  function compteLocal() {
    var n = BASE + 1;
    try {
      var stocke = window.localStorage.getItem('bd_visites');
      n = stocke ? parseInt(stocke, 10) : BASE;
      if (isNaN(n)) { n = BASE; }
      n += 1;
      window.localStorage.setItem('bd_visites', String(n));
    } catch (e) {
      /* navigation privée ou stockage bloqué : on affiche la base */
    }
    return n;
  }

  function demarrer() {
    if (!document.getElementById('compteur')) { return; }

    /* valeur provisoire tout de suite, pour éviter une case vide */
    dessiner(BASE, true);

    var url = 'https://abacus.jasoncameron.dev/hit/' +
      encodeURIComponent(ESPACE) + '/' + encodeURIComponent(CLE);

    var minuterie = window.setTimeout(function () {
      dessiner(compteLocal(), false);
    }, 4000);

    fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        window.clearTimeout(minuterie);
        var valeur = (typeof data.value === 'number') ? data.value : 0;
        dessiner(BASE + valeur, true);
      })
      .catch(function () {
        window.clearTimeout(minuterie);
        dessiner(compteLocal(), false);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
}());
