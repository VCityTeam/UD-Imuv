import {
  ExternalGame,
  THREE,
  OrbitControls,
  TransformControls,
} from '@ud-viz/browser';
import { PrefabFactory } from '@ud-imuv/shared';
import { Command, Game } from '@ud-viz/shared';

export class Box3DTool extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    const menu = new MenuBox3D(this.context);

    const scriptUI = this.context.findExternalScriptWithID('UI');
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    const avatarGO = this.context.object3D.getObjectByProperty(
      'uuid',
      this.context.userData.avatarUUID
    );
    const refine = this.context.findExternalScriptWithID('ItownsRefine');

    scriptUI.addTool(
      './assets/img/ui/icon_box.png',
      'AddBox3D',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); //camera is moving
          return;
        }

        //check if city avatar
        if (avatarGO.getObjectByProperty('name', 'city_avatar')) {
          resolve(false); //cant zeppelin while city avatar
          return;
        }

        if (onClose) {
          //record
          this.itownsCamPos.copy(this.context.frame3D.camera.position);
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.enableItownsViewControls(false);

          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true);
          });
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false);
          if (!this.itownsCamPos && !this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new THREE.Vector3().copy(
              this.context.frame3D.camera.position
            );

            //200 meters up
            const endPosition = new THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(0.01, 0, 0)
            );

            this.itownsCamPos = endPosition;
            this.itownsCamQuat = endQuaternion;
          }

          cameraManager
            .moveToTransform(this.itownsCamPos, this.itownsCamQuat, 2000)
            .then(() => {
              this.context.inputManager.setPointerLock(false);

              this.context.frame3D.enableItownsViewControls(true);

              //tweak zoom factor
              this.context.frame3D.itownsView.controls.zoomInFactor = scriptUI
                .getMenuSettings()
                .getZoomFactorValue();
              this.context.frame3D.itownsView.controls.zoomOutFactor =
                1 / scriptUI.getMenuSettings().getZoomFactorValue();

              this.context.frame3D.itownsView.notifyChange(
                this.context.frame3D.camera
              );

              if (refine) refine.itownsControls();

              resolve(true);
            });
        }
      },
      menu
    );

    this.menu = menu;
  }

  tick() {
    this.menu.tick();
  }
}

class MenuBox3D {
  /**
   *
   * @param {ExternalGame.Context} externalContext
   */
  constructor(externalContext) {
    this.context = externalContext;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const addBox3DButton = document.createElement('button');
    addBox3DButton.classList.add('button-imuv');
    addBox3DButton.innerHTML = 'Add Box3D';
    this.rootHtml.appendChild(addBox3DButton);

    addBox3DButton.onclick = () => {
      // add a box3D at the center of the screen
      const boxPosition = new THREE.Vector3();

      this.context.frame3D.itownsView.getPickingPositionFromDepth(
        new THREE.Vector2(
          this.context.frame3D.size.x / 2,
          this.context.frame3D.size.y / 2
        ),
        boxPosition
      );

      // game referential
      boxPosition.sub(this.context.object3D.position);

      const newBox3D = PrefabFactory.box3D();
      newBox3D.position.copy(boxPosition);
      newBox3D.scale.copy(new THREE.Vector3(50, 50, 50));

      this.context.sendCommandToGameContext([
        new Command({
          type: Game.ScriptTemplate.Constants.COMMAND.ADD_OBJECT3D,
          data: {
            object3D: newBox3D.toJSON(),
          },
        }),
      ]);
    };

    const raycaster = new THREE.Raycaster();
    this.listener = (event) => {
      //else check if post it has been double click
      const mouse = new THREE.Vector2(
        -1 +
          (2 * event.offsetX) /
            (this.context.frame3D.rootWebGL.clientWidth -
              parseInt(this.context.frame3D.rootWebGL.offsetLeft)),
        1 -
          (2 * event.offsetY) /
            (this.context.frame3D.rootWebGL.clientHeight -
              parseInt(this.context.frame3D.rootWebGL.offsetTop))
      );

      raycaster.setFromCamera(mouse, this.context.frame3D.camera);

      // check all box3D with name patch (in future just tag it with userData)
      let selection = null;
      this.context.object3D.traverse((child) => {
        if (!child.userData.isBox3D) return;

        const i = raycaster.intersectObject(child, true);
        if (i.length) {
          selection = child;
        }
      });

      if (!selection) {
        this.select(null);
      } else {
        this.select(selection);
      }
    };

    this.context.inputManager.addMouseInput(
      this.context.frame3D.rootWebGL,
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
      this.context.sendCommandToGameContext([
        new Command({
          type: Game.ScriptTemplate.Constants.COMMAND.REMOVE_OBJECT3D,
          data: {
            object3DUUID: this.selectedBox3D.uuid,
          },
        }),
      ]);
    };
    this.transformUI.appendChild(removeButton);
  }

  tick() {
    if (this.orbitCtrl) {
      this.orbitCtrl.update();
    }

    // TODO plug in the onRemoveGameObject event method to remove this.selectedBox if its remove
    if (this.selectedBox3D) {
      const s = this.context.object3D.getObjectByProperty(
        'uuid',
        this.selectedBox3D.uuid
      );
      if (!s) this.select(null);
    }
  }

  select(box3D) {
    if (this.selectedBox3D) {
      this.orbitCtrl.dispose();
      this.orbitCtrl = null;
      this.context.frame3D.scene.remove(this.transformCtrl);
      this.transformCtrl.dispose();
      this.transformCtrl = null;
      this.transformUI.remove();
      this.context.frame3D.enableItownsViewControls(true);
      this.context.frame3D.scene.remove(this.ghostBox);
    }

    this.selectedBox3D = box3D;

    if (this.selectedBox3D) {
      this.ghostBox = this.selectedBox3D.clone();
      this.ghostBox.visible = false;
      this.selectedBox3D.matrixWorld.decompose(
        this.ghostBox.position,
        this.ghostBox.quaternion,
        this.ghostBox.scale
      );
      this.context.frame3D.scene.add(this.ghostBox);

      this.context.frame3D.enableItownsViewControls(false);

      const elementToListen =
        this.context.frame3D.itownsView.mainLoop.gfxEngine.label2dRenderer
          .domElement;

      //new orbitctrl
      this.orbitCtrl = new OrbitControls(
        this.context.frame3D.camera,
        elementToListen
      );

      this.ghostBox.getWorldPosition(this.orbitCtrl.target);

      // new transform control
      this.transformCtrl = new TransformControls(
        this.context.frame3D.camera,
        elementToListen
      );
      this.context.frame3D.scene.add(this.transformCtrl);
      this.transformCtrl.attach(this.ghostBox);
      this.transformCtrl.updateMatrixWorld();

      //transformControls Listeners
      const parentPosition = new THREE.Vector3();
      const parentQuaternion = new THREE.Quaternion();
      const parentScale = new THREE.Vector3();
      this.selectedBox3D.parent.matrixWorld.decompose(
        parentPosition,
        parentQuaternion,
        parentScale
      );

      this.transformCtrl.addEventListener('dragging-changed', (event) => {
        this.orbitCtrl.enabled = !event.value;
      });

      this.transformCtrl.addEventListener('change', () => {
        this.transformCtrl.updateMatrixWorld();
        this.context.sendCommandToGameContext([
          new Command({
            type: Game.ScriptTemplate.Constants.COMMAND.UPDATE_TRANSFORM,
            data: {
              object3DUUID: this.selectedBox3D.uuid,
              position: this.ghostBox.position.clone().sub(parentPosition),
              quaternion: this.ghostBox.quaternion.toArray(), //parent quaternion not handle
              scale: this.ghostBox.scale, // paretns scale not handle
            },
          }),
        ]);
      });

      this.rootHtml.appendChild(this.transformUI);
    }
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    // TODO unselect here conflict with camera manager movetoavatar
    this.select(null);
    this.rootHtml.remove();
    // this.manager.removeInputListener(this.listener); listener still enable when menu is dispose TODO
  }
}
