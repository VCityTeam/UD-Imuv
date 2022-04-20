/** @format */

import { MenuAuthView } from '../MenuAuth/MenuAuth';

import './Reception.css';
import { getTextByID } from '../../assets/texts/receptionTexts.js';

export class ReceptionView {
  constructor(webSocketService, configFeatures) {
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

    this.configFeatures = configFeatures;

    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    const topNav = document.createElement('div');
    topNav.classList.add('topNav_Reception');
    this.rootHtml.appendChild(topNav);

    const containerBtnTopNav = document.createElement('div');
    topNav.appendChild(containerBtnTopNav);

    const hamburgerButton = document.createElement('div');
    hamburgerButton.classList.add('hamburgerMenu_Reception');
    hamburgerButton.innerHTML = '&#9776;';
    hamburgerButton.onclick = function () {
      var x = document.getElementById('buttonsTopNav_Reception');
      x.style.display = x.style.display == 'block' ? 'none' : 'block';
    };
    containerBtnTopNav.appendChild(hamburgerButton);

    const buttonsTopNav = document.createElement('div');
    buttonsTopNav.id = 'buttonsTopNav_Reception';
    containerBtnTopNav.append(buttonsTopNav);

    const createButton = function (label, href = null) {
      const result = document.createElement('a');
      result.classList.add('buttonTopNav_Reception');
      result.innerHTML = label;
      if (href) result.href = href;
      return result;
    };

    //buttons Nav
    this.receptionButton = createButton(getTextByID('button_Home'));
    buttonsTopNav.appendChild(this.receptionButton);
    this.aboutButton = createButton(getTextByID('button_About'), '#about');
    buttonsTopNav.appendChild(this.aboutButton);
    this.newsButton = createButton(getTextByID('button_News'), '#news');
    buttonsTopNav.appendChild(this.newsButton);
    this.servicesButton = createButton(
      getTextByID('button_Services'),
      '#services'
    );
    buttonsTopNav.appendChild(this.servicesButton);
    this.languageButton = createButton(getTextByID('button_FRUK'));
    buttonsTopNav.appendChild(this.languageButton);

    //title Nav
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('titleNav_Reception');
    topNav.appendChild(titleDiv);

    const imageTitle = document.createElement('img');
    imageTitle.src = './assets/img/labex_imu.jpeg';
    topNav.appendChild(imageTitle);

    const titlePage = document.createElement('h1');
    titlePage.innerHTML = getTextByID('titleNav');
    titleDiv.appendChild(titlePage);

    //header
    const header = document.createElement('header');
    header.classList.add('header_Reception');
    this.rootHtml.appendChild(header);

    this.joinButton = document.createElement('div');
    this.joinButton.classList.add('joinButton_Reception');
    this.rootHtml.appendChild(this.joinButton);

    const labelJoin = document.createElement('div');
    labelJoin.innerHTML = getTextByID('button_Join');
    this.joinButton.appendChild(labelJoin);

    //content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content_Reception');
    this.rootHtml.appendChild(contentDiv);

    const titleContent = document.createElement('div');
    titleContent.innerHTML = getTextByID('titleContent');
    titleContent.classList.add('titleContent_Reception');
    contentDiv.appendChild(titleContent);

    //about
    const aboutAnchor = document.createElement('div');
    aboutAnchor.classList.add('box_Reception');
    aboutAnchor.id = 'about';
    aboutAnchor.innerHTML = getTextByID('aboutAnchor');
    contentDiv.appendChild(aboutAnchor);

    const aboutContent = document.createElement('p');
    aboutContent.innerHTML = getTextByID('aboutContent');
    contentDiv.appendChild(aboutContent);

    //news
    const newsAnchor = document.createElement('div');
    newsAnchor.classList.add('box_Reception');
    newsAnchor.id = 'news';
    newsAnchor.innerHTML = getTextByID('newsAnchor');
    contentDiv.appendChild(newsAnchor);

    const newsContent = document.createElement('p');
    newsContent.innerHTML = getTextByID('newsContent');
    contentDiv.appendChild(newsContent);

    //services
    const servicesAnchor = document.createElement('div');
    servicesAnchor.classList.add('box_Reception');
    servicesAnchor.id = 'services';
    servicesAnchor.innerHTML = getTextByID('servicesAnchor');
    contentDiv.appendChild(servicesAnchor);

    const servicesContent = document.createElement('p');
    servicesContent.innerHTML = getTextByID('servicesContent');
    contentDiv.appendChild(servicesContent);
  }

  dispose() {
    this.rootHtml.remove();
  }

  initCallbacks() {
    const _this = this;

    this.receptionButton.href = '';

    this.joinButton.onclick = function () {
      _this.dispose();
      const menuAuth = new MenuAuthView(
        _this.webSocketService,
        _this.configFeatures
      );
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
