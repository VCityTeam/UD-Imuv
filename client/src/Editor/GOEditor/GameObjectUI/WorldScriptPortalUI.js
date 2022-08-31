import WorldScriptModule from 'ud-viz/src/Game/GameObject/Components/WorldScript';
import { World } from 'ud-viz/src/Game/Game';
import { THREE } from 'ud-viz';

export class WorldScriptPortalUI {
  constructor(goui, wS, gV) {
    const portalContent = document.createElement('div');

    const spawnRot = wS['portal'].conf.spawnRotation;
    //spawn rot input
    if (!spawnRot) throw new Error('no spawn rotation');

    const labelSpawnRot = document.createElement('div');
    labelSpawnRot.innerHTML = 'Portal spawn rotation';
    portalContent.appendChild(labelSpawnRot);

    const buttonChangeSpawnRotation = document.createElement('button');
    buttonChangeSpawnRotation.innerHTML = 'Change Spawn Rotation';
    portalContent.appendChild(buttonChangeSpawnRotation);

    buttonChangeSpawnRotation.onclick = function() {
      const cloneClearUiEditor = document.createElement('div');
      cloneClearUiEditor.classList.add('ui_Editor');
      goui.goEditor.ui.offsetParent.parentElement.appendChild(
        cloneClearUiEditor
      );

      const transformObject3D = new THREE.Object3D();
      transformObject3D.name = 'TransformObject';
      gV.getScene().add(transformObject3D);
      gV.setCallbackPointerUp(null);

      const geometry = new THREE.ConeGeometry(0.5, 1, 6);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const cone = new THREE.Mesh(geometry, material);
      cone.rotation.set(spawnRot.x, spawnRot.y, spawnRot.z);
      transformObject3D.add(cone);

      const posOffset = gV
        .getObject3D()
        .position.clone()
        .add(goui.go.computeWorldTransform().position);

      cone.position.copy(posOffset);
      gV.orbitControls.target.copy(cone.position);
      gV.orbitControls.update();

      const cbOnChange = function() {
        cone.rotation.set(spawnRot.x, spawnRot.y, spawnRot.z);
      };

      cloneClearUiEditor.appendChild(
        goui.createInputFromVector3(spawnRot, cbOnChange)
      );

      //TODO : reselect the portal ocjet in order to reactivate the selection by clicking
      const validateButton = document.createElement('button');
      validateButton.innerHTML = 'VALIDATE';
      validateButton.classList = 'validate_button';
      cloneClearUiEditor.appendChild(validateButton);
      validateButton.onclick = function() {
        transformObject3D.removeFromParent();
        cloneClearUiEditor.remove();
      };

      transformObject3D.updateMatrixWorld();
    };

    //world uuid
    const worldsJSON = gV.getAssetsManager().getWorldsJSON();
    const wCxt = gV.getInterpolator().getWorldContext();
    const currentWorld = wCxt.getWorld();
    //replace current world json because it can be modified
    for (let index = 0; index < worldsJSON.length; index++) {
      const json = worldsJSON[index];
      if (json.uuid == currentWorld.getUUID()) {
        //found
        const newContent = currentWorld.toJSON();
        worldsJSON[index] = newContent;
        break;
      }
    }

    const labelWorlds = document.createElement('div');
    labelWorlds.innerHTML = 'World Destination';
    portalContent.appendChild(labelWorlds);

    const selectPortal = document.createElement('select');
    portalContent.appendChild(selectPortal);

    const createPortalsOptions = function(optGrp, wjson) {
      const worldPortal = new World(wjson);
      worldPortal.getGameObject().traverse(function(child) {
        const wS = child.getComponent(WorldScriptModule.TYPE);
        if (wS && wS.idScripts.includes('portal')) {
          const optionPortal = document.createElement('option');
          optionPortal.value = child.uuid;
          optionPortal.innerHTML = child.name;
          optGrp.appendChild(optionPortal);
        }
      });
    };

    const unsetOptionPortal = document.createElement('option');
    unsetOptionPortal.value = 'null';
    unsetOptionPortal.innerHTML = 'None';
    selectPortal.appendChild(unsetOptionPortal);

    //Fill selectPortal Htmlelements
    worldsJSON.forEach(function(wjson) {
      const optGroup = document.createElement('optgroup');
      optGroup.title = wjson.uuid;
      optGroup.label = wjson.name;
      selectPortal.appendChild(optGroup);
      createPortalsOptions(optGroup, wjson);
    });

    selectPortal.onchange = function() {
      const options = selectPortal.getElementsByTagName('option');
      const iSelect = selectPortal.selectedIndex;
      const optionSelected = options[iSelect];

      wS['portal'].conf.worldDestUUID =
        iSelect !== 0 ? optionSelected.parentElement.title : null;
      wS['portal'].conf.portalUUID = selectPortal.value;
    };

    //select right value
    const currentPortalValue = wS['portal'].conf.portalUUID;
    const options = selectPortal.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
      if (options[i].value == currentPortalValue) {
        options[i].selected = true;
        selectPortal.dispatchEvent(new Event('change'));
        break;
      }
    }

    goui.content.appendChild(portalContent);
  }
}
