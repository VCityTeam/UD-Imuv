import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';

export class GeoProject extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.sprite = null;
  }

  init() {
    this.updateSprite();
  }

  /**
   * It creates a sprite from the image at `conf.image_icon_path` and adds it to the `Render` component
   * of the game object
   */
  updateSprite() {
    // image
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }

    // create image conf.image_icon_path on a quad above the pin
    const onLoad = (texture) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
      });

      this.sprite = new THREE.Sprite(material);
      this.sprite.scale.set(
        this.variables.image_width,
        this.variables.image_height,
        1
      );

      const r = this.object3D.getComponent(RenderComponent.TYPE);
      r.getController().addObject3D(this.sprite);
    };

    new THREE.TextureLoader().load(this.variables.image_icon_path, onLoad);
  }

  onOutdated() {
    this.updateSprite();
  }

  /**
   * When image is clicked redirection to conf.href
   */
  onClick() {
    const a = document.createElement('a');
    a.href = this.variables.href;
    a.target = '_blank';
    a.click();
  }

  static get ID_SCRIPT() {
    return 'geo_project_id_ext_script';
  }
}
