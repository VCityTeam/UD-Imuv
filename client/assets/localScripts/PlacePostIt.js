/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class PlacePostIt {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();
    const objectStatic = this.fetchStaticObject(localCtx);

    //toggle post it mode
    const postitButton = document.createElement('button');
    postitButton.classList.add('button-imuv');
    postitButton.innerHTML = 'Post-it';
    // gameView.appendToUI(postitButton);
    let postitEnable = false;
    postitButton.onclick = function () {
      postitEnable = !postitEnable;
    };

    //ref
    let postitGo = null;

    //controller
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');

    //html
    const postitHtml = document.createElement('div');
    postitHtml.classList.add('post-it');
    //input
    const inputMessage = document.createElement('input');
    inputMessage.classList.add('post-it-input');
    inputMessage.type = 'text';
    postitHtml.appendChild(inputMessage);
    //create button
    const createButton = document.createElement('button');
    createButton.classList.add('button-imuv');
    createButton.innerHTML = 'Creer Post-it';
    postitHtml.appendChild(createButton);
    //cancel
    const cancelButton = document.createElement('button');
    cancelButton.classList.add('button-imuv');
    cancelButton.innerHTML = 'Annuler';
    postitHtml.appendChild(cancelButton);

    manager.addMouseInput(
      gameView.getRootWebGL(),
      'dblclick',
      function (event) {
        if (!postitEnable) return;

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

          postitGo = gameView.getAssetsManager().createPrefab('post_it');

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

          //reset + add to ui
          inputMessage.value = '';
          avatarController.setAvatarControllerMode(false, localCtx);
          gameView.appendToUI(postitHtml);
        }
      }
    );

    const cancelCb = function () {
      if (!postitGo) throw new Error('button not visible if no go');

      avatarController.setAvatarControllerMode(true, localCtx);
      postitHtml.remove();
      postitEnable = false; //force reclick
    };

    cancelButton.onclick = cancelCb;

    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];
    createButton.onclick = function () {
      cancelCb();

      //write message
      const message = inputMessage.value;
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

        ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.ADD_GAMEOBJECT, json);
      }
    };

    //add tool
    const scriptUI = localCtx.findLocalScriptWithID('ui');

    const menuPostIt = new MenuPostIt();

    scriptUI.addTool(
      './assets/img/ui/icon_town_white.png',
      'Post-it',
      function (resolve, reject, onClose) {
        console.log('onclose', onClose);
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
};

class MenuPostIt {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = 'Post-it';
    this.rootHtml.appendChild(title);
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
