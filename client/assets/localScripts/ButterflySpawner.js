/** @format */

let udviz = null;
let Shared = null;

module.exports = class ButterflySpawner {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    console.log('Init Butterfly Spawner');
    this.go = arguments[0];
    console.log(this.go);
    if (!this.go) return;
  }

  tick() {}

  spawnButterfly(go) {
    // const geometry = new Shared.THREE.SphereGeometry(100, 32, 16);
    // const material = new Shared.THREE.MeshBasicMaterial({ color: 0xffff00 });
    // const sphere = new Shared.THREE.Mesh(geometry, material);
    // go.getComponent(Shared.Render.TYPE).addObject3D(sphere);
    // sphere.updateMatrix();
  }

  createParticles(go) {
    const THREE = Shared.THREE;
    const particleGroup = new THREE.Object3D();
    const particleAttributes = {
      startSize: [],
      startPosition: [],
      randomness: [],
    };
    var totalParticles = 20;
    var radiusRange = 10;
    for (var i = 0; i < totalParticles; i++) {
      var spriteMaterial = new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('/assets/img/butterflySprite.png'),
        useScreenCoordinates: false,
        color: 0xffffff,
      });

      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.5, 0.5, 1); // imageWidth, imageHeight
      sprite.position.set(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random()
      );

      // for a solid sphere:
      sprite.position.setLength(radiusRange * Math.random());

      // sprite.material.color.setRGB(0, 0, 0);
      sprite.material.color.setHSL(Math.random(), 0.9, 0.7);

      sprite.material.opacity = 0.8; // translucent particles

      particleGroup.add(sprite);
      // add variable qualities to arrays, if they need to be accessed later
      particleAttributes.startPosition.push(sprite.position.clone());
      particleAttributes.randomness.push(Math.random());
    }

    go.getComponent(Shared.Render.TYPE).addObject3D(particleGroup);
  }

  update() {
    if (this.conf.onEnter) {
      console.log('PAPILLON DE LUMIERE');
      this.createParticles(this.go);
    } else {
      console.log('on enter finished');
    }
  }
};
