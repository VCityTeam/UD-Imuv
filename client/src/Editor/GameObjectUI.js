export class GameObjectUI {
  constructor(go, obj) {
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
    const onChangeCB = function (component) {
      component = parseFloat(this.value);
      if (isNaN(component)) component = 0;
      go.setTransformFromObject3D(obj);
    };

    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'Translate';
    translateButton.classList.add('button_Editor');
    this.rootElementUI.appendChild(translateButton);
    const positionVec3 = this.createInputVector3(obj['position'], onChangeCB);
    this.rootElementUI.appendChild(positionVec3);

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    this.rootElementUI.appendChild(rotateButton);

    this.rootElementUI.appendChild(
      this.createInputVector3(obj['rotation']),
      onChangeCB
    );

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    this.rootElementUI.appendChild(scaleButton);

    this.rootElementUI.appendChild(
      this.createInputVector3(obj['scale']),
      onChangeCB
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
  }

  createInputVector3(field, cb) {
    const inputVector3 = document.createElement('div');
    for (let iInput = 0; iInput < 3; iInput++) {
      let component = iInput === 0 ? field.x : iInput === 1 ? field.y : field.z;
      const componentElement = document.createElement('input');
      componentElement.type = 'number';
      componentElement.value = component;
      componentElement.step = 0.1;
      inputVector3.appendChild(componentElement);

      if (cb)
        componentElement.onchange = cb.bind(componentElement, component);
    }

    return inputVector3;
  }

  getRootElementUI() {
    return this.rootElementUI;
  }

  appendLSImageUI() {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    this.content.appendChild(imageInput);
  }

  appendWSPortalUI(wS) {
    constportalInput = document.createElement('div');

    //spawn rot input
    const refSpawnRot = wS['portal'].conf.spawnRotation;
    if (!refSpawnRot) throw new Error('no spawn rotation');

    const labelSpawnRot = document.createElement('div');
    labelSpawnRot.innerHTML = 'Portal spawn rotation';
    portalInput.appendChild(labelSpawnRot);

    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = refSpawnRot.x;
    xInput.step = 0.1;
    portalInput.appendChild(xInput);

    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = refSpawnRot.y;
    yInput.step = 0.1;
    portalInput.appendChild(yInput);

    const zInput = document.createElement('input');
    zInput.type = 'number';
    zInput.value = refSpawnRot.z;
    zInput.step = 0.1;
    portalInput.appendChild(zInput);

    xInput.onchange = function () {
      refSpawnRot.x = xInput.value;
    };

    yInput.onchange = function () {
      refSpawnRot.y = yInput.value;
    };

    zInput.onchange = function () {
      refSpawnRot.z = zInput.value;
    };

    //world uuid
    const worldsJSON = this.gameView.getAssetsManager().getWorldsJSON();
    const wCxt = this.gameView.getInterpolator().getWorldContext();
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

    selectWorldUUID = document.createElement('select');
    selectWorldUUID.multiple = false;
    portalInput.appendChild(selectWorldUUID);

    const unsetOption = document.createElement('option');
    unsetOption.value = 'null';
    unsetOption.innerHTML = 'None';
    selectWorldUUID.appendChild(unsetOption);

    worldsJSON.forEach(function (wjson) {
      const optionWorld = document.createElement('option');
      optionWorld.value = wjson.uuid;
      optionWorld.innerHTML = wjson.name;
      selectWorldUUID.appendChild(optionWorld);
    });

    //select option in a select html
    const selectOption = function (select, value) {
      let found = false;

      if (value === null) value = 'null'; //dynamic cast

      // console.log('value param ', value);
      for (let index = 0; index < select.children.length; index++) {
        const o = select.children[index];
        const optValue = o.value;
        // console.log('opt value ', optValue);
        if (optValue == value) {
          o.selected = true;
          found = true;
          break;
        } else {
          o.selected = false;
        }
      }

      if (!found) {
        //select null option
        selectOption(select, null);
      }
    };

    //select right value
    const currentWorldValue = worldScripts['portal'].conf.worldDestUUID;
    selectOption(selectWorldUUID, currentWorldValue);

    //portal uuid
    let worldPortal;
    worldsJSON.forEach(function (wjson) {
      if (wjson.uuid == selectWorldUUID.selectedOptions[0].value) {
        worldPortal = new World(wjson);
      }
    });

    selectPortalUUID = document.createElement('select');
    selectPortalUUID.multiple = false;
    portalInput.appendChild(selectPortalUUID);

    const unsetOptionPortal = document.createElement('option');
    unsetOptionPortal.value = 'null';
    unsetOptionPortal.innerHTML = 'None';
    selectPortalUUID.appendChild(unsetOptionPortal);

    //add option portal
    if (worldPortal) {
      worldPortal.getGameObject().traverse(function (child) {
        const s = child.getComponent(WorldScriptModule.TYPE); //this way because assets are not initialized
        if (s && s.idScripts.includes('portal')) {
          const optionPortal = document.createElement('option');
          optionPortal.value = child.getUUID();
          optionPortal.innerHTML = child.getName();
          selectPortalUUID.appendChild(optionPortal);
        }
      });
    }

    //select right value
    const currentPortalValue = worldScripts['portal'].conf.portalUUID;
    selectOption(selectPortalUUID, currentPortalValue);

    result.appendChild(portalInput);
  }
}
