/** @format */

import './GOEditor.css';
import { THREE, TransformControls } from 'ud-viz';
import File from 'ud-viz/src/Components/SystemUtils/File';
import { GameObject, World } from 'ud-viz/src/Game/Shared/Shared';
import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import GameObjectModule from 'ud-viz/src/Game/Shared/GameObject/GameObject';

export class GOEditorView {
  constructor(params) {
    //html
    this.ui = document.createElement('div');
    this.ui.classList.add('root_GOEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.goList = null;
    this.goSelectedUI = null;

    //parentView
    this.parentView = params.parentView;

    //gameview
    this.gameView = params.gameView;

    this.orbitControls = params.orbitControls;

    //raycaster
    this.raycaster = new THREE.Raycaster();

    //controls
    this.transformControls = null;

    //listeners
    this.escListener = null;
    this.deleteListener = null;
    this.mouseDownListener = null;

    //go selected
    this.goSelected = null;

    this.initTransformControls();
    this.initUI();
    this.initCallbacks();
  }

  initTransformControls() {
    if (this.transformControls) this.transformControls.dispose();

    const camera = this.gameView.getItownsView().camera.camera3D;
    const scene = this.gameView.getItownsView().scene;
    const manager = this.gameView.getInputManager();
    const viewerDiv = this.gameView.rootItownsHtml;
    const canvas = this.gameView.getRenderer().domElement;
    canvas.style.zIndex = 1; //patch

    this.transformControls = new TransformControls(camera, canvas);
    scene.add(this.transformControls);

    const _this = this;

    //cant handle this callback with our input manager
    this.transformControls.addEventListener(
      'dragging-changed',
      function (event) {
        _this.orbitControls.enabled = !event.value;

        const gameViewGO = _this.gameView
          .getLastState()
          .getGameObject()
          .find(_this.goSelected.getUUID());

        _this.goSelected.setTransformFromGO(gameViewGO);

        //update go menu ui
        _this.setSelectedGO(_this.goSelected.getUUID());
      }
    );

    this.escListener = function () {
      _this.setSelectedGO(null);
    };

    this.deleteListener = function () {
      if (_this.transformControls.object) {
        const world = _this.gameView
          .getStateComputer()
          .getWorldContext()
          .getWorld();
        const go = world.getGameObject();
        const deletedGO = go.find(
          _this.transformControls.object.userData.gameObjectUUID
        );

        //TODO duplicate code with the delete button of the goUI

        deletedGO.removeFromParent();

        //force update gameview
        _this.gameView.forceUpdate();

        _this.updateUI();
      }
    };
    this.mouseDownListener = function (event) {
      if (_this.transformControls.object) return; //already assign to an object

      //1. sets the mouse position with a coordinate system where the center
      //   of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 +
          (2 * event.offsetX) /
            (canvas.clientWidth - parseInt(canvas.offsetLeft)),
        1 -
          (2 * event.offsetY) /
            (canvas.clientHeight - parseInt(canvas.offsetTop))
      );

      //2. set the picking ray from the camera position and mouse coordinates
      _this.raycaster.setFromCamera(mouse, camera);

      //3. compute intersections
      //TODO opti en enlevant la recursive et en selectionnant seulement les bon object3D
      const intersects = _this.raycaster.intersectObject(
        _this.gameView.getObject3D(),
        true
      );

      if (intersects.length) {
        let minDist = Infinity;
        let info = null;

        intersects.forEach(function (i) {
          if (i.distance < minDist) {
            info = i;
            minDist = i.distance;
          }
        });

        if (info) {
          const objectClicked = info.object;
          let current = objectClicked;
          while (!current.userData.gameObjectUUID) {
            if (!current.parent) {
              console.warn('didnt find gameobject uuid');
              current = null;
              break;
            }
            current = current.parent;
          }

          if (current) {
            _this.setSelectedGO(current.userData.gameObjectUUID);
          }
        }
      }
    };

    //CALLBACKS
    manager.addKeyInput('Delete', 'keydown', this.deleteListener);
    manager.addKeyInput('Escape', 'keydown', this.escListener);
    manager.addMouseInput(viewerDiv, 'pointerdown', this.mouseDownListener);
  }

  getSelectedGO() {
    return this.goSelected;
  }

  setSelectedGO(uuid) {
    const world = this.gameView.getStateComputer().getWorldContext().getWorld();
    const go = world.getGameObject();
    this.goSelected = go.find(uuid);

    //clean
    const parent = this.goSelectedUI;
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }

    if (this.goSelected) {
      //attach transform ctrl

      let object3D = this.computeObject3D(uuid);

      this.transformControls.attach(object3D);
      this.transformControls.updateMatrixWorld();
      this.goSelectedUI.appendChild(this.createGOUI(this.goSelected, object3D));
    } else {
      this.transformControls.detach();
    }
  }

  createGOUI(go, obj) {
    const result = document.createElement('div');
    result.classList.add('goUI_GOEditor');

    const uuidlabel = document.createElement('div');
    uuidlabel.innerHTML = go.getUUID();
    result.appendChild(uuidlabel);

    //name
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = go.getName();
    result.appendChild(inputName);

    const createInputVector3 = function (field) {
      const inputVector3 = document.createElement('div');

      const xInput = document.createElement('input');
      xInput.type = 'number';
      xInput.value = obj[field].x;
      xInput.step = 0.1;
      inputVector3.appendChild(xInput);

      const yInput = document.createElement('input');
      yInput.type = 'number';
      yInput.value = obj[field].y;
      yInput.step = 0.1;
      inputVector3.appendChild(yInput);

      const zInput = document.createElement('input');
      zInput.type = 'number';
      zInput.value = obj[field].z;
      zInput.step = 0.1;
      inputVector3.appendChild(zInput);

      xInput.onchange = function () {
        obj[field].x = xInput.value;
      };

      yInput.onchange = function () {
        obj[field].y = yInput.value;
      };

      zInput.onchange = function () {
        obj[field].z = zInput.value;
      };

      return inputVector3;
    };

    //transform mode
    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'translate';
    translateButton.classList.add('button_Editor');
    result.appendChild(translateButton);

    result.appendChild(createInputVector3('position'));

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    result.appendChild(rotateButton);

    result.appendChild(createInputVector3('rotation'));

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    result.appendChild(scaleButton);

    result.appendChild(createInputVector3('scale'));

    //clone
    const cloneButton = document.createElement('div');
    cloneButton.classList.add('button_Editor');
    cloneButton.innerHTML = 'Clone';
    result.appendChild(cloneButton);

    let imageInput = null;
    const localScripts = go.fetchLocalScripts();
    if (localScripts && localScripts['image']) {
      imageInput = document.createElement('input');
      imageInput.type = 'file';
      result.appendChild(imageInput);
    }

    let portalInput = null;
    let selectWorldUUID = null;
    let selectPortalUUID = null;
    const worldScripts = go.fetchWorldScripts();
    if (worldScripts && worldScripts['portal']) {
      portalInput = document.createElement('div');

      //spawn rot input
      {
        const refSpawnRot = worldScripts['portal'].conf.spawnRotation;
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
          refSpawnRot.y = xInput.value;
        };

        zInput.onchange = function () {
          refSpawnRot.z = xInput.value;
        };
      }

      //world uuid
      const worldsJSON = this.gameView.getAssetsManager().getWorldsJSON();
      const wCxt = this.gameView.getStateComputer().getWorldContext();
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

    //delete
    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    result.appendChild(deleteButton);

    //CALLBACKS
    const _this = this;

    cloneButton.onclick = function () {
      const clone = GameObject.deepCopy(go);
      _this.parentView.addGameObject(clone, function () {
        _this.setSelectedGO(clone.getUUID());
      });
    };

    if (portalInput) {
      const updatePortalUI = function () {
        const ws = go.fetchWorldScripts()['portal'];

        ws.conf.worldDestUUID =
          selectWorldUUID.children[selectWorldUUID.selectedIndex].value;
        ws.conf.portalUUID =
          selectPortalUUID.children[selectPortalUUID.selectedIndex].value;
        _this.updateUI();
      };

      selectPortalUUID.onchange = updatePortalUI.bind(_this);
      selectWorldUUID.onchange = updatePortalUI.bind(_this);
    }

    if (imageInput) {
      imageInput.onchange = function (e) {
        File.readSingleFileAsDataUrl(e, function (data) {
          const url = data.target.result;
          go.components.LocalScript.conf.path = url;
          _this.gameView.forceUpdate();
        });
      };
    }

    deleteButton.onclick = function () {
      go.removeFromParent();

      _this.gameView.forceUpdate();

      _this.updateUI();
    };

    translateButton.onclick = function () {
      _this.transformControls.setMode('translate');
    };

    rotateButton.onclick = function () {
      _this.transformControls.setMode('rotate');
    };

    scaleButton.onclick = function () {
      _this.transformControls.setMode('scale');
    };

    inputName.onchange = function () {
      go.setName(inputName.value);
      _this.updateUI();
    };

    return result;
  }

  dispose() {
    this.ui.remove();

    this.transformControls.detach();
    this.transformControls.dispose();
    //remove listeners as well
    const manager = this.gameView.getInputManager();
    manager.removeInputListener(this.deleteListener);
    manager.removeInputListener(this.escListener);
    manager.removeInputListener(this.mouseDownListener);
  }

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.goList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const world = this.gameView.getStateComputer().getWorldContext().getWorld();
    const go = world.getGameObject();
    const _this = this;
    go.traverse(function (child) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      list.appendChild(li);
      li.innerHTML = child.getName();
      li.title = child.getUUID();

      li.onclick = _this.goButtonClicked.bind(_this, child.getUUID());
    });

    //goeditor view
    if (this.goSelected) {
      this.setSelectedGO(this.goSelected.getUUID());
    } else {
      this.setSelectedGO(null);
    }
  }

  goButtonClicked(uuid) {
    const obj = this.computeObject3D(uuid);

    if (!obj) return;

    this.parentView.focusObject(obj);

    this.setSelectedGO(uuid);
  }

  computeObject3D(uuid) {
    return GameObjectModule.findObject3D(
      uuid,
      this.gameView.getObject3D(),
      false
    );
  }

  initUI() {
    this.goList = document.createElement('ul');
    this.goList.classList.add('ul_Editor');
    this.ui.appendChild(this.goList);

    this.goSelectedUI = document.createElement('div');
    this.ui.appendChild(this.goSelectedUI);

    this.updateUI();
  }

  initCallbacks() {}
}
