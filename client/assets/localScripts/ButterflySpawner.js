/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;
const threeType = require('three');
/** @type {threeType} */
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

    const render = this.go.getComponent(Shared.Render.TYPE);
    const editorMode = arguments[1].getGameView().getUserData('editorMode');

    if (editorMode === false) {
      const renderGO = render.getObject3D();
      renderGO.traverse(function (c) {
        if (c.material) {
          c.removeFromParent();
        }
      });
    }
  }

  tick() {
    if (this.triggerAnimate) this.animate();
  }

  animate() {
    const time = this.clock.getElapsedTime();
    this.particleGroup.getParticles().forEach((particle) => {
      particle.animate(time);
      if (time > particle.getLifeTime()) {
        this.particleGroup.removeParticle(particle);
      }
    });
    if (this.particleGroup.getParticles().length < 1) {
      this.triggerAnimate = false;
      this.particleGroup.getObject3D().removeFromParent();
      this.particleGroup = null;
    }
  }

  createParticuleGroup() {
    if (this.particleGroup) return;
    this.clock = new THREE.Clock();
    const butterflyAttributes = {
      startPosition: function () {
        return new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random()
        );
      },
      startSize: function () {
        return new THREE.Vector3(1, 1, 1);
      },
      material: function () {
        return new THREE.SpriteMaterial({
          map: new THREE.TextureLoader().load(
            '/assets/img/butterflySprite.png'
          ),
          color: 0xffffff,
        });
      },
      material2: function () {
        return new THREE.SpriteMaterial({
          map: new THREE.TextureLoader().load(
            '/assets/img/butterflySprite2.png'
          ),
          color: 0xffffff,
        });
      },
      color: function () {
        return new THREE.Color().setHSL(Math.random(), 0.9, 0.7);
      },
      length: function () {
        return 10 * Math.random();
      },
      minLife: 5,
      startOpacity: 0.8,
    };

    this.particleGroup = new ParticleGroup({
      nParticles: 10,
      radiusRange: 10,
      attributes: butterflyAttributes,
    });

    this.go
      .getComponent(Shared.Render.TYPE)
      .addObject3D(this.particleGroup.getObject3D());
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

    this.initParticles(params.attributes);
  }

  initParticles(spriteAttributes) {
    for (let p = 0; p < this.nParticles; p++) {
      const newSpriteParticle = new SpriteParticle(spriteAttributes);
      this.object3D.add(newSpriteParticle.getSprite());
      this.particles.push(newSpriteParticle);
    }
  }

  removeParticle(particle) {
    const index = this.particles.indexOf(particle);
    if (index >= 0) this.particles.splice(index, 1);
    this.getObject3D().remove(particle.getSprite());
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
    this.startPosition = params.startPosition();
    this.startPosition.setLength(params.length());
    this.startSize = params.startSize();
    this.randomness = Math.random();
    const maxLife = params.maxLife || 10,
      minLife = params.minLife || maxLife;
    if (minLife > maxLife) console.error('params life time error');

    this.lifeTime = this.randomness * (maxLife - minLife) + minLife;
    this.material = params.material();
    this.material2 = params.material2();
    this.material.color.copy(params.color());
    this.material2.color.copy(this.material.color);
    this.startOpacity = params.startOpacity || 1;
    this.material.opacity = this.startOpacity;
    this.material2.opacity = this.startOpacity;
  }

  getStartPosition() {
    return this.startPosition;
  }

  getStartSize() {
    return this.startSize;
  }

  getStartOpacity() {
    return this.startOpacity;
  }

  getRandomness() {
    return this.randomness;
  }

  getMaterial() {
    return this.material;
  }

  getMaterial2() {
    return this.material2;
  }

  getLifeTime() {
    return this.lifeTime;
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

  animate(time) {
    const a = this.randomness + 1;
    const pulseFactor = Math.sin(a * time) * 0.1 + 0.9;

    this.sprite.position.copy(
      super.getStartPosition().clone().multiplyScalar(pulseFactor)
    );

    this.sprite.material =
      Math.floor(time + this.randomness) % 2 == 0
        ? super.getMaterial()
        : super.getMaterial2();

    this.fade(super.getLifeTime() * 0.2, super.getLifeTime() * 0.8, time);
  }

  fade(inTime, outTime, time) {
    const startOpacity = super.getStartOpacity();
    const lifeTime = super.getLifeTime();
    let spriteOpacity = this.sprite.material.opacity;

    if (time <= inTime && spriteOpacity <= startOpacity)
      spriteOpacity = (time * startOpacity) / inTime;
    else if (time >= outTime && spriteOpacity >= 0) {
      spriteOpacity =
        startOpacity - ((time - outTime) / (lifeTime - outTime)) * startOpacity;
    }

    this.sprite.material.opacity = spriteOpacity;
  }
}
