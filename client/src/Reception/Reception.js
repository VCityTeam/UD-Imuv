/** @format */

import * as JitsiIframeAPI from 'jitsi-iframe-api';
import ImuvConstants from '../../../imuv.constants';
import { AnimatedText } from '../LocalScriptsModule/AnimatedText/AnimatedText';

import { SignInView, SignUpView } from '../Sign/Sign';
import { EditorView } from '../Editor/Editor';
import { SystemUtils } from 'ud-viz/src/Components/Components';

import { AssetsManager } from 'ud-viz/src/Views/Views';
import { DistantGame } from '../DistantGame/DistantGame';

import './Reception.css';
import { getTextByID } from './Texts/ReceptionTexts';

export class ReceptionView {
  constructor(webSocketService) {
    //root
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Reception');

    //html
    this.hamburgerButton = null;
    this.signInButton = null;
    this.signUpButton = null;
    this.nameUserLabel = null;
    this.roleUserLabel = null;
    this.languageButton = null;
    this.joinButton = null;

    //user data
    this.userData = {
      nameUser: 'default_name_user',
      role: 'default_role_user',
    };

    //socket service
    this.webSocketService = webSocketService;

    //default lang is FR
    this.language = 'FR';

    //init view + callback button
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

    this.hamburgerButton = document.createElement('div');
    this.hamburgerButton.classList.add('hamburgerMenu_Reception');
    this.hamburgerButton.innerHTML = '&#9776;';
    containerBtnTopNav.appendChild(this.hamburgerButton);

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
    const receptionButton = createButton(
      getTextByID('button_Home', this.language),
      '#top'
    );
    buttonsTopNav.appendChild(receptionButton);
    const aboutButton = createButton(
      getTextByID('button_About', this.language),
      '#about'
    );
    buttonsTopNav.appendChild(aboutButton);
    const newsButton = createButton(
      getTextByID('button_News', this.language),
      '#news'
    );
    buttonsTopNav.appendChild(newsButton);
    const creditsButton = createButton(
      getTextByID('button_Credits', this.language),
      '#credits'
    );
    buttonsTopNav.appendChild(creditsButton);
    this.languageButton = createButton(
      getTextByID('button_FRUK', this.language)
    );
    buttonsTopNav.appendChild(this.languageButton);

    //title Nav
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('titleNav_Reception');
    topNav.appendChild(titleDiv);

    const imageTitle = document.createElement('img');
    imageTitle.src = './assets/img/labex_imu.jpeg';
    topNav.appendChild(imageTitle);

    //user
    const parentUser = document.createElement('div');
    topNav.appendChild(parentUser);

    this.roleUserLabel = document.createElement('div');
    this.roleUserLabel.classList.add('topNav_label');
    this.roleUserLabel.innerHTML = this.userData.role;
    parentUser.appendChild(this.roleUserLabel);

    this.nameUserLabel = document.createElement('div');
    this.nameUserLabel.classList.add('topNav_label');
    this.nameUserLabel.innerHTML = this.userData.nameUser;
    parentUser.appendChild(this.nameUserLabel);

    this.editorButton = document.createElement('div');
    this.editorButton.innerHTML = getTextByID('editorButton', this.language);
    this.editorButton.classList.add('sign_button_MenuAuth');
    this.editorButton.classList.add('hidden');
    parentUser.appendChild(this.editorButton);

    //authentification
    const parentSign = document.createElement('div');
    topNav.appendChild(parentSign);

    this.signUpButton = document.createElement('div');
    this.signUpButton.innerHTML = getTextByID('signUp', this.language);
    this.signUpButton.classList.add('sign_button_MenuAuth');
    parentSign.appendChild(this.signUpButton);

    this.signInButton = document.createElement('div');
    this.signInButton.innerHTML = getTextByID('signIn', this.language);
    this.signInButton.classList.add('sign_button_MenuAuth');
    parentSign.appendChild(this.signInButton);

    //title page
    const titlePage = document.createElement('h1');
    titlePage.innerHTML = getTextByID('titleNav', this.language);
    titleDiv.appendChild(titlePage);

    //header
    const header = document.createElement('header');
    header.id = 'top';
    header.classList.add('header_Reception');
    const loc = `${window.location.pathname}`;
    const path = loc.substring(0, loc.lastIndexOf('/'));
    header.style.backgroundImage =
      "url('" + path + "/assets/img/reception/top_image.jpg')";
    this.rootHtml.appendChild(header);

    this.joinButton = document.createElement('div');
    this.joinButton.classList.add('joinButton_Reception');
    this.rootHtml.appendChild(this.joinButton);

    const labelJoin = document.createElement('div');
    labelJoin.innerHTML = getTextByID('button_Join', this.language);
    this.joinButton.appendChild(labelJoin);

    const feedbacksDiv = document.createElement('div');
    feedbacksDiv.classList.add('feedbacksDiv_Reception');
    this.rootHtml.appendChild(feedbacksDiv);

    const feedbacksLabel = document.createElement('h2');
    feedbacksLabel.innerHTML = getTextByID('feedbacksLabel', this.language);
    feedbacksDiv.appendChild(feedbacksLabel);

    const feedbacksLink = document.createElement('a');
    feedbacksLink.href =
      'https://docs.google.com/forms/d/e/1FAIpQLSehPF3hsGpzgLnFABd8cbT0TZzzd7dznrJXCL2tEXvuw88hZQ/viewform?usp=pp_url';
    feedbacksLink.target = '_blank';
    feedbacksDiv.appendChild(feedbacksLink);

    const feedbacksImage = document.createElement('img');
    feedbacksImage.src =
      'https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Forms_2020_Logo.svg';
    feedbacksLink.appendChild(feedbacksImage);

    //content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content_Reception');
    this.rootHtml.appendChild(contentDiv);

    const titleContent = document.createElement('h1');
    titleContent.innerHTML = getTextByID('titleContent', this.language);
    titleContent.classList.add('titleContent_Reception');
    contentDiv.appendChild(titleContent);

    //about
    const aboutSection = document.createElement('section');
    aboutSection.id = 'about';
    contentDiv.appendChild(aboutSection);

    const aboutBoxTitle = document.createElement('div');
    aboutBoxTitle.classList.add('box_Reception');
    aboutBoxTitle.innerHTML = getTextByID('aboutBoxTitle', this.language);
    aboutSection.appendChild(aboutBoxTitle);

    //About->Description
    const aboutTitleDescription = document.createElement('h2');
    aboutTitleDescription.innerHTML = getTextByID(
      'aboutTitleDescription',
      this.language
    );
    aboutSection.appendChild(aboutTitleDescription);

    const aboutDescription = document.createElement('p');
    aboutDescription.innerHTML = getTextByID('aboutDescription', this.language);
    aboutSection.appendChild(aboutDescription);

    //About->Team
    const aboutTitleTeam = document.createElement('h2');
    aboutTitleTeam.innerHTML = getTextByID('aboutTitleTeam', this.language);
    aboutSection.appendChild(aboutTitleTeam);

    const aboutTeamList = document.createElement('ul');
    getTextByID('aboutLabelsTeamList', this.language).forEach((element) => {
      const liEl = document.createElement('li');
      liEl.innerHTML = element;
      aboutTeamList.appendChild(liEl);
    });
    aboutSection.appendChild(aboutTeamList);

    //About->Overview
    const aboutTitleOverview = document.createElement('h2');
    aboutTitleOverview.innerHTML = getTextByID(
      'aboutTitleOverview',
      this.language
    );
    aboutSection.appendChild(aboutTitleOverview);

    const aboutSubtitleGraphicDescription = document.createElement('h3');
    aboutSubtitleGraphicDescription.innerHTML = getTextByID(
      'aboutSubtitleGraphicDescription',
      this.language
    );
    aboutSection.appendChild(aboutSubtitleGraphicDescription);

    const aboutGraphicDescription = document.createElement('p');
    aboutGraphicDescription.innerHTML = getTextByID(
      'aboutGraphicDescription',
      this.language
    );
    aboutSection.appendChild(aboutGraphicDescription);

    //About->Overview->Graphic Description->Islet Figure
    const aboutIsletFigure = document.createElement('figure');
    aboutSection.appendChild(aboutIsletFigure);

    const aboutIsletImg = document.createElement('img');
    aboutIsletImg.src = './assets/img/reception/islet.png';
    aboutIsletFigure.appendChild(aboutIsletImg);

    const aboutIsletFigcaption = document.createElement('figcaption');
    aboutIsletFigcaption.innerHTML = getTextByID(
      'aboutIsletFigcaption',
      this.language
    );
    aboutIsletFigure.appendChild(aboutIsletFigcaption);

    const aboutGraphicDescriptionIslet = document.createElement('p');
    aboutGraphicDescriptionIslet.innerHTML = getTextByID(
      'aboutGraphicDescriptionIslet',
      this.language
    );
    aboutSection.appendChild(aboutGraphicDescriptionIslet);

    //About->Overview->Graphic Description->Avatar Figure
    const aboutAvatarFigure = document.createElement('figure');
    aboutSection.appendChild(aboutAvatarFigure);

    const aboutAvatarImg = document.createElement('img');
    aboutAvatarImg.src = './assets/img/reception/avatar.png';
    aboutAvatarFigure.appendChild(aboutAvatarImg);

    const aboutAvatarFigcaption = document.createElement('figcaption');
    aboutAvatarFigcaption.innerHTML = getTextByID(
      'aboutAvatarFigcaption',
      this.language
    );
    aboutAvatarFigure.appendChild(aboutAvatarFigcaption);

    const aboutGraphicDescriptionAvatar = document.createElement('p');
    aboutGraphicDescriptionAvatar.innerHTML = getTextByID(
      'aboutGraphicDescriptionAvatar',
      this.language
    );
    aboutSection.appendChild(aboutGraphicDescriptionAvatar);

    //news
    const newsSection = document.createElement('section');
    newsSection.id = 'news';
    contentDiv.appendChild(newsSection);

    const newsBoxTitle = document.createElement('div');
    newsBoxTitle.classList.add('box_Reception');
    newsBoxTitle.innerHTML = getTextByID('newsBoxTitle', this.language);
    newsSection.appendChild(newsBoxTitle);

    const newsLinkGHReleases = document.createElement('a');
    newsLinkGHReleases.innerHTML = getTextByID(
      'newsLinkGithubReleases',
      this.language
    );
    newsLinkGHReleases.href = 'https://github.com/VCityTeam/UD-Imuv/releases';
    newsLinkGHReleases.target = '_blank';
    newsSection.appendChild(newsLinkGHReleases);

    const backline = document.createElement('p');
    newsSection.appendChild(backline);

    //credits
    const creditsSection = document.createElement('section');
    creditsSection.id = 'credits';
    contentDiv.appendChild(creditsSection);

    const creditsBoxTitle = document.createElement('div');
    creditsBoxTitle.classList.add('box_Reception');
    creditsBoxTitle.innerHTML = getTextByID('creditsBoxTitle', this.language);
    creditsSection.appendChild(creditsBoxTitle);

    const creditsContentList = document.createElement('ul');
    getTextByID('creditsContentList', this.language).forEach((element) => {
      const liEl = document.createElement('li');
      liEl.innerHTML = element;
      creditsContentList.appendChild(liEl);
    });
    creditsSection.appendChild(creditsContentList);
  }

  dispose() {
    this.rootHtml.remove();
  }

  initCallbacks() {
    const _this = this;

    this.hamburgerButton.onclick = function () {
      const x = document.getElementById('buttonsTopNav_Reception');
      x.style.display = x.style.display == 'block' ? 'none' : 'block';
    };

    //join flying campus
    this.joinButton.onclick = function () {
      _this.dispose();

      //load config
      SystemUtils.File.loadJSON('./assets/config/config_game.json').then(
        function (config) {
          //load assets
          const assetsManager = new AssetsManager();
          assetsManager
            .loadFromConfig(config.assetsManager, document.body)
            .then(function () {
              const distantGame = new DistantGame(
                _this.webSocketService,
                assetsManager,
                config
              );

              distantGame.start(
                {
                  firstGameView: true,
                  editorMode: false,
                  role: _this.userData.role,
                },
                {
                  ImuvConstants: ImuvConstants,
                  AnimatedText: AnimatedText,
                  JitsiIframeAPI: JitsiIframeAPI,
                }
              );

              //app is loaded and ready to receive worldstate
              _this.webSocketService.emit(
                ImuvConstants.WEBSOCKET.MSG_TYPES.READY_TO_RECEIVE_STATE
              );
            });
        }
      );
    };

    //toggle language
    this.languageButton.onclick = function () {
      //toggle language
      if (_this.language == 'FR') {
        _this.language = 'EN';
      } else {
        _this.language = 'FR';
      }

      //rebuild
      while (_this.rootHtml.firstChild) {
        _this.rootHtml.firstChild.remove();
      }
      _this.init();
    };

    //sign up
    let signUpView = null;
    this.signUpButton.onclick = function () {
      if (signUpView) return;
      if (signInView) {
        signInView.dispose();
        signInView = null;
      }
      signUpView = new SignUpView(_this.webSocketService);
      document.body.appendChild(signUpView.html());

      signUpView.setOnClose(function () {
        signUpView.dispose();
        signUpView = null;
      });
    };
    this.webSocketService.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.SIGN_UP_SUCCESS,
      function () {
        console.log('sign up success ');
        if (signUpView) {
          signUpView.dispose();
          signUpView = null;
        }
      }
    );

    //sign in
    let signInView = null;
    this.signInButton.onclick = function () {
      if (signInView) return;
      if (signUpView) {
        signUpView.dispose();
        signUpView = null;
      }
      signInView = new SignInView(_this.webSocketService);
      document.body.appendChild(signInView.html());

      signInView.setOnClose(function () {
        signInView.dispose();
        signInView = null;
      });
    };

    this.webSocketService.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.SIGNED,
      function (data) {
        if (signInView) {
          signInView.dispose();
          signInView = null;
        }

        //update ui
        _this.nameUserLabel.innerHTML = data.nameUser;
        _this.roleUserLabel.innerHTML = data.role;
        //register values
        _this.userData = data;

        if (data.role == ImuvConstants.USER.ROLE.ADMIN) {
          _this.editorButton.classList.remove('hidden');
        } else {
          _this.editorButton.classList.add('hidden');
        }
      }
    );

    //editor
    this.editorButton.onclick = function () {
      _this.dispose();

      SystemUtils.File.loadJSON('./assets/config/config_editor.json').then(
        function (config) {
          _this.editor = new EditorView(_this.webSocketService, config);
          _this.editor.load().then(function () {
            document.body.appendChild(_this.editor.html());

            _this.editor.setOnClose(function () {
              _this.editor.dispose();
              document.body.appendChild(_this.html());
            });
          });
        }
      );
    };
  }

  html() {
    return this.rootHtml;
  }
}
