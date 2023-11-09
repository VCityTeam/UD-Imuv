import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';
import { ID } from '../../shared/constant';

export class SpriteName extends ScriptBase {
  init() {
    this.sprite = null;
    this.updateSprite();
  }

  createSprite(label) {
    const texture = this.createLabelTexture(label, 'rgba(255, 255, 255, 0)');
    const material = new THREE.SpriteMaterial({
      map: texture,
    });
    material.alphaTest = 0.5;
    const result = new THREE.Sprite(material);
    result.scale.set(1, 0.3, 1);
    return result;
  }

  createLabelTexture(text, clearColor) {
    // create texture with name on it
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';

    const wT = ctx.measureText(text).width;

    canvas.width = Math.ceil(wT);

    // force to bind it after changing the canvas.width
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';

    ctx.fillText(text, (canvas.width - wT) * 0.5, canvas.height * 0.5);

    const texture = new THREE.TextureLoader().load(
      canvas.toDataURL('image/png')
    );
    texture.flipY = true;
    texture.flipX = true;

    return texture;
  }

  updateSprite() {
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }

    const renderComp = this.object3D.getComponent(RenderComponent.TYPE);
    const bb = new THREE.Box3().setFromObject(
      renderComp.getController().object3D
    );
    const sprite = this.createSprite(this.variables.name);
    const bbSprite = new THREE.Box3().setFromObject(sprite);
    sprite.position.z = bb.max.z + 0.5 * (bbSprite.max.y - bbSprite.min.y);
    sprite.position.z -= bb.min.z;
    renderComp.getController().renderData.object3D.add(sprite);

    this.sprite = sprite;
  }

  onRenderComponentChanged() {
    this.updateSprite();
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.SPRITE_NAME;
  }
}
