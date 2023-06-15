import { Game, THREE, checkParentChild, Shared } from '@ud-viz/browser';

export class Clickable extends Game.External.ScriptBase {
  init() {
    const raycaster = new THREE.Raycaster();

    this.context.inputManager.addMouseInput(
      this.context.frame3D.domElement,
      'click',
      (event) => {
        if (this.context.userData.isEditorGameView) return; // TODO should be deprecated

        if (checkParentChild(event.target, this.context.frame3D.ui)) return; //ui has been clicked

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

        const i = raycaster.intersectObject(this.context.frame3D.scene, true);

        if (i.length) {
          const gameObjectClicked = Shared.Game.Object3D.fetchFirstGameObject3D(
            i[0].object
          );
          if (
            gameObjectClicked &&
            gameObjectClicked.uuid == this.object3D.uuid
          ) {
            const externalScriptComp = this.object3D.getComponent(
              Shared.Game.Component.ExternalScript.TYPE
            );
            externalScriptComp.getController().execute('onClick'); //custom external script event could be in ud-viz
          }
        }
      }
    );
  }

  static get ID_SCRIPT() {
    return 'clickable_id_ext_script';
  }
}
