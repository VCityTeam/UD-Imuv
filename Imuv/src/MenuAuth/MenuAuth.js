/** @format */

import './MenuAuth.css';

import firebase from 'firebase/app';
import 'firebase/auth';

import { GameApp } from '../GameApp';

export class MenuAuthView {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.backgroundImg = null;
    this.logoImuLabex = null;

    this.closeButton = null;

    this.parentButtons = null;
    this.signUpButton = null;
    this.signInButton = null;
    this.guestButton = null;
    this.generalConditionsButton = null;
    this.confidentialButton = null;

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
    this.backgroundImg = document.createElement('img');
    this.backgroundImg.classList.add('background_MenuAuth');
    this.backgroundImg.src = './assets/img/menuAuthBG.jpg';
    this.rootHtml.appendChild(this.backgroundImg);

    this.logoImuLabex = document.createElement('img');
    this.logoImuLabex.classList.add('logo_MenuAuth');
    this.logoImuLabex.src = './assets/img/labex_imu.jpeg';
    this.rootHtml.appendChild(this.logoImuLabex);

    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('close_MenuAuth');
    this.rootHtml.appendChild(this.closeButton);

    //BUTTONS
    this.parentButtons = document.createElement('div');
    this.parentButtons.classList.add('parentButtons_MenuAuth');
    this.rootHtml.appendChild(this.parentButtons);

    this.signUpButton = document.createElement('div');
    this.signUpButton.innerHTML = 'Créer votre compte';
    this.signUpButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.signUpButton);

    this.signInButton = document.createElement('div');
    this.signInButton.innerHTML = "J'ai déja un compte";
    this.signInButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.signInButton);

    this.guestButton = document.createElement('div');
    this.guestButton.innerHTML = 'Je suis invité';
    this.guestButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.guestButton);

    this.generalConditionsButton = document.createElement('div');
    this.generalConditionsButton.innerHTML = 'Conditions générales';
    this.generalConditionsButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.generalConditionsButton);

    this.confidentialButton = document.createElement('div');
    this.confidentialButton.innerHTML = 'Confidentialité';
    this.confidentialButton.classList.add('button_pink_MenuAuth');
    this.parentButtons.appendChild(this.confidentialButton);
  }

  initCallbacks() {
    const _this = this;

    this.signUpButton.onclick = function () {
      _this.parentButtons.remove();
      const signUpView = new SignUpView();
      document.body.appendChild(signUpView.html());

      signUpView.setOnClose(function () {
        signUpView.dispose();
        _this.rootHtml.appendChild(_this.parentButtons);
      });
    };

    this.signInButton.onclick = function () {
      _this.parentButtons.remove();
      const signInView = new SignInView();
      document.body.appendChild(signInView.html());

      signInView.setOnClose(function () {
        signInView.dispose();
        _this.rootHtml.appendChild(_this.parentButtons);
      });
    };

    this.confidentialButton.onclick = function () {
      _this.dispose();
      const gameApp = new GameApp();
      gameApp.start('./assets/config/config.json');
    };
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}

//Helper TODO mettre code ailleurs ?
const createInput = function (name, root, type = 'text') {
  const parent = document.createElement('div');
  parent.classList.add('parentInput_MenuAuth');
  root.appendChild(parent);

  const labelInputNameUser = document.createElement('div');
  labelInputNameUser.innerHTML = name;
  parent.appendChild(labelInputNameUser);

  const ref = document.createElement('input');
  ref.type = type;
  parent.appendChild(ref);
  return ref;
};

class SignUpView {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.closeButton = null;
    this.inputNameUser = null;
    this.inputMail = null;
    this.inputMailConfirm = null;
    this.inputPassword = null;
    this.signUpButton = null;

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
    parentInputs.classList.add('parentInputs_MenuAuth');
    this.rootHtml.appendChild(parentInputs);

    this.inputNameUser = createInput(
      "Nom d'utilisateur (not implemented)",
      parentInputs
    );
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
      const password = _this.inputPassword.value;

      console.log('Sign up');

      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log('connected to firebase');
          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          alert(errorMessage);
          // ..
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
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.closeButton = null;
    this.inputMail = null;
    this.inputPassword = null;
    this.signInButton = null;

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

    this.inputMail = createInput('Mail', parentCentered);
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
      const email = _this.inputMail.value;
      const password = _this.inputPassword.value;

      console.log('Sign in');

      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          let user = userCredential.user;
          console.log('connected to firebase');
          // ...
        })
        .catch((error) => {
          let errorCode = error.code;
          let errorMessage = error.message;
          alert(errorMessage);
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
