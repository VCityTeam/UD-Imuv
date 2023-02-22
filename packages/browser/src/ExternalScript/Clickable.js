export class Clickable {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();

    manager.addMouseInput(gameView.getRootWebGL(), 'click', function (event) {
      if (gameView.getUserData('isEditorGameView')) return;

      if (udviz.Components.checkParentChild(event.target, gameView.ui)) return; //ui has been clicked

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

      const i = raycaster.intersectObject(gameView.getScene(), true);

      if (i.length) {
        const firstObjectClicked = i[0].object;
        if (
          udviz.Game.GameObject.findObject3D(go.getUUID(), firstObjectClicked)
        ) {
          const lss = go.fetchLocalScripts();
          for (let id in lss) {
            const script = lss[id];
            if (script.onClick) script.onClick(go, localCtx);
          }
        }
      }
    });
  }
};