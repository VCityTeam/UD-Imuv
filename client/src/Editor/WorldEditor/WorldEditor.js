/** @format */

import './WorldEditor.css';
import { TransformEditorView } from '../TransformEditor/TransformEditor';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';

export class WorldEditorView {
  constructor(parentEV, config) {
    this.parentEV = parentEV;
    this.config = config;

    this.rootHtml = this.parentEV.rootHtml;
    this.currentWorld = this.parentEV.model.getCurrentWorld();

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_WorldEditor');
    this.rootHtml.appendChild(this.ui);

    this.gameView = null ;

    this.closeButton = null;

    this.toolsButtons = document.createElement('ul');
    this.toolsButtons.classList.add('ul_WorldEditor');

    this.transformButton = null;
    this.colliderButton = null;
    this.heightmapButton = null;
    this.addObjectButton = null;

    this.labelCurrentWorld = null;
    this.toolsList = null;
    this.initUI();
    this.initCallbacks();
  }


  initUI() {
    const labelCurrentWorld = document.createElement('p');
    labelCurrentWorld.innerHTML = this.currentWorld.getName() + ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const transformButton = document.createElement('li');
    transformButton.classList.add('li_Editor');
    transformButton.innerHTML = 'Transform';
    this.toolsButtons.appendChild(transformButton);
    this.transformButton = transformButton;

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    this.toolsButtons.appendChild(colliderButton);
    this.colliderButton = colliderButton;

    const heightmapButton = document.createElement('li');
    heightmapButton.classList.add('li_Editor');
    heightmapButton.innerHTML = 'Heightmap';
    this.toolsButtons.appendChild(heightmapButton);
    this.heightmapButton = heightmapButton;

    const addObjectButton = document.createElement('li');
    addObjectButton.classList.add('li_Editor');
    addObjectButton.innerHTML = 'Add Object';
    this.toolsButtons.appendChild(addObjectButton);
    this.addObjectButton = addObjectButton;

    this.ui.appendChild(this.toolsButtons);
  }

  initCallbacks() {
    const _this = this;

    _this.colliderButton.onclick = function () {

      const CEV = new ColliderEditorView(_this);
      CEV.setOnClose(function () {
        CEV.dispose();
        _this.rootHtml.appendChild(_this.ui);
      });
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
