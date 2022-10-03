export class LocalScriptWhiteboardUI {
  constructor(goUI, gameView) {
    this.content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gameView.getLastState().getGameObject().find(uuid);
  }
}
