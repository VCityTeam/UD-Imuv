import { ScriptBase } from '@ud-viz/game_browser';
import { Box3, Color } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import './menuAvatar.css';
import { Command, RenderComponent } from '@ud-viz/game_shared';
import { COMMAND } from '../../../shared/constant';
import {
  createLabelInput,
  readSingleFileAsDataUrl,
} from '@ud-viz/utils_browser';
import { request } from '../../utils';

export class MenuAvatar extends ScriptBase {
  init() {
    const orbitControls = new OrbitControls(
      this.context.frame3D.camera,
      this.context.frame3D.renderer.domElement
    );

    const bb = new Box3().setFromObject(this.object3D);
    orbitControls.target.copy(bb.min.lerp(bb.max, 0.5));
    this.context.frame3D.camera.position.set(2, 2, 2);

    orbitControls.update();
    this.context.frame3D.onResize();

    const renderComp = this.object3D.getComponent(RenderComponent.TYPE);

    const domElement = document.createElement('div');
    domElement.classList.add('root_menu_avatar');
    this.context.frame3D.domElementUI.appendChild(domElement);

    // choose avatar model
    const selectAvatarModel = document.createElement('select');
    domElement.appendChild(selectAvatarModel);

    ['avatar_petit', 'avatar_moyen', 'avatar_grand'].forEach(
      (idAvatarModel) => {
        const option = document.createElement('option');
        option.innerText = idAvatarModel;
        option.value = idAvatarModel;

        selectAvatarModel.appendChild(option);

        if (renderComp.model.idRenderData == idAvatarModel)
          selectAvatarModel.value = idAvatarModel;
      }
    );

    selectAvatarModel.onchange = () => {
      this.context.sendCommandsToGameContext([
        new Command({
          type: COMMAND.EDIT_AVATAR,
          data: {
            idRenderData: selectAvatarModel.selectedOptions[0].value,
          },
        }),
      ]);
    };

    // change model color
    const avatarColor = createLabelInput('Couleur: ', 'color');
    domElement.appendChild(avatarColor.parent);

    // init
    avatarColor.input.value =
      '#' + new Color().fromArray(renderComp.model.color).getHexString();

    avatarColor.input.onchange = () => {
      this.context.sendCommandsToGameContext([
        new Command({
          type: COMMAND.EDIT_AVATAR,
          data: {
            color: [...new Color(avatarColor.input.value).toArray(), 1],
          },
        }),
      ]);
    };

    // change texture face
    const textureFace = createLabelInput('Texture face: ', 'file');
    domElement.appendChild(textureFace.parent);

    textureFace.input.onchange = (e) => {
      readSingleFileAsDataUrl(e, (data) => {
        this.context.sendCommandsToGameContext([
          new Command({
            type: COMMAND.EDIT_AVATAR,
            data: {
              textureFacePath: data.target.result,
            },
          }),
        ]);
      });
    };

    const saveButton = document.createElement('img');
    saveButton.src = './assets/img/ui/icon_save.png';
    domElement.appendChild(saveButton);
    saveButton.onclick = () => {
      request(
        window.origin + '/save_avatar',
        this.object3D.toJSON(),
        'text'
      ).then(this.context.userData.closeMenuCallback);
    };

    const closeButton = document.createElement('img');
    closeButton.src = './assets/img/ui/icon_close.png';
    domElement.appendChild(closeButton);
    closeButton.onclick = this.context.userData.closeMenuCallback;
  }

  static get ID_SCRIPT() {
    return 'menu_avatar_ext_script_id';
  }
}
