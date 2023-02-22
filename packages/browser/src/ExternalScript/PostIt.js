export class PostIt {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.listener = null;
    this.menu = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();
    const object = go.getObject3D();

    const menu = new MenuPostIt(localCtx, go, this.conf.content);
    this.menu = menu;

    this.listener = function (event) {
      //if menu is already in DOM remove it
      if (menu.html().parentNode) {
        menu.dispose();
        return;
      }

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

      const i = raycaster.intersectObject(object, true);

      if (i.length) {
        gameView.appendToUI(menu.html());
      }
    };

    manager.addMouseInput(gameView.getRootWebGL(), 'dblclick', this.listener);
  }

  onRemove() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    manager.removeInputListener(this.listener);
    this.menu.dispose();
  }
}

class MenuPostIt {
  constructor(localCtx, go, message) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_menu_display_post_it');

    const postIt = document.createElement('div');
    postIt.innerHTML = message;
    postIt.classList.add('display_post_it');
    this.rootHtml.appendChild(postIt);

    const deletePostIt = document.createElement('div');
    deletePostIt.innerHTML = 'Supprimer';
    deletePostIt.classList.add('button-imuv');
    this.rootHtml.appendChild(deletePostIt);

    //callback
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    deletePostIt.onclick = function () {
      localCtx
        .getWebSocketService()
        .emit(ImuvConstants.WEBSOCKET.MSG_TYPE.REMOVE_GAMEOBJECT, go.getUUID());
    };
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
