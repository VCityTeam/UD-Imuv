/** @format */

import './MenuAuth.css';

import Constants from 'ud-viz/src/Game/Components/Constants';
import { AssetsManager } from 'ud-viz/src/Views/AssetsManager/AssetsManager';
import { SystemUtils } from 'ud-viz/src/Components/Components';
import { EditorView } from '../Editor/Editor';
import { DistantGame } from 'ud-viz/src/Templates/Templates';
export class MenuAuthView {
  constructor(webSocketService, configFeatures) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    this.webSocketService = webSocketService;
    this.confFeatures = configFeatures;

    this.childrenView = [];

    //html
    this.logoImuLabex = null;

    this.closeButton = null;

    this.parentButtons = null;
    this.signUpButton = null;
    this.signInButton = null;
    this.guestButton = null;
    this.editorButton = null;
    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  initUI() {
    this.logoImuLabex = document.createElement('img');
    this.logoImuLabex.classList.add('logo_MenuAuth');
    this.logoImuLabex.src = './assets/img/labex_imu.jpeg';
    this.rootHtml.appendChild(this.logoImuLabex);

    //SIGN
    const parentSign = document.createElement('div');
    parentSign.classList.add('parent_sign_MenuAuth');
    this.rootHtml.appendChild(parentSign);

    this.signUpButton = document.createElement('div');
    this.signUpButton.innerHTML = 'Créer votre compte';
    this.signUpButton.classList.add('sign_button_MenuAuth');
    parentSign.appendChild(this.signUpButton);

    this.signInButton = document.createElement('div');
    this.signInButton.innerHTML = 'J ai déja un compte';
    this.signInButton.classList.add('sign_button_MenuAuth');
    parentSign.appendChild(this.signInButton);

    //BUTTONS
    this.parentButtons = document.createElement('div');
    this.parentButtons.classList.add('parentButtons_MenuAuth');
    this.rootHtml.appendChild(this.parentButtons);

    this.guestButton = document.createElement('div');
    this.guestButton.innerHTML = 'Je suis invité';
    this.guestButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.guestButton);

    this.editorButton = document.createElement('div');
    this.editorButton.innerHTML = 'Editeur';
    this.editorButton.classList.add('button_pink_MenuAuth');
    if (!this.confFeatures.editor) {
      this.editorButton.disabled = true;
      this.editorButton.classList.add('button_MenuAuth_disabled');
    }
    this.parentButtons.appendChild(this.editorButton);

    this.closeButton = document.createElement('div');
    this.closeButton.innerHTML = 'Retour';
    this.closeButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.closeButton);
  }

  initCallbacks() {
    const _this = this;

    this.signUpButton.onclick = function () {
      _this.parentButtons.remove();
      const signUpView = new SignUpView(_this.webSocketService);
      document.body.appendChild(signUpView.html());

      _this.childrenView.push(signUpView);

      signUpView.setOnClose(function () {
        signUpView.dispose();
        _this.rootHtml.appendChild(_this.parentButtons);

        const i = _this.childrenView.indexOf(signUpView);
        _this.childrenView.splice(i, 1);
      });
    };

    this.signInButton.onclick = function () {
      _this.parentButtons.remove();
      const signInView = new SignInView(_this.webSocketService);
      document.body.appendChild(signInView.html());

      _this.childrenView.push(signInView);

      signInView.setOnClose(function () {
        signInView.dispose();
        _this.rootHtml.appendChild(_this.parentButtons);

        const i = _this.childrenView.indexOf(signInView);
        _this.childrenView.splice(i, 1);
      });
    };

    this.guestButton.onclick = function () {
      _this.webSocketService.emit(
        Constants.WEBSOCKET.MSG_TYPES.GUEST_CONNECTION,
        null
      );
    };

    this.webSocketService.on(
      Constants.WEBSOCKET.MSG_TYPES.SIGNED,
      function (initialized, isGuest) {
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

                distantGame.start({
                  firstGameView: true,
                  isGuest: isGuest,
                  editorMode: false,
                });

                //app is loaded and ready to receive worldstate
                _this.webSocketService.emit(
                  Constants.WEBSOCKET.MSG_TYPES.READY_TO_RECEIVE_STATE
                );
              });
          }
        );
      }
    );

    this.editorButton.onclick = function () {
      if (this.disabled) return;

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

  dispose() {
    this.rootHtml.remove();
    this.childrenView.forEach(function (c) {
      c.dispose();
    });
  }

  html() {
    return this.rootHtml;
  }
}

//Helper
const createInput = function (name, root, type = 'text') {
  const parent = document.createElement('div');
  parent.classList.add('parentInput_MenuAuth');
  root.appendChild(parent);

  const labelInputNameUser = document.createElement('div');
  labelInputNameUser.innerHTML = name;
  parent.appendChild(labelInputNameUser);

  const ref = document.createElement('input');
  ref.classList.add('input_MenuAuth');
  ref.type = type;
  parent.appendChild(ref);
  return ref;
};

class SignUpView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.closeButton = null;
    this.inputNameUser = null;
    this.inputMail = null;
    this.inputMailConfirm = null;
    this.inputPassword = null;
    this.signUpButton = null;

    this.webSocketService = webSocketService;

    this.init();
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('close_MenuAuth');
    this.rootHtml.appendChild(this.closeButton);

    const parentInputs = document.createElement('div');
    parentInputs.classList.add('parentCentered_MenuAuth');
    this.rootHtml.appendChild(parentInputs);

    this.inputNameUser = createInput('Nom d utilisateur', parentInputs);
    this.inputMail = createInput('Mail', parentInputs);
    this.inputMailConfirm = createInput('Confirmez mail', parentInputs);
    this.inputPassword = createInput('Mot de passe', parentInputs, 'password');

    this.signUpButton = document.createElement('div');
    this.signUpButton.classList.add('button_MenuAuth');
    this.signUpButton.innerHTML = 'Créer compte';
    parentInputs.appendChild(this.signUpButton);
  }

  initCallbacks() {
    const _this = this;

    this.signUpButton.onclick = function () {
      const email = _this.inputMail.value;
      const confirmEmail = _this.inputMailConfirm.value;
      const password = _this.inputPassword.value;
      const nameUser = _this.inputNameUser.value;

      if (email != confirmEmail) {
        alert('email are not the same');
        return;
      }

      _this.webSocketService.emit(Constants.WEBSOCKET.MSG_TYPES.SIGN_UP, {
        email: email,
        password: password, //TODO Iam sure this is safe (if send with protocol wss ok apparently)
        nameUser: nameUser,
      });
    };
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}

class SignInView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.closeButton = null;
    this.inputIdUser = null;
    this.inputPassword = null;
    this.signInButton = null;

    this.webSocketService = webSocketService;

    this.init();
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('close_MenuAuth');
    this.rootHtml.appendChild(this.closeButton);

    const parentCentered = document.createElement('div');
    parentCentered.classList.add('parentCentered_MenuAuth');
    this.rootHtml.appendChild(parentCentered);

    this.inputIdUser = createInput('Nom d utilisateur / email', parentCentered);
    this.inputPassword = createInput(
      'Mot de passe',
      parentCentered,
      'password'
    );

    this.signInButton = document.createElement('div');
    this.signInButton.classList.add('button_MenuAuth');
    this.signInButton.innerHTML = 'Connexion';
    parentCentered.appendChild(this.signInButton);
  }

  initCallbacks() {
    const _this = this;

    this.signInButton.onclick = function () {
      const nameUser = _this.inputIdUser.value;
      const password = _this.inputPassword.value;

      _this.webSocketService.emit(Constants.WEBSOCKET.MSG_TYPES.SIGN_IN, {
        nameUser: nameUser,
        password: password, //TODO Iam sure this is safe (if send with protocol wss ok apparently)
      });
    };
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}
