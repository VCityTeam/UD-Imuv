import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';
import * as THREE from 'three';
import { ID } from '../../shared/constant';

export class ButterflySpawner extends ScriptBase {
  init() {
    this.triggerAnimate = false;
    this.particleGroup = null;
    this.clock = null;

    // TODO in UserData add attribute "editorMode" ?
    const render = this.object3D.getComponent(RenderComponent.TYPE);
    const editorMode = false;

    if (editorMode === true) return;

    const renderGO = render.getController().getObject3D();
    renderGO.traverse(function (c) {
      if (c.material) {
        c.removeFromParent();
      }
    });
  }

  onEnter() {
    this.createParticuleGroup();
  }

  tick() {
    if (this.triggerAnimate) this.animate();
  }

  animate() {
    const time = this.clock.getElapsedTime();
    this.particleGroup.getParticles().forEach((particle) => {
      particle.animate(time);
      if (time > particle.lifeTime) {
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

    this.particleGroup = new ButterlyParticleGroup({
      nParticles: 10,
      radiusRange: 10,
    });

    this.object3D
      .getComponent(RenderComponent.TYPE)
      .getController()
      .addObject3D(this.particleGroup.getObject3D());
    this.triggerAnimate = true;
  }

  onOutdated() {
    if (this.variables.onEnter) {
      // shoudl use local interaction pattern TODO
      this.createParticuleGroup();
    }
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.BUTTERFLY_SPAWNER;
  }
}

class ButterlyParticleGroup {
  constructor(params) {
    this.object3D = new THREE.Object3D();
    this.particles = [];
    this.nParticles = params.nParticles;
    this.radiusRange = params.radiusRange;

    this.spriteMaterials = {
      butterflyOpen: new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('./assets/img/butterflySprite.png'),
        color: 0xffffff,
      }),
      butterflyClose: new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load(
          './assets/img/butterflySprite2.png'
        ),
        color: 0xffffff,
      }),
    };

    this.initParticles();
  }

  initParticles() {
    for (let p = 0; p < this.nParticles; p++) {
      const randColor = new THREE.Color().setHSL(Math.random(), 0.9, 0.7);
      const mat1 = this.spriteMaterials.butterflyOpen.clone();
      mat1.color.copy(randColor);

      const mat2 = this.spriteMaterials.butterflyClose.clone();
      mat2.color.copy(randColor);

      const newButterflyParticle = new ButterflyParticle([mat1, mat2]);
      this.object3D.add(newButterflyParticle.sprite);
      this.particles.push(newButterflyParticle);
    }
  }

  removeParticle(particle) {
    const index = this.particles.indexOf(particle);
    if (index >= 0) this.particles.splice(index, 1);
    this.getObject3D().remove(particle.sprite);
  }

  getParticles() {
    return this.particles;
  }

  getObject3D() {
    return this.object3D;
  }
}

class ButterflyParticle {
  constructor(
    materials,
    opacity = 0.8,
    position = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random()
    ),
    scale = new THREE.Vector3(1, 1, 1),
    minLife = 5,
    maxLife = 10
  ) {
    this.materials = materials;
    this.opacity = opacity;

    this.position = position;
    this.position.setLength(10 * Math.random());
    this.scale = scale;

    this.randomness = Math.random();
    this.lifeTime = this.randomness * (maxLife - minLife) + minLife;

    this.sprite = null;
    this.initSprite();
  }

  initSprite() {
    this.sprite = new THREE.Sprite(this.materials[0].clone());
    this.sprite.scale.copy(this.scale);
    this.sprite.position.copy(this.position);
  }

  animate(time) {
    const a = this.randomness + 1;
    const pulseFactor = Math.sin(a * time) * 0.1 + 0.9;

    this.sprite.position.copy(
      this.position.clone().multiplyScalar(pulseFactor)
    );

    this.sprite.material =
      Math.floor(time + this.randomness) % 2 == 0
        ? this.materials[0].clone()
        : this.materials[1].clone();

    this.fade(this.lifeTime * 0.2, this.lifeTime * 0.8, time);
  }

  fade(inTime, outTime, time) {
    const startOpacity = this.opacity;
    const lifeTime = this.lifeTime;
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
