/* A function that takes an id and returns the text associated with that id. */
const getTextByID = function (id, lang) {
  return texts[lang][id] || 'TEXT NOT DEFINED';
};

export { getTextByID };

/* A JSON object that contains the text for the website in two languages. */
const texts = {
  FR: {
    editorButton: 'Editeur ',
    button_Home: 'Accueil',
    button_About: 'A propos',
    button_News: 'Actualités',
    button_Credits: 'Credits',
    button_FRUK: 'FR/UK',
    titleNav: 'IMUV - Flying Campus',
    button_Join: 'Rejoindre',
    titleContent: 'Flying Campus',
    //About
    aboutBoxTitle: 'A propos',
    aboutTitleTeam: 'Equipe',
    aboutLabelsTeamList: [
      'Jean-Yves <b>TOUSSAINT</b>',
      'Gilles <b>GESQUIERE</b>',
      'Didier <b>CHANFRAY</b>',
      'Yael <b>BARROZ</b>',
      'Mathieu <b>LIVEBARDON</b>',
      'Valentin <b>MACHADO</b>',
    ],
    aboutTitleDescription: 'Description',
    aboutDescription:
      "Le projet Flying Campus est porté par le <b>Labex IMU<b>, c'est un outil collaboratif immersif sous la forme d'un campus numérique dans un <b>monde 3D<b> persistant sur le <b>web<b>. L'intention de ce projet est de proposer un espace collaboratif virtuel innovant destiné en priorité aux laboratoires et aux partenaires de la communauté IMU. Mais aussi, un espace virtuel restant en partie accessible 24h/24h aux acteurs de la ville ; praticiens et citoyens intéressés par des réflexions permanentes sur le développement urbain dans tous les domaines <b>scientifiques universitaires<b>.", // eslint-disable-line
    aboutTitleOverview: "Vue d'ensemble", // eslint-disable-line
    aboutSubtitleGraphicDescription: 'Description graphique',
    aboutGraphicDescription:
      'Le Flying Campus est un campus virtuel se trouvant sur une île survolant la ville de Lyon représenté en 3D.',
    aboutIsletFigcaption: "Modele 3D de l'Ilôt", // eslint-disable-line
    aboutGraphicDescriptionIslet:
      'C’est le concept d’un bâtiment en forme d’abbaye qui a été choisie pour le campus, (il évidemment est dénué de toutes intentions religieuses). Le but étant de reprendre simplement l’organisation architecturale d’une abbaye d’un point de vue fonctionnel (distributif, circulatoire et réflexif).',
    aboutAvatarFigcaption: "Modele 3D de l'Avatar", // eslint-disable-line
    aboutGraphicDescriptionAvatar:
      'Chaque utilisateur contrôle un avatar. C’est un humanoïde capuchonné neutre, grâce à un éditeur d’avatar, nous pouvons choisir sa couleur, le nom qui s’affichera au-dessus de sa tête et une photo à la place de son visage.',

    //News
    newsBoxTitle: 'Actualités',
    newsLinkGithubReleases: 'Github Releases',
    feedbacksLabel: "Retour d'expérience",
    creditsBoxTitle: 'Credits',
    creditsContentList: [
      'Souris modele 3D : <a href=https://free3d.com/3d-model/computer-mouse-v3--595560.html>https://free3d.com/3d-model/computer-mouse-v3--595560.html</a>',
      'Sons : <a href=https://universal-soundbank.com/>https://universal-soundbank.com/</a> <br>',
      'Logo Google Form : <a href="https://commons.wikimedia.org/wiki/File:Google_Forms_2020_Logo.svg">Google</a>, Domaine publique, via Wikimedia Commons',
      'Fond de carte Lyon : <a href="https://fr.wikipedia.org/wiki/Fichier:Lyon_et_ses_arrondissements_map.svg">Wikimedia</a>',
      '<a href="https://www.flaticon.com/free-icons/town" title="town icons">Town icons created by Eucalyp - Flaticon</a>',
      '<a href="https://www.flaticon.com/fr/icones-gratuites/teleporter" title="téléporter icônes">Téléporter icônes créées par Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/fr/icones-gratuites/roue-dentee" title="roue dentée icônes">Roue dentée icônes créées par Saepul Nahwan - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/chain" title="chain icons">Chain icons created by Creaticca Creative Agency - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/fullscreen" title="fullscreen icons">Fullscreen icons created by Those Icons - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/paper" title="paper icons">Paper icons created by Gregor Cresnar - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/save" title="save icons">Save icons created by Yogi Aprelliyanto - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/slideshow" title="slideshow icons">Slideshow icons created by Smashicons - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/post-it" title="Post it icons">Post it icons created by Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/drag-and-drop" title="drag and drop icons">Drag and drop icons created by Bharat Icons - Flaticon</a>',
    ],

    //Sign
    signIn: 'Identification',
    signUp: 'Créer compte',
  },

  EN: {
    editorButton: 'Editor ',
    button_Home: 'Home',
    button_About: 'About',
    button_News: 'News',
    button_Credits: 'Credits',
    button_FRUK: 'FR/UK',
    titleNav: 'IMUV - Flying Campus',
    button_Join: 'Join',
    titleContent: 'Flying Campus',
    //About
    aboutBoxTitle: 'About',
    aboutTitleTeam: 'Team',
    aboutLabelsTeamList: [
      'Jean-Yves <b>TOUSSAINT</b>',
      'Gilles <b>GESQUIERE</b>',
      'Didier <b>CHANFRAY</b>',
      'Yael <b>BARROZ</b>',
      'Mathieu <b>LIVEBARDON</b>',
      'Valentin <b>MACHADO</b>',
    ],
    aboutTitleDescription: 'Description',
    aboutDescription:
      "The Flying Campus project is led by the <b>Labex IMU<b>, it is an immersive collaborative tool in the form of a digital campus in a <b>3D world<b> persisting on the <b>web<b>. The intention of this project is to propose an innovative virtual collaborative space intended primarly for laborattories and for partners of IMU's community. But also, a virtual space staying partly accessible 24h/24h for cyty's actors ; practitioners and citizens interessed by permanent reflections on the urban development in all <b>academic scientific<b> fields.", // eslint-disable-line
    aboutTitleOverview: 'Overview',
    aboutSubtitleGraphicDescription: 'Graphic description',
    aboutGraphicDescription:
      'The Flying Campus is a virtual campus being on a flying island flying over the Lyon city represented in 3D.',
    aboutIsletFigcaption: 'Islet model 3D',
    aboutGraphicDescriptionIslet:
      'The concept of an abbey-like building was chosen for the campus (it is obviously devoid of any religious intentions). The goal is to simply resume the architectural organization of an abbeye from a functional point of view (distributive, circulatory and reflexive).',
    aboutAvatarFigcaption: 'Avatar model 3D',
    aboutGraphicDescriptionAvatar:
      "Each users control an avatar. It's a neutral hooded humanoid, thanks to an avatar editor, we can chose its color, the name that will be displayed above his head and a picture instead of his face.", // eslint-disable-line

    //News
    newsBoxTitle: 'News',
    newsLinkGithubReleases: 'Github Releases',
    feedbacksLabel: 'Feedbacks',
    creditsBoxTitle: 'Credits',
    creditsContentList: [
      'Mouse 3D model : <a href=https://free3d.com/3d-model/computer-mouse-v3--595560.html>https://free3d.com/3d-model/computer-mouse-v3--595560.html</a>',
      'Sounds : <a href=https://universal-soundbank.com/>https://universal-soundbank.com/</a> <br>',
      'Logo Google Form : <a href="https://commons.wikimedia.org/wiki/File:Google_Forms_2020_Logo.svg">Google</a>, Public domain, via Wikimedia Commons',
      'Background map of Lyon : <a href="https://fr.wikipedia.org/wiki/Fichier:Lyon_et_ses_arrondissements_map.svg">Wikimedia</a>',
      '<a href="https://www.flaticon.com/free-icons/town" title="town icons">Town icons created by Eucalyp - Flaticon</a>',
      '<a href="https://www.flaticon.com/fr/icones-gratuites/teleporter" title="téléporter icônes">Téléporter icônes créées par Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/fr/icones-gratuites/roue-dentee" title="roue dentée icônes">Roue dentée icônes créées par Saepul Nahwan - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/chain" title="chain icons">Chain icons created by Creaticca Creative Agency - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/fullscreen" title="fullscreen icons">Fullscreen icons created by Those Icons - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/paper" title="paper icons">Paper icons created by Gregor Cresnar - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/save" title="save icons">Save icons created by Yogi Aprelliyanto - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/slideshow" title="slideshow icons">Slideshow icons created by Smashicons - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/post-it" title="Post it icons">Post it icons created by Freepik - Flaticon</a>',
      '<a href="https://www.flaticon.com/free-icons/drag-and-drop" title="drag and drop icons">Drag and drop icons created by Bharat Icons - Flaticon</a>',
    ],

    //Sign
    signIn: 'Sign In',
    signUp: 'Sign Up',
  },
};
