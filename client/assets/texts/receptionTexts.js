const texts = {
  FR: {
    button_Home: 'Accueil',
    button_About: 'A propos',
    button_News: 'Actualités',
    button_Services: 'Services',
    button_FRUK: 'FR/UK',
    titleNav: 'IMUV - Flying Campus',
    button_Join: 'Rejoindre',
  },
  EN: {},
};

module.exports = {
  getTextByID: function (id) {
    const lang = 'FR'; //TODO get this var in a global config
    return texts[lang][id] || 'UNKNOWN';
  },
};
