import './style.css';

import { request } from '../utils';
import { API } from '../../shared/constant';

// Helper
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
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_Sign');

    // html
    this.closeButton = null;
    this.inputNameUser = null;
    this.inputMail = null;
    this.inputMailConfirm = null;
    this.inputPassword = null;
    this.signUpButton = null;

    this.initUI();
    this.initCallbacks();
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  initUI() {
    const parentInputs = document.createElement('div');
    parentInputs.classList.add('parentCentered_Sign');
    this.domElement.appendChild(parentInputs);

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
    this.signUpButton.onclick = () => {
      const email = this.inputMail.value;
      const confirmEmail = this.inputMailConfirm.value;
      const password = this.inputPassword.value;
      const nameUser = this.inputNameUser.value;

      if (email != confirmEmail) {
        alert('email are not the same');
        return;
      }

      request(API.SIGN_IN, {
        email: email,
        password: password, // TODO Iam sure this is safe (if send with protocol wss ok apparently)
        nameUser: nameUser,
      });
    };
  }
}

export class SignInView {
  constructor(socketIOWrapper) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_Sign');

    // html
    this.inputIdUser = null;
    this.inputPassword = null;
    this.signInButton = null;
    this.parentCentered = null;

    this.socketIOWrapper = socketIOWrapper;

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
    this.domElement.appendChild(parentCentered);

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

      _this.socketIOWrapper.emit(Constant.WEBSOCKET.MSG_TYPE.SIGN_IN, {
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
    this.domElement.remove();
  }

  html() {
    return this.domElement;
  }
}

const signUpView = new SignUpView();
const signInView = new SignInView();

document.body.appendChild(signUpView.domElement);
