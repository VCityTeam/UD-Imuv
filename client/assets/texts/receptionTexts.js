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
  EN: {},
};

module.exports = {
  getTextByID: function (id) {
    const lang = 'FR'; //TODO get this var in a global config
    return texts[lang][id] || 'TEXT NOT DEFINED';
  },
};
