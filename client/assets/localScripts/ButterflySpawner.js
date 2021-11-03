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
    this.go = arguments[0];
    console.log('Init Butterfly Spawner', this.go);
    if (!this.go) return;
    this.triggerAnimate = false;
    this.particleGroup = null;
    this.clock = new Shared.THREE.Clock();
  }

  tick() {
    if (this.triggerAnimate) this.animate();
  }

  animate() {
    const time = this.clock.getElapsedTime();
    const particleGroup = this.particleGroup;
    const particleAttributes = this.particleAttributes;
    for (let c = 0; c < particleGroup.children.length; c++) {
      const sprite = particleGroup.children[c];

      // pulse away/towards center
      // individual rates of movement
      var a = particleAttributes.randomness[c] + 1;
      var pulseFactor = Math.sin(a * time) * 0.1 + 0.9;
      sprite.position.x = particleAttributes.startPosition[c].x * pulseFactor;
      sprite.position.y = particleAttributes.startPosition[c].y * pulseFactor;
      sprite.position.z = particleAttributes.startPosition[c].z * pulseFactor;
    }
    if (time > 5) {
      this.triggerAnimate = false;
      particleGroup.parent.remove(particleGroup);
      this.particleGroup = null;
    }
  }

  createParticles(go) {
    const THREE = Shared.THREE;
    if (this.particleGroup) return;
    this.clock = new Shared.THREE.Clock();
    this.particleGroup = new THREE.Object3D();
    this.particleAttributes = {
      startSize: [],
      startPosition: [],
      randomness: [],
    };
    const totalParticles = 20;
    const radiusRange = 10;
    for (let i = 0; i < totalParticles; i++) {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('/assets/img/butterflySprite.png'),
        useScreenCoordinates: false,
        color: 0xffffff,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
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

      this.particleGroup.add(sprite);
      // add variable qualities to arrays, if they need to be accessed later
      this.particleAttributes.startPosition.push(sprite.position.clone());
      this.particleAttributes.randomness.push(Math.random());
    }

    go.getComponent(Shared.Render.TYPE).addObject3D(this.particleGroup);
    this.triggerAnimate = true;
  }

  update() {
    if (this.conf.onEnter) {
      this.createParticles(this.go);
    } else {
    }
  }
};
