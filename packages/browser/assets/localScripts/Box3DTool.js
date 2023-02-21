/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Box3DTool {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    const menu = new MenuBox3D(localCtx);
    const Routine = Game.Components.Routine;
    const scriptUI = localCtx.findLocalScriptWithID('ui');
    const cameraScript = localCtx.findLocalScriptWithID('camera');
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');
    const camera = gameView.getCamera();
    const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
    const rootGO = localCtx.getRootGameObject();
    const view = gameView.getItownsView();
    const manager = gameView.getInputManager();
    const avatarGO = rootGO.find(avatarUUID);
    const refine = localCtx.findLocalScriptWithID('itowns_refine');

    scriptUI.addTool(
      './assets/img/ui/icon_box.png',
      'AddBox3D',
      (resolve, reject, onClose) => {
        if (cameraScript.hasRoutine()) {
          resolve(false); //camera is moving
          return;
        }

        //check if city avatar
        if (avatarGO.findByName('city_avatar')) {
          resolve(false); //cant zeppelin while city avatar
          return;
        }

        const duration = 2000;
        let currentTime = 0;

        const startPos = camera.position.clone();
        const startQuat = camera.quaternion.clone();

        if (onClose) {
          //record
          this.itownsCamPos.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          this.itownsCamQuat.setFromEuler(camera.rotation);

          gameView.setItownsRendering(false);

          cameraScript.addRoutine(
            new Routine(
              function (dt) {
                const t = cameraScript
                  .getFocusCamera()
                  .computeTransformTarget(
                    null,
                    cameraScript.getDistanceCameraAvatar()
                  );

                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              function () {
                avatarController.setAvatarControllerMode(true, localCtx);

                resolve(true);
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);
          if (!this.itownsCamPos && !this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new Game.THREE.Vector3().copy(
              camera.position
            );

            //200 meters up
            const endPosition = new Game.THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new Game.THREE.Quaternion().setFromEuler(
              new Game.THREE.Euler(0.01, 0, 0)
            );

            this.itownsCamPos = endPosition;
            this.itownsCamQuat = endQuaternion;
          }

          cameraScript.addRoutine(
            new Routine(
              (dt) => {
                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = this.itownsCamPos.clone().lerp(startPos, 1 - ratio);
                const q = this.itownsCamQuat
                  .clone()
                  .slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
                manager.setPointerLock(false);

                gameView.setItownsRendering(true);

                //tweak zoom factor
                view.controls.zoomInFactor = scriptUI
                  .getMenuSettings()
                  .getZoomFactorValue();
                view.controls.zoomOutFactor =
                  1 / scriptUI.getMenuSettings().getZoomFactorValue();

                gameView.getItownsView().notifyChange(gameView.getCamera());

                if (refine) refine.itownsControls();

                resolve(true);
              }
            )
          );
        }
      },
      menu
    );

    this.menu = menu;
  }

  tick() {
    this.menu.tick();
  }
};

class MenuBox3D {
  constructor(localCtx) {
    this.context = localCtx;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const addBox3DButton = document.createElement('button');
    addBox3DButton.classList.add('button-imuv');
    addBox3DButton.innerHTML = 'Add Box3D';
    this.rootHtml.appendChild(addBox3DButton);

    const gameView = localCtx.getGameView();
    this.manager = gameView.getInputManager();
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    const ws = localCtx.getWebSocketService();

    addBox3DButton.onclick = () => {
      // add a box3D at the center of the screen
      const boxPosition = new Game.THREE.Vector3();

      gameView
        .getItownsView()
        .getPickingPositionFromDepth(
          new Game.THREE.Vector2(gameView.size.x / 2, gameView.size.y / 2),
          boxPosition
        );

      // game referential
      boxPosition.sub(gameView.getObject3D().position);

      const newBox3D = gameView.getAssetsManager().createPrefab('box3D');
      newBox3D.setPosition(boxPosition);
      newBox3D.setScale(new Game.THREE.Vector3(50, 50, 50));

      ws.emit(
        ImuvConstants.WEBSOCKET.MSG_TYPE.ADD_GAMEOBJECT,
        newBox3D.toJSON()
      );
    };

    const raycaster = new Game.THREE.Raycaster();
    this.listener = (event) => {
      //else check if post it has been double click
      const mouse = new Game.THREE.Vector2(
        -1 +
          (2 * event.offsetX) /
            (gameView.getRootWebGL().clientWidth -
              parseInt(gameView.getRootWebGL().offsetLeft)),
        1 -
          (2 * event.offsetY) /
            (gameView.getRootWebGL().clientHeight -
              parseInt(gameView.getRootWebGL().offsetTop))
      );

      raycaster.setFromCamera(mouse, gameView.getCamera());

      // check all box3D with name patch (in future just tag it with userData)
      const rootGO = localCtx.getRootGameObject();
      let selection = null;
      rootGO.traverse((child) => {
        if (child.name != 'Box3D') return;

        const i = raycaster.intersectObject(child.getObject3D(), true);
        if (i.length) {
          selection = child;
        }
      });

      if (!selection) {
        this.select(null);
        console.log('unselect');
      } else {
        this.select(selection);
      }
    };

    this.manager.addMouseInput(
      gameView.getRootWebGL(),
      'dblclick',
      this.listener
    );

    // orbit control
    this.orbitCtrl = null;
    this.transformCtrl = null;
    this.transformUI = document.createElement('div');
    this.ghostBox = null;

    //rotate
    const rotButton = document.createElement('button');
    rotButton.classList.add('button-imuv');
    rotButton.innerHTML = 'Rotation';
    rotButton.onclick = () => {
      this.transformCtrl.setMode('rotate');
    };
    this.transformUI.appendChild(rotButton);

    // translate
    const translateButton = document.createElement('button');
    translateButton.classList.add('button-imuv');
    translateButton.innerHTML = 'Translate';
    translateButton.onclick = () => {
      this.transformCtrl.setMode('translate');
    };
    this.transformUI.appendChild(translateButton);

    // scale
    const scaleButton = document.createElement('button');
    scaleButton.classList.add('button-imuv');
    scaleButton.innerHTML = 'Scale';
    scaleButton.onclick = () => {
      this.transformCtrl.setMode('scale');
    };
    this.transformUI.appendChild(scaleButton);

    // remove
    const removeButton = document.createElement('button');
    removeButton.classList.add('button-imuv');
    removeButton.innerHTML = 'Remove';
    removeButton.onclick = () => {
      ws.emit(
        ImuvConstants.WEBSOCKET.MSG_TYPE.REMOVE_GAMEOBJECT,
        this.selectedBox3D.uuid
      );
    };
    this.transformUI.appendChild(removeButton);
  }

  tick() {
    if (this.orbitCtrl) {
      this.orbitCtrl.update();
    }
    this.context.gameView.itownsView.notifyChange();

    // dirty but no event when a gameobject is removed
    if (this.selectedBox3D) {
      const s = this.context.getRootGameObject().find(this.selectedBox3D.uuid);
      if (!s) this.select(null);
    }
  }

  select(box3D) {
    const gameView = this.context.getGameView();
    const ws = this.context.getWebSocketService();
    const ImuvConstants = this.context.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    if (this.selectedBox3D) {
      this.orbitCtrl.dispose();
      this.orbitCtrl = null;
      gameView.scene.remove(this.transformCtrl);
      this.transformCtrl.dispose();
      this.transformCtrl = null;
      this.transformUI.remove();
      gameView.setItownsRendering(true);
      gameView.scene.remove(this.ghostBox);
    }

    this.selectedBox3D = box3D;

    if (this.selectedBox3D) {
      this.ghostBox = this.selectedBox3D.getObject3D().clone();
      this.ghostBox.visible = false;
      this.selectedBox3D
        .getObject3D()
        .matrixWorld.decompose(
          this.ghostBox.position,
          this.ghostBox.quaternion,
          this.ghostBox.scale
        );
      gameView.scene.add(this.ghostBox);

      gameView.setItownsRendering(false);

      const elementToListen =
        gameView.getItownsView().mainLoop.gfxEngine.label2dRenderer.domElement;

      //new orbitctrl
      this.orbitCtrl = new udviz.OrbitControls(
        gameView.getCamera(),
        elementToListen
      );

      this.ghostBox.getWorldPosition(this.orbitCtrl.target);

      // new transform control
      this.transformCtrl = new udviz.TransformControls(
        gameView.getCamera(),
        elementToListen
      );
      gameView.scene.add(this.transformCtrl);
      this.transformCtrl.attach(this.ghostBox);
      this.transformCtrl.updateMatrixWorld();

      //transformControls Listeners
      const parentPosition = new Game.THREE.Vector3();
      const parentQuaternion = new Game.THREE.Quaternion();
      const parentScale = new Game.THREE.Vector3();
      this.selectedBox3D
        .getObject3D()
        .parent.matrixWorld.decompose(
          parentPosition,
          parentQuaternion,
          parentScale
        );

      this.transformCtrl.addEventListener('dragging-changed', (event) => {
        this.orbitCtrl.enabled = !event.value;
      });

      this.transformCtrl.addEventListener('change', () => {
        ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.COMMANDS, [
          new Game.Command({
            type: 'update_transform',
            data: {
              position: this.ghostBox.position.clone().sub(parentPosition),
              quaternion: this.ghostBox.quaternion.toArray(), //parent quaternion not handle
              scale: this.ghostBox.scale, // paretns scale not handle
            },
            gameObjectUUID: this.selectedBox3D.uuid,
          }).toJSON(),
        ]);
      });

      this.rootHtml.appendChild(this.transformUI);
    }
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.select(null);
    this.rootHtml.remove();
    // this.manager.removeInputListener(this.listener);
  }
}
