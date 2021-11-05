import { THREE } from 'ud-viz';

export class ParticleGroup {
  constructor(params) {
    this.object3D = new THREE.Object3D();
    this.particles = [];
    this.nParticles = params.nParticles;
    this.radiusRange = params.radiusRange;
    const defaultSprite = {
      startPosition: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random()
      ),
      startSize: new THREE.Vector3(),
      material: new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('/assets/img/butterflySprite.png'),
        useScreenCoordinates: false,
        color: 0xffffff,
      }),
      color: new THREE.Color(),
      opacity: 0.8,
    };
    this.initParticles(defaultSprite);
  }

  initParticles(spriteDefault) {
    for (let p = 0; p < this.nParticles; p++) {
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

export class SpriteParticle extends AbstractParticle {
  constructor(params) {
    super(params);
    this.sprite = null;
    this.initSprite();
  }

  initSprite() {
    const sprite = this.sprite;
    sprite = new THREE.Sprite(super.getMaterial());
    sprite.scale.set(super.getStartSize());
    sprite.position.set(super.getStartPosition());
  }

  getSprite() {
    return this.sprite;
  }
}
