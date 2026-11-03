/* ==========================================================================
   ATARDI — agrandissement des jaquettes
   Un clic sur une vignette l'ouvre en grand dans une fenêtre modale.
   On ferme avec le ×, en cliquant à côté, ou avec Échap.
   ========================================================================== */
(function () {
	'use strict';

	var modale = document.getElementById('agrandir');
	var image = document.getElementById('agrandir-img');
	var titre = document.getElementById('agrandir-titre');
	var fermer = document.getElementById('agrandir-fermer');
	if (!modale || !image || !fermer) { return; }

	var dernierFocus = null;

	function ouvrir(src, texte) {
		dernierFocus = document.activeElement;
		image.src = src;
		image.alt = texte || '';
		titre.textContent = texte || '';
		modale.hidden = false;
		fermer.focus();
	}

	function fermerModale() {
		modale.hidden = true;
		image.src = '';
		if (dernierFocus && typeof dernierFocus.focus === 'function') {
			dernierFocus.focus();
		}
	}

	/* rendre chaque vignette cliquable et accessible au clavier */
	var vignettes = document.querySelectorAll('.grille-produits img');
	Array.prototype.forEach.call(vignettes, function (img) {
		img.setAttribute('role', 'button');
		img.setAttribute('tabindex', '0');

		var libelle = '';
		var li = img.closest('li');
		var b = li ? li.querySelector('b') : null;
		if (b) { libelle = b.textContent.trim(); }
		else { libelle = img.getAttribute('alt') || ''; }

		img.addEventListener('click', function () {
			ouvrir(img.getAttribute('src'), libelle);
		});
		img.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				ouvrir(img.getAttribute('src'), libelle);
			}
		});
	});

	fermer.addEventListener('click', fermerModale);

	/* clic sur le fond (hors du cadre) ferme aussi */
	modale.addEventListener('click', function (e) {
		if (e.target === modale) { fermerModale(); }
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && !modale.hidden) { fermerModale(); }
	});
}());
