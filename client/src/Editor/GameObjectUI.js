import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import { GameObject, World } from 'ud-viz/src/Game/Shared/Shared';
import File from 'ud-viz/src/Components/SystemUtils/File';
import { ColliderEditorView } from './ColliderEditor/ColliderEditor';

export class GameObjectUI {
  constructor(go, obj, goEditor) {
    this.obj = obj;
    this.go = go;

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
        goEditor.setSelectedGO(clone.getUUID());
      });
    };

    this.content = document.createElement('div');
    this.rootElementUI.appendChild(this.content);

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    this.rootElementUI.appendChild(deleteButton);

    deleteButton.onclick = function () {
      goEditor.setSelectedGO(null);
      go.removeFromParent();
      goEditor.gameView.forceUpdate();
    };

    const ulButtons = document.createElement('ul');
    ulButtons.classList.add('ul_Editor');
    this.rootElementUI.appendChild(ulButtons);

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    ulButtons.appendChild(colliderButton);

    const rootHtml = this.rootElementUI;
    let cEV = null;
    colliderButton.onclick = function () {
      if (!goEditor.getSelectedGO()) {
        console.error('not GO selected');
        return;
      }
      if (cEV) return;
      cEV = new ColliderEditorView({
        goEditor: goEditor,
        rootHtml : rootHtml
      });

      cEV.setOnClose(function () {
        cEV.dispose();
        cEV = null;
        this.initCallbacks();
        this.setSelectedGO(
          this.computeObject3D(this.getSelectedGO().getUUID())
        );
      }.bind(goEditor));
      
    };
  }

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
        vec3.set(
          iInput === 0 ? value : vec3.x,
          iInput === 1 ? value : vec3.y,
          iInput === 2 ? value : vec3.z
        );
        if (cbSetFunc) cbSetFunc();
      };
    }

    return inputVector3;
  }

  getRootElementUI() {
    return this.rootElementUI;
  }

  appendLSImageUI(gV) {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    this.content.appendChild(imageInput);

    const go = this.go;
    imageInput.onchange = function (e) {
      File.readSingleFileAsDataUrl(e, function (data) {
        const url = data.target.result;
        go.components.LocalScript.conf.path = url;
        gV.forceUpdate();
      });
    };
  }

  appendWSPortalUI(wS, gV) {
    const portalInput = document.createElement('div');

    //spawn rot input
    const refSpawnRot = wS['portal'].conf.spawnRotation;
    if (!refSpawnRot) throw new Error('no spawn rotation');

    const labelSpawnRot = document.createElement('div');
    labelSpawnRot.innerHTML = 'Portal spawn rotation';
    portalInput.appendChild(labelSpawnRot);

    const cbOnChange = function (iInput, setVec3) {
      const value = parse(this.value);
      setVec3(
        iInput == 0 ? value : null,
        iInput == 1 ? value : null,
        iInput == 2 ? value : null
      );
    };

    portalInput.appendChild(this.createInputFromVector3(refSpawnRot));

    //world uuid
    const worldsJSON = gV.getAssetsManager().getWorldsJSON();
    const wCxt = gV.getInterpolator().getWorldContext();
    const currentWorld = wCxt.getWorld();
    //replace current world json because it can be modified
    for (let index = 0; index < worldsJSON.length; index++) {
      const json = worldsJSON[index];
      if (json.uuid == currentWorld.getUUID()) {
        //found
        const newContent = currentWorld.toJSON();
        worldsJSON[index] = newContent;
        break;
      }
    }

    const labelWorlds = document.createElement('div');
    labelWorlds.innerHTML = 'World Destination';
    portalInput.appendChild(labelWorlds);

    const selectPortal = document.createElement('select');
    portalInput.appendChild(selectPortal);

    const createPortalsOptions = function (optGrp, wjson) {
      const worldPortal = new World(wjson);
      worldPortal.getGameObject().traverse(function (child) {
        const wS = child.getComponent(WorldScriptModule.TYPE);
        if (wS && wS.idScripts.includes('portal')) {
          const optionPortal = document.createElement('option');
          optionPortal.value = child.uuid;
          optionPortal.innerHTML = child.name;
          optGrp.appendChild(optionPortal);
        }
      });
    };

    const unsetOptionPortal = document.createElement('option');
    unsetOptionPortal.value = 'null';
    unsetOptionPortal.innerHTML = 'None';
    selectPortal.appendChild(unsetOptionPortal);

    //Fill selectPortal Htmlelements
    worldsJSON.forEach(function (wjson) {
      const optGroup = document.createElement('optgroup');
      optGroup.title = wjson.uuid;
      optGroup.label = wjson.name;
      selectPortal.appendChild(optGroup);
      createPortalsOptions(optGroup, wjson);
    });

    selectPortal.onchange = function () {
      const options = selectPortal.getElementsByTagName('option');
      const iSelect = selectPortal.selectedIndex;
      const optionSelected = options[iSelect];

      wS['portal'].conf.worldDestUUID =
        iSelect !== 0 ? optionSelected.parentElement.title : null;
      wS['portal'].conf.portalUUID = selectPortal.value;
    };

    //select right value
    const currentPortalValue = wS['portal'].conf.portalUUID;
    const options = selectPortal.getElementsByTagName('option');
    for (var i = 0; i < options.length; i++) {
      if (options[i].value == currentPortalValue) {
        options[i].selected = true;
        selectPortal.dispatchEvent(new Event('change'));
        break;
      }
    }

    this.content.appendChild(portalInput);
  }

  appendWSTeleporterUI(wS) {
    const teleporterInput = document.createElement('div');
    const refDestinationTransform = wS['teleporter'].conf.destinationTransform;
    if (!refDestinationTransform) throw new Error('no dest transform');

    const labelDesT = document.createElement('div');
    labelDesT.innerHTML = 'Teleporter destination transform';
    teleporterInput.appendChild(labelDesT);

    const cbOnChange = function (iInput, setVec3) {
      const value = parse(this.value);
      setVec3(
        iInput == 0 ? value : null,
        iInput == 1 ? value : null,
        iInput == 2 ? value : null
      );
    };

    const labelPosition = document.createElement('div');
    labelPosition.innerHTML = 'position';
    labelPosition.appendChild(
      this.createInputFromVector3(refDestinationTransform.position)
    );

    const labelRotation = document.createElement('div');
    labelRotation.innerHTML = 'rotation';
    labelRotation.appendChild(
      this.createInputFromVector3(refDestinationTransform.rotation)
    );

    teleporterInput.appendChild(labelPosition);
    this.content.appendChild(teleporterInput);
  }
}
