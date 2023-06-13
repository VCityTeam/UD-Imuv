import { Game, Shared, THREE } from '@ud-viz/browser';

export class PostIt extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.listener = null;
    this.menu = null;
    this.raycaster = new THREE.Raycaster();
  }

  init() {
    const menu = new MenuPostIt(this.context, this.object3D, this.variables);
    this.menu = menu;

    this.listener = (event) => {
      //if menu is already in DOM remove it
      if (menu.html().parentNode) {
        menu.dispose();
        return;
      }

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

      this.raycaster.setFromCamera(mouse, this.context.frame3D.camera);

      const i = this.raycaster.intersectObject(this.object3D, true);

      if (i.length) {
        this.context.frame3D.appendToUI(menu.html());
      }
    };

    this.context.inputManager.addMouseInput(
      this.context.frame3D.rootWebGL,
      'dblclick',
      this.listener
    );
  }

  onRemove() {
    this.context.inputManager.removeInputListener(this.listener);
    this.menu.dispose();
  }

  static get ID_SCRIPT() {
    return 'post_it_id_ext_script';
  }
}

class MenuPostIt {
  /**
   *
   * @param {ExternalGame.Context} externalGameContext
   * @param {*} postItGameObject
   * @param {*} postItVariables
   */
  constructor(externalGameContext, postItGameObject, postItVariables) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_menu_display_post_it');

    const postIt = document.createElement('div');
    postIt.innerHTML = postItVariables.content;
    postIt.classList.add('display_post_it');
    this.rootHtml.appendChild(postIt);

    const deletePostIt = document.createElement('div');
    deletePostIt.innerHTML = 'Supprimer';
    deletePostIt.classList.add('button-imuv');
    this.rootHtml.appendChild(deletePostIt);

    //callback
    deletePostIt.onclick = function () {
      externalGameContext.sendCommandToGameContext([
        new Shared.Command({
          type: Shared.Game.ScriptTemplate.Constants.COMMAND.REMOVE_OBJECT3D,
          data: {
            object3DUUID: postItGameObject.uuid,
          },
        }),
      ]);
    };
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
