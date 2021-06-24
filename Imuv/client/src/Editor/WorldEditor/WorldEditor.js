/** @format */

import './WorldEditor.css';

export class WorldEditorView {
  constructor(parent, config) {
    this.parent = parent;
    this.config = config;

    this.rootHtml = this.parent.rootHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_WorldEditor');
    this.rootHtml.appendChild(this.ui);

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
  }
  
  disposeUI() {
    this.ui.remove();
  }
  
  initUI() {
    this.labelCurrentWorld = document.createElement('p');
    this.labelCurrentWorld.innerHTML =
    this.parent.model.getCurrentWorld().getName() + ' :';
    this.ui.appendChild(this.labelCurrentWorld);
    
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

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
