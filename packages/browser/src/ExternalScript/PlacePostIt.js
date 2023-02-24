import { ExternalGame, THREE } from '@ud-viz/browser';
import { PrefabFactory } from '@ud-imuv/shared';
import { Game, Command } from '@ud-viz/shared';

export class PlacePostIt extends ExternalGame.ScriptBase {
  init() {
    //controller
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');

    //add tool
    const scriptUI = this.context.findExternalScriptWithID('UI');

    const menuPostIt = new MenuPostIt(this.context, this.fetchStaticObject());

    scriptUI.addTool(
      './assets/img/ui/icon_post_it.png',
      'Post-it',
      (resolve, reject, onClose) => {
        avatarController.setAvatarControllerMode(onClose);
        resolve(true);
      },
      menuPostIt
    );
  }

  fetchStaticObject() {
    const scriptStaticObject =
      this.context.findExternalScriptWithID('StaticObject');
    return scriptStaticObject.object3D;
  }
}

class MenuPostIt {
  /**
   *
   * @param {ExternalGame.Context} externalContext
   * @param {object} objectStatic
   */
  constructor(externalContext, objectStatic) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const postitHtml = document.createElement('div');
    postitHtml.classList.add('post-it');
    this.rootHtml.appendChild(postitHtml);

    //input
    const textAreaMessage = document.createElement('textarea');
    textAreaMessage.placeholder = 'Post-it message...';
    postitHtml.appendChild(textAreaMessage);

    //create button
    const placePostItImage = document.createElement('img');
    placePostItImage.src = './assets/img/ui/icon_drag_post_it.png';
    placePostItImage.classList.add('draggable');
    this.rootHtml.appendChild(placePostItImage);

    //callbacks
    const raycaster = new THREE.Raycaster();

    externalContext.inputManager.addMouseInput(
      externalContext.frame3D.html(),
      'dragend',
      (event) => {
        if (event.target != placePostItImage) return;

        //TODO maybe this is not working in editor cause of the left bar ui but for some reason offsetY is not working in that case
        const mouse = new THREE.Vector2(
          -1 +
            (2 * event.clientX) /
              (externalContext.frame3D.rootWebGL.clientWidth -
                parseInt(externalContext.frame3D.rootWebGL.offsetLeft)),
          1 -
            (2 * event.clientY) /
              (externalContext.frame3D.rootWebGL.clientHeight -
                parseInt(externalContext.frame3D.rootWebGL.offsetTop))
        );

        raycaster.setFromCamera(mouse, externalContext.frame3D.camera);

        const i = raycaster.intersectObject(objectStatic, true);

        if (i.length) {
          const closestI = i[0];
          const point = closestI.point;

          const quaternionObj = new THREE.Quaternion();
          closestI.object.matrixWorld.decompose(
            new THREE.Vector3(),
            quaternionObj,
            new THREE.Vector3()
          );
          const normal = closestI.face.normal.applyQuaternion(quaternionObj);

          const postitGo = PrefabFactory.postIt();

          //rotate
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
          );
          postitGo.quaternion.multiply(quaternion);

          //avoid z fighting
          postitGo.position.copy(
            point
              .sub(externalContext.object3D.position)
              .add(normal.clone().setLength(0.08))
          );

          //write message
          const message = textAreaMessage.value;
          const externalScriptComp = postitGo.getComponent(
            Game.Component.ExternalScript.TYPE
          );
          externalScriptComp.getModel().getVariables().content = message;

          externalContext.sendCommandToGameContext([
            new Command({
              type: Game.ScriptTemplate.Constants.COMMAND.ADD_OBJECT3D,
              data: { object3D: postitGo.toJSON() },
            }),
          ]);
        }
      }
    );
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
