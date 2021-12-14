import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import { GameObject, World } from 'ud-viz/src/Game/Shared/Shared';
import File from 'ud-viz/src/Components/SystemUtils/File';

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

    //Transfom UI
    const onChangeCB = function (iInput, setVec3) {
      const value = parseFloat(this.value);
      setVec3(
        iInput == 0 ? value : null,
        iInput == 1 ? value : null,
        iInput == 2 ? value : null
      );
      go.setTransformFromObject3D(obj);
    };

    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'Translate';
    translateButton.classList.add('button_Editor');
    this.rootElementUI.appendChild(translateButton);
    this.rootElementUI.appendChild(
      this.createInputVector3(obj.position, onChangeCB, function (x, y, z) {
        obj.position.set(
          x ? x : obj.position.x,
          y ? y : obj.position.y,
          z ? y : obj.position.y
        );
      })
    );

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    this.rootElementUI.appendChild(rotateButton);

    this.rootElementUI.appendChild(
      this.createInputVector3(obj['rotation'], onChangeCB, function (x, y, z) {
        obj.rotation.set(
          x ? x : obj.rotation.x,
          y ? y : obj.rotation.y,
          z ? y : obj.rotation.y
        );
      })
    );

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    this.rootElementUI.appendChild(scaleButton);

    this.rootElementUI.appendChild(
      this.createInputVector3(obj['scale'], onChangeCB, function (x, y, z) {
        obj.scale.set(
          x ? x : obj.scale.x,
          y ? y : obj.scale.y,
          z ? y : obj.scale.y
        );
      })
    );

    //clone
    const cloneButton = document.createElement('div');
    cloneButton.classList.add('button_Editor');
    cloneButton.innerHTML = 'Clone';
    this.rootElementUI.appendChild(cloneButton);

    this.content = document.createElement('div');
    this.rootElementUI.appendChild(this.content);

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    this.rootElementUI.appendChild(deleteButton);

    //BUTTONS CALLBACKS
    cloneButton.onclick = function () {
      const clone = GameObject.deepCopy(go);
      goEditor.parentView.addGameObject(clone, function () {
        goEditor.setSelectedGO(clone.getUUID());
      });
    };

    deleteButton.onclick = function () {
      goEditor.setSelectedGO(null);
      go.removeFromParent();
      goEditor.gameView.forceUpdate();
    };
  }

  createInputVector3(vec3, cbOnChange, setVec3) {
    const inputVector3 = document.createElement('div');
    for (let iInput = 0; iInput < 3; iInput++) {
      let component = iInput === 0 ? vec3.x : iInput === 1 ? vec3.y : vec3.z;
      const componentElement = document.createElement('input');
      componentElement.type = 'number';
      componentElement.value = component;
      componentElement.step = 0.1;
      inputVector3.appendChild(componentElement);

      if (cbOnChange)
        componentElement.onchange = cbOnChange.bind(
          componentElement,
          iInput,
          setVec3
        );
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

    portalInput.appendChild(
      this.createInputVector3(refSpawnRot, cbOnChange, function (x, y, z) {
        refSpawnRot.set(
          x ? x : refSpawnRot.x,
          y ? y : refSpawnRot.y,
          z ? y : refSpawnRot.y
        );
      })
    );

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
      this.createInputVector3(
        refDestinationTransform.position,
        cbOnChange,
        function (x, y, z) {
          refDestinationTransform.position.set(
            x ? x : refDestinationTransform.position.x,
            y ? y : refDestinationTransform.position.y,
            z ? y : refDestinationTransform.position.y
          );
        }
      )
    );

    const labelRotation = document.createElement('div');
    labelRotation.innerHTML = 'rotation';
    labelRotation.appendChild(
      this.createInputVector3(
        refDestinationTransform.rotation,
        cbOnChange,
        function (x, y, z) {
          refDestinationTransform.rotation.set(
            x ? x : refDestinationTransform.rotation.x,
            y ? y : refDestinationTransform.rotation.y,
            z ? y : refDestinationTransform.rotation.y
          );
        }
      )
    );

    teleporterInput.appendChild(labelPosition);
    this.content.appendChild(teleporterInput);
  }
}
