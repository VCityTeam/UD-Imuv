const texts = {
  FR: {
    button_Home: 'Accueil',
    button_About: 'A propos',
    button_News: 'Actualités',
    button_Services: 'Services',
    button_FRUK: 'FR/UK',
    titleNav: 'IMUV - Flying Campus',
    button_Join: 'Rejoindre',
    titleContent: 'Titre content :)',
    aboutAnchor: 'A propos',
    aboutContent:
      "Le projet Flying Campus est porté par le Labex IMU, c'est un outil collaboratif immersif sous la forme d'un campus numérique dans un monde 3D persistant sur le web. L'intention de ce projet est de proposer un espace collaboratif virtuel innovant destiné en priorité aux laboratoires et aux partenaires de la communauté IMU. Mais aussi, un espace virtuel restant partiellement accessible 24h/24h pour les acteurs de la ville ; praticiens et citoyens intéressés par des réflexions permanentes sur le développement urbain dans tous les domaines scientifiques académiques.",
    newsAnchor: 'Actualités',
    newsContent:
      '<a href="https://github.com/VCityTeam/UD-Imuv/releases" target="_blank">Github releases</a>',
    servicesAnchor: 'Services',
    servicesContent: 'Services content :)',
  },
  EN: {
    button_Home: 'Home',
    button_About: 'About',
    button_News: 'News',
    button_Services: 'Services',
    button_FRUK: 'FR/UK',
    titleNav: 'IMUV - Flying Campus',
    button_Join: 'Join',
    titleContent: 'Title content :)',
    aboutAnchor: 'About',
    aboutContent:
      "The Flying Campus project is led by the Labex IMU, it is an immersive collaborative tool in the form of a digital campus in a 3D world persisting on the web. The intention of this project is to propose an innovative virtual collaborative space intended primarly for laborattories and for partners of IMU's community. But also, a virtual space staying partly accessible 24h/24h for cyty's actors ; practitioners and citizens interessed by permanent reflections on the urban development in all academic scientific fields.",
    newsAnchor: 'News',
    newsContent:
      '<a href="https://github.com/VCityTeam/UD-Imuv/releases" target="_blank">Github releases</a>',
    servicesAnchor: 'Services',
    servicesContent: 'Services content :)',
  },
};

module.exports = {
  getTextByID: function (id) {
    const lang = 'FR'; //TODO get this var in a global config
    return texts[lang][id] || 'TEXT NOT DEFINED';
  },
};
