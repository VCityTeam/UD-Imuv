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
    const aboutSection = document.createElement('section');
    aboutSection.id = 'about';
    contentDiv.appendChild(aboutSection);

    const aboutBoxTitle = document.createElement('div');
    aboutBoxTitle.classList.add('box_Reception');
    aboutBoxTitle.innerHTML = getTextByID('aboutBoxTitle');
    aboutSection.appendChild(aboutBoxTitle);

    //About->Description
    const aboutTitleDescription = document.createElement('h2');
    aboutTitleDescription.innerHTML = getTextByID('aboutTitleDescription');
    aboutSection.appendChild(aboutTitleDescription);

    const aboutDescription = document.createElement('p');
    aboutDescription.innerHTML = getTextByID('aboutDescription');
    aboutSection.appendChild(aboutDescription);

    //About->Team
    const aboutTitleTeam = document.createElement('h2');
    aboutTitleTeam.innerHTML = getTextByID('aboutTitleTeam');
    aboutSection.appendChild(aboutTitleTeam);

    const aboutTeamList = document.createElement('ul');
    getTextByID('aboutLabelsTeamList').forEach((element) => {
      const liEl = document.createElement('li');
      liEl.innerHTML = element;
      aboutTeamList.appendChild(liEl);
    });
    aboutSection.appendChild(aboutTeamList);

    //About->Overview
    const aboutTitleOverview = document.createElement('h2');
    aboutTitleOverview.innerHTML = getTextByID('aboutTitleOverview');
    aboutSection.appendChild(aboutTitleOverview);

    const aboutSubtitleGraphicDescription = document.createElement('h3');
    aboutSubtitleGraphicDescription.innerHTML = getTextByID(
      'aboutSubtitleGraphicDescription'
    );
    aboutSection.appendChild(aboutSubtitleGraphicDescription);

    const aboutGraphicDescription = document.createElement('p');
    aboutGraphicDescription.innerHTML = getTextByID('aboutGraphicDescription');
    aboutSection.appendChild(aboutGraphicDescription);

    //About->Overview->Graphic Description->Islet Figure
    const aboutIsletFigure = document.createElement('figure');
    aboutSection.appendChild(aboutIsletFigure);

    const aboutIsletImg = document.createElement('img');
    aboutIsletImg.src = './assets/img/reception/islet.png';
    aboutIsletFigure.appendChild(aboutIsletImg);

    const aboutIsletFigcaption = document.createElement('figcaption');
    aboutIsletFigcaption.innerHTML = getTextByID('aboutIsletFigcaption');
    aboutIsletFigure.appendChild(aboutIsletFigcaption);

    const aboutGraphicDescriptionIslet = document.createElement('p');
    aboutGraphicDescriptionIslet.innerHTML = getTextByID(
      'aboutGraphicDescriptionIslet'
    );
    aboutSection.appendChild(aboutGraphicDescriptionIslet);

    //About->Overview->Graphic Description->Avatar Figure
    const aboutAvatarFigure = document.createElement('figure');
    aboutSection.appendChild(aboutAvatarFigure);

    const aboutAvatarImg = document.createElement('img');
    aboutAvatarImg.src = './assets/img/reception/avatar.png';
    aboutAvatarFigure.appendChild(aboutAvatarImg);

    const aboutAvatarFigcaption = document.createElement('figcaption');
    aboutAvatarFigcaption.innerHTML = getTextByID('aboutAvatarFigcaption');
    aboutAvatarFigure.appendChild(aboutAvatarFigcaption);

    const aboutGraphicDescriptionAvatar = document.createElement('p');
    aboutGraphicDescriptionAvatar.innerHTML = getTextByID(
      'aboutGraphicDescriptionAvatar'
    );
    aboutSection.appendChild(aboutGraphicDescriptionAvatar);

    //news
    const newsSection = document.createElement('section');
    newsSection.id = 'news';
    contentDiv.appendChild(newsSection);

    const newsBoxTitle = document.createElement('div');
    newsBoxTitle.classList.add('box_Reception');
    newsBoxTitle.innerHTML = getTextByID('newsBoxTitle');
    newsSection.appendChild(newsBoxTitle);

    const newsLinkGHReleases = document.createElement('a');
    newsLinkGHReleases.innerHTML = getTextByID('newsLinkGithubReleases');
    newsSection.appendChild(newsLinkGHReleases);

    //services
    const servicesSection = document.createElement('section');
    servicesSection.id = 'services';
    contentDiv.appendChild(servicesSection);

    const servicesBoxTitle = document.createElement('div');
    servicesBoxTitle.classList.add('box_Reception');
    servicesBoxTitle.innerHTML = getTextByID('servicesBoxTitle');
    servicesSection.appendChild(servicesBoxTitle);

    const servicesContent = document.createElement('p');
    servicesContent.innerHTML = getTextByID('servicesContent');
    servicesSection.appendChild(servicesContent);
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
