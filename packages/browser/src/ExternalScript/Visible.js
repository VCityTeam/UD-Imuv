export class Visible {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    this.updateVisible(arguments[0]);
  }

  updateVisible(go) {
    const renderComp = go.getComponent(Game.Render.TYPE);
    renderComp.getObject3D().visible = this.conf.visible;
  }

  onOutdated() {
    this.updateVisible(arguments[0]);
  }
}
