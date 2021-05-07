/** @format */

import { MenuAuthView } from '../MenuAuth/MenuAuth';

import './Reception.css';

//TODO en conf
const aboutString =
  "Les communautés de recherche fédérées au sein du LabEx IMU traitent de l'urbanisation sous toutes ses formes: les villes, les métropoles, les mégalopoles, les villes mondes, les Altervilles, les seconds city, l'urbain, l'urbain généralisé... et dans ses temporalités. L'urbanisation est processus ancien qui se généralise pour atteindre, depuis la fin du XXe siècle, des seuils et des formes sans équivalents historiques.<br><br>Quel monde advient-il avec l'urbain généralisé? Vers quelles sociétés, quels environnements conduit ce processus? Vers quels états social, politique, technique, économique, environnemental conduit-il? Quelles dynamiques - sociales, politiques, tehnique, technoscientifique, etc. - l'orientent?<br><br>Intention : Proposer un espace virtuel collaboratif innovant destiné en priorité aux laboratoires et aux partenaires de la communauté IMU. Mais également, un espace virtuel restant en partie accessible 24h/24h aux acteurs de la ville; praticiens et citoyens intéressés par les réflexions permanents sur l'aménagement urbain dans tous les domaines scientifiques universitaires.";

export class ReceptionView {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Reception');

    //html
    this.receptionButton = null;
    this.aboutButton = null;
    this.newsButton = null;
    this.servicesButton = null;
    this.languageButton = null;
    this.joinButton = null;

    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    const topMenu = document.createElement('div');
    topMenu.classList.add('topMenu_Reception');
    this.rootHtml.appendChild(topMenu);

    const createButton = function (label) {
      const result = document.createElement('div');
      result.classList.add('button_Reception');
      result.classList.add('box_Reception');
      result.innerHTML = label;
      return result;
    };

    //buttons
    this.receptionButton = createButton('Accueil');
    topMenu.appendChild(this.receptionButton);
    this.aboutButton = createButton('A propos');
    topMenu.appendChild(this.aboutButton);
    this.newsButton = createButton('Actualités');
    topMenu.appendChild(this.newsButton);
    this.servicesButton = createButton('Services');
    topMenu.appendChild(this.servicesButton);
    this.languageButton = createButton('FR/UK');
    topMenu.appendChild(this.languageButton);

    //title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('titleDiv_Reception');
    this.rootHtml.appendChild(titleDiv);

    const imageTitle = document.createElement('img');
    imageTitle.src = './assets/img/labex_imu.jpeg';
    titleDiv.appendChild(imageTitle);

    const titlePage = document.createElement('div');
    titlePage.innerHTML = 'Flying Campus';
    titleDiv.appendChild(titlePage);

    const topImg = document.createElement('img');
    topImg.classList.add('topImg_Reception');
    //TODO en conf
    topImg.src = './assets/img/reception_top_image.jpg';
    this.rootHtml.appendChild(topImg);

    this.joinButton = document.createElement('div');
    this.joinButton.classList.add('joinButton_Reception');
    this.rootHtml.appendChild(this.joinButton);

    const labelJoin = document.createElement('div');
    labelJoin.innerHTML = 'Rejoindre';
    this.joinButton.appendChild(labelJoin);

    //content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content_Reception');
    this.rootHtml.appendChild(contentDiv);

    const titleContent = document.createElement('div');
    titleContent.innerHTML =
      "Un observatoire sur la ville d'hier, d'aujourd'hui et de demain"; //TODO should go in a config file to allow to swicth betwwen languages
    titleContent.classList.add('titleContent_Reception');
    contentDiv.appendChild(titleContent);

    //about
    const aboutAnchor = document.createElement('div');
    aboutAnchor.classList.add('box_Reception');
    aboutAnchor.innerHTML = 'A propos';
    contentDiv.appendChild(aboutAnchor);

    const aboutContent = document.createElement('p');
    aboutContent.innerHTML = aboutString;
    contentDiv.appendChild(aboutContent);

    //news
    const newsAnchor = document.createElement('div');
    newsAnchor.classList.add('box_Reception');
    newsAnchor.innerHTML = 'Actualités';
    contentDiv.appendChild(newsAnchor);

    const newsContent = document.createElement('p');
    newsContent.innerHTML = aboutString;
    contentDiv.appendChild(newsContent);

    //services
    const servicesAnchor = document.createElement('div');
    servicesAnchor.classList.add('box_Reception');
    servicesAnchor.innerHTML = 'Services';
    contentDiv.appendChild(servicesAnchor);

    const servicesContent = document.createElement('p');
    servicesContent.innerHTML = aboutString;
    contentDiv.appendChild(servicesContent);
  }

  dispose() {
    this.rootHtml.remove();
  }

  initCallbacks() {
    const _this = this;

    this.joinButton.onclick = function () {
      _this.dispose();
      const menuAuth = new MenuAuthView();
      document.body.appendChild(menuAuth.html());
      menuAuth.setOnClose(function () {
        menuAuth.dispose();
        document.body.appendChild(_this.html());
      });
    };
  }

  html() {
    return this.rootHtml;
  }
}
