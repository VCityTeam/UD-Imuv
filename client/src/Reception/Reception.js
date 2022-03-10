/** @format */

import { SystemUtils } from 'ud-viz/src/Components/Components';
import { MenuAuthView } from '../MenuAuth/MenuAuth';

import './Reception.css';

//TODO en conf
const aboutString = 'text to fill waiting config with text';

export class ReceptionView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Reception');

    //html
    this.receptionButton = null;
    this.aboutButton = null;
    this.newsButton = null;
    this.servicesButton = null;
    this.languageButton = null;
    this.joinButton = null;

    this.webSocketService = webSocketService;

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
    titleContent.innerHTML = 'text to fill waiting config with text'; //TODO should go in a config file to allow to swicth betwwen languages
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

    SystemUtils.File.loadJSON('../assets/config/config_features.json').then(
      (configFeatures) => {
        _this.joinButton.onclick = function () {
          _this.dispose();
          const menuAuth = new MenuAuthView(
            _this.webSocketService,
            configFeatures
          );
          document.body.appendChild(menuAuth.html());
          menuAuth.setOnClose(function () {
            menuAuth.dispose();
            document.body.appendChild(_this.html());
          });
        };
      }
    );
  }

  html() {
    return this.rootHtml;
  }
}
