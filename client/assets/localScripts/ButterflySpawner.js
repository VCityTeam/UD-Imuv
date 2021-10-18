/** @format */

let udviz = null;
let Shared = null;
let DetectCollisions = null;

module.exports = class ButterflySpawner {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
    DetectCollisions = Shared.DetectCollisions;
  }

  init() {
    const localCtx = arguments[1];
    this.avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
  }

  tick() {
    const go = arguments[0];
    const system = new DetectCollisions.Collisions();

    const avatar = go.computeRoot().find(this.avatarUUID);

    const cstRadius = go.getComponent(Shared.Render.TYPE).object3D.children[0]
      .geometry.parameters.radius;
    const pos = go.getPosition();

    const colliderArea = system.createCircle(pos.x, pos.y, cstRadius);
    system.update();

    if (!avatar) return;
    const colliderComp = avatar.getComponent(Shared.ColliderModule.TYPE);

    if (!colliderComp)
      console.error(avatar.name, avatar.uuid, ' has not collider component');

    const avatarPos = avatar.getPosition();

    colliderComp.shapesJSON.forEach((shape) => {
      if (shape.type == 'Circle') {
        system.createCircle(avatarPos.x, avatarPos.y, colliderComp.radius);
      } else if (shape.type == 'Polygon') {
        console.log('POLYGON TODO');
      } else {
        console.error('invalide type');
      }
    });

    const potentials = colliderArea.potentials();
    if (potentials.length) console.log('PAPILLON DE LUMIERE');
  }
};
