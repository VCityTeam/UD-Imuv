/** @format */

import './GOEditor.css';
import { THREE, TransformControls } from 'ud-viz';
import File from 'ud-viz/src/Components/SystemUtils/File';
import { GameObject, World } from 'ud-viz/src/Game/Shared/Shared';
import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import GameObjectModule from 'ud-viz/src/Game/Shared/GameObject/GameObject';
import { GameObjectUI } from '../GameObjectUI';

export class GOEditorView {
  constructor(params) {
    //html
    this.ui = document.createElement('div');
    this.ui.classList.add('root_GOEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.goList = null;
    this.goSelectedUI = null;
    this.labelCurrentWorld = null;

    //parentView
    this.parentView = params.parentView;

    //gameview
    this.gameView = params.gameView;

    //controls
    this.transformControls = this.gameView.getTransformControls();
    this.orbitControls = this.gameView.getOrbitControls();

    //go selected
    this.goSelected = null;

    this.initCallbacks();
    this.initUI();
  }

  initCallbacks() {
    const gV = this.gameView;

    const cbPointerUp = function (event) {
      const controlChanged = gV.hasBeenRotate() || gV.tcHasBeenDragged();
      if (event.button != 0 || controlChanged) return; // just a right click no drag
      const intersect = gV.throwRay(event, gV.getObject3D());
      const o = intersect ? gV.tryFindGOParent(intersect.object) : null;
      this.setSelectedGO(o);
    };

    gV.setCallbackPointerUp(cbPointerUp.bind(this));
  }

  initTransformControls() {
    const gameView = this.gameView;
    const manager = gameView.getInputManager();
    const viewerDiv = gameView.getRootWebGL();

    const _this = this;
    //cant handle this callback with our input manager
    // this.transformControls.addEventListener(
    //   'dragging-changed',
    //   function (event) {
    //     const gameViewGO = gameView
    //       .getLastState()
    //       .getGameObject()
    //       .find(_this.goSelected.getUUID());

    //     _this.goSelected.setTransformFromGO(gameViewGO);
    //     //update go menu ui
    //     _this.setSelectedGO(_this.goSelected.getUUID());
    //   }
    // );

    // this.onPointerUpListener = function (event) {
    //   const controlChanged =
    //     gameView.hasBeenRotate() || gameView.tcHasBeenDragged();
    //   if (event.button != 0 || controlChanged) return;

    //   const intersect = gameView.throwRay(event, gameView.getObject3D());

    //   if (intersect) {
    //     const objectClicked = intersect.object;
    //     let current = objectClicked;
    //     while (!current.userData.gameObjectUUID) {
    //       if (!current.parent) {
    //         console.warn('didnt find gameobject uuid');
    //         current = null;
    //         break;
    //       }
    //       current = current.parent;
    //     }

    //     if (current) {
    //       _this.setSelectedGO(current.userData.gameObjectUUID);
    //       return;
    //     }
    //   }
    //   _this.setSelectedGO(null);
    // };
  }

  getSelectedGO() {
    return this.goSelected;
  }

  setSelectedGO(object) {
    this.gameView.attachTCToObject(object);
    //clean
    if (this.goSelectedUI) this.goSelectedUI.remove();

    if (!object) return;

    const world = this.gameView.getInterpolator().getWorldContext().getWorld();
    const worldGo = world.getGameObject();
    const uuid = object.userData.gameObjectUUID;
    this.goSelected = worldGo.find(uuid);

    if (this.goSelected) {
      //attach transform ctrl
      this.goSelectedUI = this.createGOUI(this.goSelected, object);
      this.ui.appendChild(this.goSelectedUI);
    }
  }

  createGOUI(go, object) {
    const goUI = new GameObjectUI(go, object).getRootElementUI();
    const lS = go.fetchLocalScripts();
    if (lS) {
      if (lS['image']) {
        goUI.appendLSImageUI();
      }
    }

    const wS = go.fetchWorldScripts();
    if (wS) {
      if (wS['portal']) {
        goUI.appendPortalUI(wS);
      }
    }

    return goUI;
  }

  createGOUIOld(go, obj) {
    const result = document.createElement('div');
    result.classList.add('goUI_GOEditor');



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
          refSpawnRot.y = yInput.value;
        };

        zInput.onchange = function () {
          refSpawnRot.z = zInput.value;
        };
      }

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

    let teleporterInput = null;
    if (worldScripts && worldScripts['teleporter']) {
      teleporterInput = document.createElement('div');

      {
        const refDestinationTransform =
          worldScripts['teleporter'].conf.destinationTransform;
        if (!refDestinationTransform) throw new Error('no dest transform');

        const labelDesT = document.createElement('div');
        labelDesT.innerHTML = 'Teleporter destination transform';
        teleporterInput.appendChild(labelDesT);

        const createInputField = function (ref, label) {
          const labelDiv = document.createElement('div');
          labelDiv.innerHTML = label;
          teleporterInput.appendChild(labelDiv);

          const xInput = document.createElement('input');
          xInput.type = 'number';
          xInput.value = ref[0];
          xInput.step = 0.1;
          teleporterInput.appendChild(xInput);

          const yInput = document.createElement('input');
          yInput.type = 'number';
          yInput.value = ref[1];
          yInput.step = 0.1;
          teleporterInput.appendChild(yInput);

          const zInput = document.createElement('input');
          zInput.type = 'number';
          zInput.value = ref[2];
          zInput.step = 0.1;
          teleporterInput.appendChild(zInput);

          xInput.onchange = function () {
            ref[0] = xInput.value;
          };

          yInput.onchange = function () {
            ref[1] = yInput.value;
          };

          zInput.onchange = function () {
            ref[2] = zInput.value;
          };
        };

        createInputField(refDestinationTransform.position, 'position');
        createInputField(refDestinationTransform.rotation, 'rotation');
      }

      result.appendChild(teleporterInput);
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
      //TODOcode replicate
      go.removeFromParent();

      _this.transformControls.detach();

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
  }

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.goList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const world = this.gameView.getInterpolator().getWorldContext().getWorld();
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
    const labelCurrentWorld = document.createElement('h2');
    labelCurrentWorld.innerHTML =
      this.gameView.getInterpolator().getWorldContext().getWorld().getName() +
      ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    this.goList = document.createElement('ul');
    this.goList.classList.add('ul_Editor');
    this.ui.appendChild(this.goList);

    this.updateUI();
  }
}
