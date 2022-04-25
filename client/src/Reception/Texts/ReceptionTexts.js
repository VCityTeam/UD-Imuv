/* A function that takes an id and returns the text associated with that id. */
const getTextByID = function (id, lang) {
  return texts[lang][id] || 'TEXT NOT DEFINED';
};

export { getTextByID };

/* A JSON object that contains the text for the website in two languages. */
const texts = {
  FR: {
    button_Home: 'Accueil',
    button_About: 'A propos',
    button_News: 'Actualités',
    button_Services: 'Services',
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
    servicesBoxTitle: 'Services',
    servicesContent: 'A venir',
  },

  EN: {
    button_Home: 'Home',
    button_About: 'About',
    button_News: 'News',
    button_Services: 'Services',
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
    servicesBoxTitle: 'Services',
    servicesContent: 'Coming soon',
  },
};
