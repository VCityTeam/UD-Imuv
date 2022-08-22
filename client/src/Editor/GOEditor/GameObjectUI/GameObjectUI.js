import { GameObject } from 'ud-viz/src/Game/Game';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';
import { LocalScriptDisplayMediaUI } from './LocalScriptDisplayMediaUI';
import { LocalScriptGeoProjectUI } from './LocalScriptGeoProjectUI';
import { LocalScriptImageUI } from './LocalScriptImageUI';
import { LocalScriptSignageDisplayerUI } from './LocalScriptSignageDisplayerUI';
import { LocalScriptJitsiAreaUI } from './LocalScriptJitsiAreaUI';
import { WorldScriptPortalUI } from './WorldScriptPortalUI';
import { WorldScriptTeleporterUI } from './WorldScriptTeleporterUI';

export class GameObjectUI {
  constructor(go, obj, goEditor) {
    this.go = go;
    this.goEditor = goEditor;
    this.rootElementUI = document.createElement('div');
    this.rootElementUI.classList.add('goUI_GOEditor');

    this.cEV = null;

    this.initBaseUI(go, obj, goEditor);
  }

  dispose() {
    if (this.cEV) this.cEV.dispose();
    this.cEV = null;
    this.rootElementUI.remove();
  }

  /**
   * Create a UI for the GameObject
   * @param go - the GameObject that is being edited
   * @param obj - the object3D that is being edited
   * @param goEditor - the GameObjectEditorView instance
   * @returns Nothing.
   */
  initBaseUI(go, obj, goEditor) {
    //UUID
    const uuidLabel = document.createElement('div');
    uuidLabel.innerHTML = go.getUUID();
    this.rootElementUI.appendChild(uuidLabel);

    //Name
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = go.getName();
    this.rootElementUI.appendChild(inputName);

    inputName.onchange = function () {
      go.setName(inputName.value);
      goEditor.updateUI();
    };

    //Transfom UI
    const cbOnChange = function () {
      go.setTransformFromObject3D(obj);
    };

    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'Translate';
    translateButton.classList.add('button_Editor');
    this.rootElementUI.appendChild(translateButton);

    translateButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('translate');
    };

    const vec3InputPosition = this.createInputFromVector3(
      obj.position,
      cbOnChange
    );

    this.rootElementUI.appendChild(vec3InputPosition);

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    this.rootElementUI.appendChild(rotateButton);

    rotateButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('rotate');
    };

    const vec3InputRotation = this.createInputFromVector3(
      obj.rotation,
      cbOnChange
    );
    this.rootElementUI.appendChild(vec3InputRotation);

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    this.rootElementUI.appendChild(scaleButton);

    scaleButton.onclick = function () {
      goEditor.gameView.getTransformControls().setMode('scale');
    };

    const vec3InputScale = this.createInputFromVector3(obj.scale, cbOnChange);

    this.rootElementUI.appendChild(vec3InputScale);

    //clone
    const cloneButton = document.createElement('div');
    cloneButton.classList.add('button_Editor');
    cloneButton.innerHTML = 'Clone';
    this.rootElementUI.appendChild(cloneButton);

    cloneButton.onclick = function () {
      const clone = GameObject.deepCopy(go);
      goEditor.parentView.addGameObject(clone, function () {
        goEditor.setSelectedGOWithObject3D(
          goEditor.computeObject3D(clone.getUUID())
        );
      });
    };

    this.content = document.createElement('div');
    this.rootElementUI.appendChild(this.content);

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    this.rootElementUI.appendChild(deleteButton);

    deleteButton.onclick = function () {
      goEditor.setSelectedGOWithObject3D(null);
      go.removeFromParent();
      goEditor.gameView.forceUpdate();
      goEditor.updateUI();
    };

    const ulButtons = document.createElement('ul');
    ulButtons.classList.add('ul_Editor');
    this.rootElementUI.appendChild(ulButtons);

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    ulButtons.appendChild(colliderButton);

    const rootHtml = this.rootElementUI;

    const _this = this;
    colliderButton.onclick = function () {
      if (!goEditor.getSelectedGO()) {
        console.error('not GO selected');
        return;
      }
      if (_this.cEV) return;
      _this.cEV = new ColliderEditorView({
        goEditor: goEditor,
        rootHtml: rootHtml,
      });

      _this.cEV.setOnClose(
        function () {
          _this.cEV.dispose();
          _this.cEV = null;
          this.initPointerUpCallback();
          this.setSelectedGOWithObject3D(
            this.computeObject3D(this.getSelectedGO().getUUID())
          );
        }.bind(goEditor)
      );
    };
  }

  /**
   * Create a div element with 3 input elements inside, each of which is a number input element
   * @param vec3 - The vector to create the input for.
   * @param [cbSetFunc=null] - A callback function that is called when the user changes the value of
   * the input.
   * @returns The inputVector3 element.
   */
  createInputFromVector3(vec3, cbSetFunc = null) {
    const inputVector3 = document.createElement('div');

    for (let iInput = 0; iInput < 3; iInput++) {
      let component = iInput === 0 ? vec3.x : iInput === 1 ? vec3.y : vec3.z;
      const componentElement = document.createElement('input');
      componentElement.type = 'number';
      componentElement.value = component;
      componentElement.step = 0.1;
      inputVector3.appendChild(componentElement);

      componentElement.onchange = function () {
        const value = parseFloat(componentElement.value);
        vec3.x = iInput === 0 ? value : vec3.x;
        vec3.y = iInput === 1 ? value : vec3.y;
        vec3.z = iInput === 2 ? value : vec3.z;
        if (cbSetFunc) cbSetFunc();
      };
    }

    return inputVector3;
  }

  getRootElementUI() {
    return this.rootElementUI;
  }

  appendLSImageUI(gV) {
    new LocalScriptImageUI(this.go, this.content, gV);
  }

  appendLSSignageDisplayerUI(gV) {
    new LocalScriptSignageDisplayerUI(this, gV);
  }

  appendWSPortalUI(wS, gV) {
    new WorldScriptPortalUI(this, wS, gV);
  }

  appendWSTeleporterUI(wS) {
    new WorldScriptTeleporterUI(this, wS);
  }

  appendLSDisplayMediaUI() {
    new LocalScriptDisplayMediaUI(this);
  }

  appendLSJitsiAreaUI() {
    new LocalScriptJitsiAreaUI(this);
  }

  appendLSGeoProjectUI(gV) {
    new LocalScriptGeoProjectUI(this, gV);
  }
}
