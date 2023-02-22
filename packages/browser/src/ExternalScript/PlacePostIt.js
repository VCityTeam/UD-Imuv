export class PlacePostIt {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    const localCtx = arguments[1];

    //controller
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');

    //add tool
    const scriptUI = localCtx.findLocalScriptWithID('ui');

    const menuPostIt = new MenuPostIt(
      localCtx,
      this.fetchStaticObject(localCtx)
    );

    scriptUI.addTool(
      './assets/img/ui/icon_post_it.png',
      'Post-it',
      function (resolve, reject, onClose) {
        avatarController.setAvatarControllerMode(onClose, localCtx);
        resolve(true);
      },
      menuPostIt
    );
  }

  fetchStaticObject(localContext) {
    const scriptStaticObject =
      localContext.findLocalScriptWithID('static_object');
    return scriptStaticObject.getObject();
  }
}

class MenuPostIt {
  constructor(localCtx, objectStatic) {
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
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const raycaster = new Game.THREE.Raycaster();
    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];

    manager.addMouseInput(gameView.getRootWebGL(), 'dragend', function (event) {
      if (event.target != placePostItImage) return;

      //TODO maybe this is not working in editor cause of the left bar ui but for some reason offsetY is not working in that case
      const mouse = new Game.THREE.Vector2(
        -1 +
          (2 * event.clientX) /
            (gameView.getRootWebGL().clientWidth -
              parseInt(gameView.getRootWebGL().offsetLeft)),
        1 -
          (2 * event.clientY) /
            (gameView.getRootWebGL().clientHeight -
              parseInt(gameView.getRootWebGL().offsetTop))
      );

      raycaster.setFromCamera(mouse, gameView.getCamera());

      const i = raycaster.intersectObject(objectStatic, true);

      if (i.length) {
        const closestI = i[0];
        const point = closestI.point;

        const quaternionObj = new Game.THREE.Quaternion();
        closestI.object.matrixWorld.decompose(
          new Game.THREE.Vector3(),
          quaternionObj,
          new Game.THREE.Vector3()
        );
        const normal = closestI.face.normal.applyQuaternion(quaternionObj);

        const postitGo = gameView.getAssetsManager().createPrefab('post_it');

        //rotate
        const quaternion = new Game.THREE.Quaternion().setFromUnitVectors(
          new Game.THREE.Vector3(0, 0, 1),
          normal
        );
        postitGo.getObject3D().quaternion.multiply(quaternion);

        //avoid z fighting
        postitGo.setPosition(
          point
            .sub(gameView.getObject3D().position)
            .add(normal.clone().setLength(0.08))
        );

        //write message
        const message = textAreaMessage.value;
        postitGo.components.LocalScript.conf.content = message;
        const json = postitGo.toJSON(true);
        const ws = localCtx.getWebSocketService();
        if (!ws) {
          if (gameView.getUserData('editorMode')) {
            gameView
              .getInterpolator()
              .getLocalComputer()
              .onAddGameObject(postitGo);
          } else {
            console.error('no websocket service');
          }
        } else {
          //export
          ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.ADD_GAMEOBJECT, json);
        }
      }
    });
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
