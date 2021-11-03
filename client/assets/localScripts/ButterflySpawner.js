/** @format */

let udviz = null;
let Shared = null;
let THREE = null;

module.exports = class ButterflySpawner {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
    THREE = Shared.THREE;
  }

  init() {
    this.go = arguments[0];
    console.log('Init Butterfly Spawner', this.go);
    if (!this.go) return;
    this.triggerAnimate = false;
    this.particleGroup = null;
    this.clock = new THREE.Clock();
  }

  tick() {
    if (this.triggerAnimate) this.animate(5);
  }

  animate(duration) {
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
      //fade in
      if (time > duration - a && sprite.material.opacity > 0) {
        sprite.material.opacity -= 0.1;
      } else if (time > a && sprite.material.opacity < 0.8) {
        sprite.material.opacity += 0.1;
      }
    }
    if (time > duration) {
      this.triggerAnimate = false;
      particleGroup.parent.remove(particleGroup);
      this.particleGroup = null;
    }
  }

  createParticuleGroup() {
    if (this.particleGroup) return;

    const defaultAttributes = {
      startPosition: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random()
      ),
      startSize: new THREE.Vector3(1, 1, 1),
      material: new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('/assets/img/butterflySprite.png'),
        useScreenCoordinates: false,
        color: 0xffffff,
      }),
      color: new THREE.Color().setHSL(Math.random(), 0.9, 0.7),
      opacity: 0.8,
    };

    this.particleGroup = new ParticleGroup({
      nParticles: 10,
      radiusRange: 10,
      defaultAttributes,
    });

    this.go
      .getComponent(Shared.Render.TYPE)
      .addObject3D(this.particleGroup.getObject3D());
  }

  createParticles(go) {
    const THREE = THREE;
    if (this.particleGroup) return;
    this.clock = new THREE.Clock();
    this.particleGroup = new THREE.Object3D();
    this.particleAttributes = {
      startSize: [],
      startPosition: [],
      randomness: [],
    };
    const totalParticles = 10;
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

      sprite.material.opacity = 0; // translucent particles

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
      this.createParticuleGroup();
    } else {
    }
  }
};

class ParticleGroup {
  constructor(params) {
    this.object3D = new THREE.Object3D();
    this.particles = [];
    this.nParticles = params.nParticles;
    this.radiusRange = params.radiusRange;

    this.initParticles(params.defaultAttributes);
  }

  initParticles(spriteDefault) {
    for (let p = 0; p < this.nParticles; p++) {
      spriteDefault.startPosition.setLength(this.radiusRange * Math.random());
      const newSpriteParticle = new SpriteParticle(spriteDefault);
      this.object3D.add(newSpriteParticle.getSprite());
      this.particles.push(newSpriteParticle);
    }
  }

  getParticles() {
    return this.particles;
  }

  getObject3D() {
    return this.object3D;
  }
}

class AbstractParticle {
  constructor(params) {
    if (this.constructor === AbstractParticle) {
      throw new TypeError(
        'Abstract class "AbstractParticle" cannot be instantiated directly'
      );
    }
    this.startPosition = params.startPosition;
    this.startSize = params.startSize;
    this.randomness = Math.random();
    this.material = params.material;
    this.material.color.copy(params.color);
    this.material.opacity = params.opacity || 1;
  }

  getStartPosition() {
    return this.startPosition;
  }

  getStartSize() {
    return this.startSize;
  }

  getRandomness() {
    return this.randomness;
  }

  getMaterial() {
    return this.material;
  }
}

class SpriteParticle extends AbstractParticle {
  constructor(params) {
    super(params);
    this.sprite = null;
    this.initSprite();
  }

  initSprite() {
    this.sprite = new THREE.Sprite(super.getMaterial());
    this.sprite.scale.copy(super.getStartSize());
    this.sprite.position.copy(super.getStartPosition());
  }

  getSprite() {
    return this.sprite;
  }
}
