import { ScriptInput } from '@ud-viz/game_editor';
import { ID } from '../../../../shared/constant';
import { Vector3Input } from '@ud-viz/utils_browser';
import { Object3D } from '@ud-viz/game_shared';

export class Portal extends ScriptInput {
  init() {
    const spawnRotation = new Vector3Input('Spawn rotation: ', 'any');
    this.domElement.appendChild(spawnRotation);

    spawnRotation.x.input.value = this.variables.spawnRotation.x;
    spawnRotation.y.input.value = this.variables.spawnRotation.y;
    spawnRotation.z.input.value = this.variables.spawnRotation.z;

    spawnRotation.addEventListener('change', () => {
      this.variables.spawnRotation.x = spawnRotation.x.input.value;
      this.variables.spawnRotation.y = spawnRotation.y.input.value;
      this.variables.spawnRotation.z = spawnRotation.z.input.value;
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
    selectGameObjectDestUUID.value = this.variables.gameObjectDestUUID;
    if (selectGameObjectDestUUID.value == '') {
      selectGameObjectDestUUID.value =
        selectGameObjectDestUUID.options[0].value;
      this.variables.gameObjectDestUUID = selectGameObjectDestUUID.value;
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

      selectPortalUUID.value = this.variables.portalUUID;
      if (selectPortalUUID.value == '') {
        selectPortalUUID.value = selectPortalUUID.options[0].value;
        this.variables.portalUUID = selectPortalUUID.options[0].value;
      }
    };
    updatePortalSelectOption();

    selectGameObjectDestUUID.oninput = () => {
      this.variables.gameObjectDestUUID = selectGameObjectDestUUID.value;
      updatePortalSelectOption();
    };

    selectPortalUUID.oninput = () => {
      this.variables.portalUUID = selectPortalUUID.value;
    };
  }

  get ID_EDIT_SCRIPT() {
    return Portal.ID_EDIT_SCRIPT;
  }

  static get ID_EDIT_SCRIPT() {
    return ID.GAME_SCRIPT.PORTAL;
  }
}
