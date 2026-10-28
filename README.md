# Buildathon ASETIN — site web

Site statique pour le Buildathon de l'ASETIN du **29 novembre 2026**.
Aucune dépendance, aucune étape de compilation : ce sont des fichiers à servir tels quels.

```
index.html                 accueil (mise en page 3 colonnes façon Newgrounds 2005)
sante.html                 catégorie Santé, présentée comme une télécopie d'IGEA
.nojekyll                  empêche GitHub Pages de passer le site dans Jekyll
assets/css/retro.css       thème GeoCities + palette ASETIN, grille, responsive
assets/css/fax.css         papier thermique, fausse boîte de dialogue, impression
assets/css/clavardage.css  habillage du widget AsetinBot 2000
assets/js/compteur.js      compteur de visiteurs partagé (+ repli local)
assets/js/clavardage.js    widget de clavardage — LA CONFIG EST EN HAUT DU FICHIER
assets/js/fax.js           impression progressive, tonalité, fausse recherche d'imprimantes
assets/img/                SVG : hibou 8 bits, tuile de fond, logo IGEA, fax, bouton 88×31
```

Test local :

```bash
python3 -m http.server 8000      # puis http://localhost:8000
```

---

## 1. Brancher AsetinBot 2000 sur ta boîte

Par défaut le widget est en **mode démonstration** : le robot répond, mais rien
n'est envoyé nulle part. Ouvre `assets/js/clavardage.js`, l'objet `CONFIG` est
tout en haut. Quatre modes possibles.

### FormSubmit — le plus rapide (recommandé pour partir)

1. Va sur <https://formsubmit.co>, entre ton courriel, récupère la **chaîne
   aléatoire** qu'ils te donnent (elle évite d'exposer ton adresse dans le code).
2. Dans `CONFIG` : `mode: 'formsubmit'` et `cle: 'ta-chaine'`.
3. Le tout premier message envoyé déclenche un courriel de confirmation à activer.

À sens unique : les messages arrivent dans ta boîte, tu réponds par courriel.

### Web3Forms — équivalent

<https://web3forms.com> → ton courriel → access key.
`mode: 'web3forms'`, `cle: 'ta-access-key'`.

### Discord — les messages tombent dans un salon

Paramètres du salon → Intégrations → Webhooks → copie l'URL.
`mode: 'discord'`, `cle: 'https://discord.com/api/webhooks/...'`.

> ⚠️ Une URL de webhook dans du code client est **publique**. N'importe qui peut
> la lire dans le fichier et poster dedans. À réserver à un salon jetable, et à
> révoquer après l'événement.

### Tawk.to — vrai clavardage bidirectionnel

C'est celui qui correspond à « je m'insère quand ça me tente » : app mobile,
tu vois les gens écrire, tu débarques en direct.

1. Crée une propriété sur <https://tawk.to>, récupère ton lien de widget
   (de la forme `.../<propertyId>/<widgetId>`).
2. `mode: 'tawk'`, puis remplis `tawk.propertyId` et `tawk.widgetId`.
3. Le script charge Tawk, **masque leur bulle**, et branche le bouton Envoyer
   sur leur fenêtre — l'habillage rétro reste le tien.

### Régler le robot

Le tableau `REPLIQUES` dans le même fichier contient les répliques, dans l'ordre.
La dernière se répète ensuite. `ouvertureAuto: 8000` fait ouvrir le widget tout
seul après 8 secondes, si tu veux être plus intrusif (0 = jamais).

---

## 2. Compteur de visiteurs

Vrai compteur partagé entre tous les visiteurs, via
[Abacus](https://abacus.jasoncameron.dev) — gratuit, aucun compte requis.
Si le service est injoignable (hors ligne, bloqueur de pub, quota), la page
retombe sur un compte local par navigateur et l'affiche honnêtement en petit.

Réglages en haut de `assets/js/compteur.js` :

- `ESPACE` / `CLE` — identifient le compteur. **Changer `CLE` remet le compteur
  à zéro** (pratique juste avant l'ouverture des inscriptions).
- `BASE` — décalage cosmétique, pour ne pas ouvrir à 1 visiteur.

> Note : ce compteur n'a pas été testé contre le vrai service depuis
> l'environnement de développement (sortie réseau bloquée). Vérifie une fois en
> ligne que le chiffre bouge d'un onglet à l'autre ; sinon le repli local prend
> le relais sans casser la page.

---

## 3. Publier sur GitHub Pages

Le site est entièrement statique et tous les chemins sont **relatifs**, donc il
fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier
`https://<utilisateur>.github.io/<depot>/`.

### Première publication

```bash
cd "chemin/vers/HackathonNovembreSite"

git init -b main                     # si ce n'est pas déjà un dépôt
git add .
git commit -m "Site du Buildathon : accueil, défi IGEA, clavardage, compteur"

# crée le dépôt sur GitHub et pousse (gh CLI)
gh repo create asetin-buildathon --public --source=. --push

# …ou à la main, si le dépôt existe déjà
git remote add origin https://github.com/<utilisateur>/<depot>.git
git push -u origin main
```

### Activer Pages

Sur GitHub : **Settings → Pages → Build and deployment**
→ *Source* : **Deploy from a branch**
→ *Branch* : `main`, dossier `/ (root)` → **Save**.

Le site sort à `https://<utilisateur>.github.io/<depot>/` après une à deux minutes.

### Mises à jour

```bash
git add . && git commit -m "…" && git push
```

Pages redéploie tout seul.

### Points d'attention

- `index.html` doit rester **à la racine** du dépôt, pas dans un sous-dossier.
- `.nojekyll` est déjà là : il empêche Jekyll de filtrer des fichiers.
- Pages sert en HTTPS ; les appels au compteur et au formulaire le sont aussi.
  Ne remplace pas une URL `https://` par `http://`, le navigateur bloquerait.
- Si le dépôt est **privé**, Pages exige un plan payant. En public, c'est gratuit.

---

## 4. Reste à faire

- [ ] Deuxième catégorie (vie étudiante) : la carte « EN CONSTRUCTION » est déjà
      sur l'accueil. Il manque le commanditaire fictif, sa pub dans le rail droit
      et sa page.
- [ ] Vrai lien de billetterie (`index.html`, cherche `TODO`).
- [ ] Lieu exact sur le campus.
- [ ] Choisir et configurer le mode du clavardage (section 1).

---

## Note

IGEA est une entreprise entièrement fictive. Le logo, la papeterie et le
personnage de Gilles Tremblay ont été inventés pour l'événement ; rien n'imite
une organisation réelle.
