/* ==========================================================================
   Brilleau — comportements volontairement cassés

   1. Connexion obligatoire à chaque visite, même si la plateforme « se
      souvient » de vous.
   2. Déconnexion automatique après un court moment d'inactivité.
   3. Presque tous les liens du menu échouent : chargement sans fin, erreur,
      ou ouverture de la mauvaise section.
   4. Une seule page fonctionne : le bulletin de la migration.

   Le délai d'inactivité est volontairement court (démonstration). Pour le
   rendre moins agressif, augmentez INACTIVITE_MS ci-dessous.
   ========================================================================== */
(function () {
	'use strict';

	var INACTIVITE_MS = 45000;   /* déconnexion après 45 s sans interaction */
	var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var ecran = document.getElementById('ecran-connexion');
	var app = document.getElementById('app');
	var btnConnexion = document.getElementById('btn-connexion');
	var voile = document.getElementById('voile-session');
	var btnReconnexion = document.getElementById('btn-reconnexion');
	var compteurSessions = document.getElementById('compteur-sessions');
	var menu = document.getElementById('menu-lat');

	var minuterieInactivite = null;
	var minuterieFausse = null;

	/* ----------------------------------------------------------------------
	   Compte des connexions dans la session du navigateur, pour le gag
	   ---------------------------------------------------------------------- */

	function lireConnexions() {
		var n = 0;
		try {
			n = parseInt(window.sessionStorage.getItem('brilleau_connexions'), 10) || 0;
		} catch (e) { /* stockage bloqué : on reste à 0 */ }
		return n;
	}

	function noterConnexion() {
		var n = lireConnexions() + 1;
		try {
			window.sessionStorage.setItem('brilleau_connexions', String(n));
		} catch (e) { /* tant pis */ }
		return n;
	}

	function afficherCompteur() {
		if (!compteurSessions) { return; }
		var n = lireConnexions();
		compteurSessions.textContent = n > 0
			? 'Vous vous êtes connecté ' + n + ' fois depuis l’ouverture de cet onglet.'
			: '';
	}

	/* ----------------------------------------------------------------------
	   Connexion / déconnexion
	   ---------------------------------------------------------------------- */

	function ouvrirSession() {
		noterConnexion();
		ecran.hidden = true;
		app.hidden = false;
		voile.hidden = true;
		montrer('bulletin');
		armerInactivite();
	}

	function fermerSession(avecModale) {
		window.clearTimeout(minuterieInactivite);
		window.clearTimeout(minuterieFausse);
		app.hidden = true;
		afficherCompteur();
		if (avecModale) {
			voile.hidden = false;
		} else {
			ecran.hidden = false;
		}
	}

	function armerInactivite() {
		window.clearTimeout(minuterieInactivite);
		minuterieInactivite = window.setTimeout(function () {
			fermerSession(true);
		}, INACTIVITE_MS);
	}

	['click', 'keydown', 'scroll', 'mousemove', 'touchstart'].forEach(function (evt) {
		document.addEventListener(evt, function () {
			if (!app.hidden) { armerInactivite(); }
		}, { passive: true });
	});

	if (btnConnexion) { btnConnexion.addEventListener('click', ouvrirSession); }

	if (btnReconnexion) {
		btnReconnexion.addEventListener('click', function () {
			voile.hidden = true;
			ecran.hidden = false;
			afficherCompteur();
		});
	}

	/* ----------------------------------------------------------------------
	   Navigation : une seule destination fonctionne
	   ---------------------------------------------------------------------- */

	function montrer(id) {
		var panneaux = document.querySelectorAll('.panneau');
		Array.prototype.forEach.call(panneaux, function (p) {
			p.hidden = (p.id !== 'panneau-' + id);
		});
		var boutons = menu ? menu.querySelectorAll('button') : [];
		Array.prototype.forEach.call(boutons, function (b) {
			b.setAttribute('aria-current', b.getAttribute('data-cible') === id ? 'true' : 'false');
		});
		var zone = document.querySelector('.contenu-principal');
		if (zone) { zone.scrollTop = 0; }
	}

	function chargerSansFin(libelle) {
		montrer('chargement');
		var txt = document.getElementById('texte-chargement');
		if (txt) { txt.textContent = 'Chargement de « ' + libelle + ' »…'; }

		/* au bout d'un moment, le chargement « aboutit » sur une erreur */
		window.clearTimeout(minuterieFausse);
		minuterieFausse = window.setTimeout(function () {
			montrer('erreur');
		}, reduit ? 1200 : 6500);
	}

	if (menu) {
		menu.addEventListener('click', function (e) {
			var b = e.target.closest('button');
			if (!b) { return; }

			var cible = b.getAttribute('data-cible');
			var comportement = b.getAttribute('data-comportement');
			var libelle = b.getAttribute('data-libelle') || 'la page';

			if (comportement === 'ok') {
				window.clearTimeout(minuterieFausse);
				montrer(cible);
			} else if (comportement === 'erreur') {
				window.clearTimeout(minuterieFausse);
				montrer('erreur');
			} else if (comportement === 'session') {
				fermerSession(true);
			} else if (comportement === 'mauvaise-page') {
				/* ouvre fièrement la mauvaise section */
				window.clearTimeout(minuterieFausse);
				montrer('bulletin');
			} else {
				chargerSansFin(libelle);
			}
		});
	}

	/* ----------------------------------------------------------------------
	   Démarrage : toujours sur l'écran de connexion
	   ---------------------------------------------------------------------- */

	function demarrer() {
		afficherCompteur();
		if (app) { app.hidden = true; }
		if (ecran) { ecran.hidden = false; }
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', demarrer);
	} else {
		demarrer();
	}
}());
