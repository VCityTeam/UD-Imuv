/** @format */

import './Sign.css';

import { Constant } from '@ud-imuv/shared';

//Helper
const createInput = function (name, root, type = 'text') {
  const parent = document.createElement('div');
  parent.classList.add('parentInput_Sign');
  root.appendChild(parent);

  const labelInputNameUser = document.createElement('div');
  labelInputNameUser.innerHTML = name;
  parent.appendChild(labelInputNameUser);

  const ref = document.createElement('input');
  ref.classList.add('input_Sign');
  ref.type = type;
  parent.appendChild(ref);
  return ref;
};

export class SignUpView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Sign');

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
    const parentInputs = document.createElement('div');
    parentInputs.classList.add('parentCentered_Sign');
    this.rootHtml.appendChild(parentInputs);

    this.inputNameUser = createInput('Nom d utilisateur', parentInputs);
    this.inputMail = createInput('Mail', parentInputs);
    this.inputMailConfirm = createInput('Confirmez mail', parentInputs);
    this.inputPassword = createInput('Mot de passe', parentInputs, 'password');

    this.signUpButton = document.createElement('div');
    this.signUpButton.classList.add('button_Sign');
    this.signUpButton.innerHTML = 'Créer compte';
    parentInputs.appendChild(this.signUpButton);

    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Sign');
    this.closeButton.innerHTML = 'Retour';
    parentInputs.appendChild(this.closeButton);
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

      _this.webSocketService.emit(Constant.WEBSOCKET.MSG_TYPES.SIGN_UP, {
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

export class SignInView {
  constructor(webSocketService) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Sign');

    //html
    this.inputIdUser = null;
    this.inputPassword = null;
    this.signInButton = null;
    this.parentCentered = null;

    this.webSocketService = webSocketService;

    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    const parentCentered = document.createElement('div');
    parentCentered.classList.add('parentCentered_Sign');
    this.parentCentered = parentCentered;
    this.rootHtml.appendChild(parentCentered);

    this.inputIdUser = createInput('Nom d utilisateur / email', parentCentered);
    this.inputPassword = createInput(
      'Mot de passe',
      parentCentered,
      'password'
    );

    this.signInButton = document.createElement('div');
    this.signInButton.classList.add('button_Sign');
    this.signInButton.innerHTML = 'Connexion';
    parentCentered.appendChild(this.signInButton);
  }

  initCallbacks() {
    const _this = this;

    this.signInButton.onclick = function () {
      const nameUser = _this.inputIdUser.value;
      const password = _this.inputPassword.value;

      _this.webSocketService.emit(Constant.WEBSOCKET.MSG_TYPES.SIGN_IN, {
        nameUser: nameUser,
        password: password,
      });
    };
  }

  addButton(label, cb) {
    const button = document.createElement('div');
    button.classList.add('button_Sign');
    button.innerHTML = label;
    this.parentCentered.appendChild(button);

    button.onclick = cb;
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}
