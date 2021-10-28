/** @format */

let Shared = null;
let udviz = null;

//track static object

module.exports = class StaticObject {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    this.object = new Shared.THREE.Object3D();
    this.object.name = 'Static_Object';
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //init obstacle
    const state = localCtx.getGameView().getLastState();
    const o = state.getOrigin();
    if (!o) debugger; //DEBUG
    const [x, y] = Shared.proj4.default('EPSG:3946').forward([o.lng, o.lat]);

    this.object.position.x = x;
    this.object.position.y = y;
    this.object.position.z = o.alt;
  }

  getObject() {
    return this.object;
  }

  onNewGameObject() {
    const newGO = arguments[2];

    const _this = this;

    //add static object to object
    if (newGO.isStatic()) {
      //register in object
      const r = newGO.getComponent(Shared.Render.TYPE);
      if (r) {
        const clone = r.getObject3D().clone();

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

        _this.object.add(clone);
        _this.object.updateMatrixWorld();
      }
    }
  }
};
