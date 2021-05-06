/** @format */

import './MenuAuth.css';

export class MenuAuthView {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.backgroundImg = null;
    this.logoImuLabex = null;
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

  initUI() {
    this.backgroundImg = document.createElement('img');
    this.backgroundImg.classList.add('background_MenuAuth');
    this.backgroundImg.src = './assets/img/menuAuthBG.jpg';
    this.rootHtml.appendChild(this.backgroundImg);

    this.logoImuLabex = document.createElement('img');
    this.logoImuLabex.classList.add('logo_MenuAuth');
    this.logoImuLabex.src = './assets/img/labex_imu.jpeg';
    this.rootHtml.appendChild(this.logoImuLabex);

    this.parentButtons = document.createElement('div');
    this.parentButtons.classList.add('parentButtons_MenuAuth');
    this.rootHtml.appendChild(this.parentButtons);

    this.signUpButton = document.createElement('div');
    this.signUpButton.innerHTML = 'Créer votre compte';
    this.signUpButton.classList.add('button_MenuAuth');
    this.parentButtons.appendChild(this.signUpButton);

    this.signInButton = document.createElement('div');
    this.signInButton.innerHTML = "J'ai déja un compte";
    this.signInButton.classList.add('button_MenuAuth');
    this.parentButtons.appendChild(this.signInButton);

    this.guestButton = document.createElement('div');
    this.guestButton.innerHTML = 'Je suis invité';
    this.guestButton.classList.add('button_MenuAuth');
    this.parentButtons.appendChild(this.guestButton);

    this.generalConditionsButton = document.createElement('div');
    this.generalConditionsButton.innerHTML = 'Conditions générales';
    this.generalConditionsButton.classList.add('button_MenuAuth');
    this.parentButtons.appendChild(this.generalConditionsButton);

    this.confidentialButton = document.createElement('div');
    this.confidentialButton.innerHTML = 'Confidentialité';
    this.confidentialButton.classList.add('button_MenuAuth');
    this.parentButtons.appendChild(this.confidentialButton);
  }

  initCallbacks() {
    const _this = this;

    this.signUpButton.onclick = function () {
      _this.parentButtons.remove();
      const signUpView = new SignUpView();
      document.body.appendChild(signUpView.html());
    };
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}

class SignUpView {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAuth');

    //html
    this.inputNameUser = null;
    this.inputMail = null;
    this.inputMailConfirm = null;
    this.inputPassword = null;
    this.postButton = null;

    this.init();
  }

  init() {
    this.initUI();
    this.initCallbacks();
  }

  initUI() {
    const parentCentered = document.createElement('div');
    parentCentered.classList.add('parentCentered_MenuAuth');
    this.rootHtml.appendChild(parentCentered);

    const createInput = function (name, ref) {
      const parent = document.createElement('div');
      parent.classList.add('parentInput_MenuAuth');
      parentCentered.appendChild(parent);

      const labelInputNameUser = document.createElement('div');
      labelInputNameUser.innerHTML = name;
      parent.appendChild(labelInputNameUser);

      ref = document.createElement('input');
      ref.type = 'text';
      parent.appendChild(ref);
    };

    createInput("Nom d'utilisateur", this.inputNameUser);
    createInput('Mail', this.inputMail);
    createInput('Confirmez mail', this.inputMailConfirm);
    createInput('Mot de passe', this.inputPassword);

    this.postButton = document.createElement('div');
    this.postButton.classList.add('post_MenuAuth');
    this.postButton.innerHTML = 'Créer compte';
    parentCentered.appendChild(this.postButton);
  }

  initCallbacks() {
    this.postButton.onclick = function () {
      alert('post');
    };
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}
