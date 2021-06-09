/** @format */

module.exports = class LocalGameManager {
  constructor(conf, udvShared) {
    this.conf = conf;
    this.obstacle = new udvShared.THREE.Object3D();
    this.obstacle.name = 'GameView_Obstacle';
  }

  init() {
    const localCtx = arguments[1];
    const state = localCtx.state;
    const proj4 = localCtx.UDVShared.proj4;
    const o = state.getOrigin();
    const [x, y] = proj4.default('EPSG:3946').forward([o.lng, o.lat]);

    this.obstacle.position.x = x;
    this.obstacle.position.y = y;
    this.obstacle.position.z = o.alt;
  }

  onNewGameObject() {
    const localCtx = arguments[1];
    const newGO = arguments[2];
    const Render = localCtx.UDVShared.Render;
    console.log(newGO.name, ' is add');

    const _this = this;

    //add static object to obstacle
    if (newGO.isStatic()) {
      //register in obstacle
      const r = newGO.getComponent(Render.TYPE);
      if (r) {
        const clone = r.getOriginalObject3D().clone();

        const wT = newGO.computeWorldTransform();

        clone.position.x = wT.position.x;
        clone.position.y = wT.position.y;
        clone.position.z = wT.position.z;

        clone.rotation.x = wT.rotation.x;
        clone.rotation.y = wT.rotation.y;
        clone.rotation.z = wT.rotation.z;

        clone.scale.x = wT.scale.x;
        clone.scale.y = wT.scale.y;
        clone.scale.z = wT.scale.z;

        _this.obstacle.add(clone);
        _this.obstacle.updateMatrixWorld();
      }
    }
  }
};
