import { ObjectInput } from '@ud-viz/game_editor';
import { ID } from '../../../../../shared/constant';
import { Vector3Input } from '@ud-viz/utils_browser';
import { Object3D } from '@ud-viz/game_shared';

export class Portal extends ObjectInput {
  init() {
    const spawnRotation = new Vector3Input('Spawn rotation: ', 'any');
    this.domElement.appendChild(spawnRotation);

    spawnRotation.x.input.value = this.object.spawnRotation.x;
    spawnRotation.y.input.value = this.object.spawnRotation.y;
    spawnRotation.z.input.value = this.object.spawnRotation.z;

    spawnRotation.addEventListener('change', () => {
      this.object.spawnRotation.x = spawnRotation.x.input.value;
      this.object.spawnRotation.y = spawnRotation.y.input.value;
      this.object.spawnRotation.z = spawnRotation.z.input.value;
    });

    // destination uuid + portail uuid
    const labelDestUUID = document.createElement('label');
    labelDestUUID.innerText = 'Destination';
    this.domElement.appendChild(labelDestUUID);

    const selectGameObjectDestUUID = document.createElement('select');
    this.domElement.appendChild(selectGameObjectDestUUID);

    const gameObjects3D = this.editor.userData.gameObjects3D.map(
      (el) => new Object3D(el)
    );

    gameObjects3D.forEach((g) => {
      const optionDestUUID = document.createElement('option');
      optionDestUUID.innerText = g.name;
      optionDestUUID.value = g.uuid;
      selectGameObjectDestUUID.appendChild(optionDestUUID);
    });
    selectGameObjectDestUUID.value = this.object.gameObjectDestUUID;
    if (selectGameObjectDestUUID.value == '') {
      selectGameObjectDestUUID.value =
        selectGameObjectDestUUID.options[0].value;
      this.object.gameObjectDestUUID = selectGameObjectDestUUID.value;
    }

    const labelPortalUUID = document.createElement('label');
    labelPortalUUID.innerText = 'Portail';
    this.domElement.appendChild(labelPortalUUID);

    const selectPortalUUID = document.createElement('select');
    this.domElement.appendChild(selectPortalUUID);

    const updatePortalSelectOption = () => {
      const goSelected = gameObjects3D.filter(
        (el) => el.uuid == selectGameObjectDestUUID.value
      )[0];

      while (selectPortalUUID.firstChild) selectPortalUUID.firstChild.remove();

      goSelected
        .filter((el) => el.userData.isPortal)
        .forEach((portal) => {
          const optionPortal = document.createElement('option');
          optionPortal.value = portal.uuid;
          optionPortal.innerText = portal.name;
          selectPortalUUID.appendChild(optionPortal);
        });

      selectPortalUUID.value = this.object.portalUUID;
      if (selectPortalUUID.value == '') {
        selectPortalUUID.value = selectPortalUUID.options[0].value;
        this.object.portalUUID = selectPortalUUID.options[0].value;
      }
    };
    updatePortalSelectOption();

    selectGameObjectDestUUID.oninput = () => {
      this.object.gameObjectDestUUID = selectGameObjectDestUUID.value;
      updatePortalSelectOption();
    };

    selectPortalUUID.oninput = () => {
      this.object.portalUUID = selectPortalUUID.value;
    };
  }

  static condition(id) {
    return id == ID.GAME_SCRIPT.PORTAL;
  }
}
