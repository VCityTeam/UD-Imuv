export class GameObjectUI {
  constructor(go, obj) {
    this.rootElementUI = document.createElement('div');
    this.rootElementUI.classList.add('goUI_GOEditor');

    //UUID
    const uuidLabel = document.createElement('div');
    uuidLabel.innerHTML = go.getUUID();
    this.rootElementUI.appendChild(uuidLabel);

    //Name
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = go.getName();
    this.rootElementUI.appendChild(inputName);
  }

  getRootElementUI() {
    return this.rootElementUI;
  }
}
