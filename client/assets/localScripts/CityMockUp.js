/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const gameType = require('ud-viz/src/Game/Game');
/** @type {gameType} */
let Game = null;

module.exports = class CityMockUp {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udvizBundle.Game;

    //buffer
    this.itownsCamPos = null;
    this.itownsCamQuat = null;

    //3D object
    this.mockUpObject = null;
    this.selectedAreaObject = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    if (localCtx.getGameView().getUserData('isEditorGameView')) {
      //add a plane 1,1 to well adjust the go transform
      const geometry = new Game.THREE.PlaneGeometry(1, 1);
      const material = new Game.THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: Game.THREE.DoubleSide,
      });
      const plane = new Game.THREE.Mesh(geometry, material);

      const renderComp = go.getComponent(Game.Render.TYPE);
      renderComp.addObject3D(plane);
    }

    //Custom refine the conf area

    const boundingVolumeBox = new udviz.THREE.Box3();

    const layerManager = localCtx.getGameView().getLayerManager();
    layerManager.tilesManagers.forEach((tileManager) => {
      tileManager.layer.update = udviz.itowns.process3dTilesNode(
        (layer, camera, node, tileMatrixWorld) => {
          if (!node.boundingVolume || !node.boundingVolume.box) return true; //do not requet (culling it)

          boundingVolumeBox.copy(node.boundingVolume.box);
          boundingVolumeBox.applyMatrix4(tileMatrixWorld);

          return !this.intersectArea(
            boundingVolumeBox.min,
            boundingVolumeBox.max
          ); //request if it is intersected area
        },
        (context, layer, node) => {
          if (layer.tileset.tiles[node.tileId].children === undefined) {
            return false; // I guess no object so no refine
          }
          if (layer.tileset.tiles[node.tileId].isTileset) {
            return true; //refine if it's tileset
          }

          boundingVolumeBox.copy(node.boundingVolume.box);
          boundingVolumeBox.applyMatrix4(node.matrixWorld);

          return this.intersectArea(
            boundingVolumeBox.min,
            boundingVolumeBox.max
          ); //refine if it's intersecting area
        }
      );

      tileManager.addEventListener(
        udviz.Components.TilesManager.EVENT_TILE_LOADED,
        (tile) => {
          const boundingBox = new Game.THREE.Box3().setFromObject(tile);

          //only update if tile intersect the area
          if (this.intersectArea(boundingBox.min, boundingBox.max)) {
            this.updateMockUpObject(localCtx, go);
          }
        }
      );
    });

    //add tool
    const scriptUI = localCtx.findLocalScriptWithID('ui');
    const cameraScript = localCtx.findLocalScriptWithID('camera');
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');
    const camera = gameView.getCamera();
    const menu = new MenuCityMockUp(localCtx, go);
    scriptUI.addTool(
      './assets/img/ui/icon_mock_up.png',
      'Maquette',
      (resolve, reject, onClose) => {
        if (cameraScript.hasRoutine()) {
          resolve(false); //already routine
          return;
        }

        const duration = 2000;
        let currentTime = 0;

        const startPos = camera.position.clone();
        const startQuat = camera.quaternion.clone();

        if (onClose) {
          //record
          this.itownsCamPos.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          this.itownsCamQuat.setFromEuler(camera.rotation);

          //disable itowns rendering
          gameView.setItownsRendering(false);

          cameraScript.addRoutine(
            new Game.Components.Routine(
              (dt) => {
                const t = cameraScript
                  .getFocusCamera()
                  .computeTransformTarget(
                    null,
                    cameraScript.getDistanceCameraAvatar()
                  );

                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
                avatarController.setAvatarControllerMode(true, localCtx);
                resolve(true);
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);

          if (!this.itownsCamPos && !this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new Game.THREE.Vector3().copy(
              camera.position
            );

            //200 meters up
            const endPosition = new Game.THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new Game.THREE.Quaternion().setFromEuler(
              new Game.THREE.Euler(0.01, 0, 0)
            );

            this.itownsCamPos = endPosition;
            this.itownsCamQuat = endQuaternion;
          }

          cameraScript.addRoutine(
            new Game.Components.Routine(
              (dt) => {
                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = this.itownsCamPos.clone().lerp(startPos, 1 - ratio);
                const q = this.itownsCamQuat
                  .clone()
                  .slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
                menu.enable();
                resolve(true);
              }
            )
          );
        }
      },
      menu
    );

    //DEBUG
    gameView.getInputManager().addKeyInput('a', 'keyup', () => {
      this.updateMockUpObject(localCtx, go);
    });
  }

  intersectArea(min, max) {
    const area = this.conf.area;

    if (!area.start || !area.end) return false;

    //TODO could be optimize if not compute at each intersect
    const minArea = new Game.THREE.Vector2(
      Math.min(area.start[0], area.end[0]),
      Math.min(area.start[1], area.end[1])
    );
    const maxArea = new Game.THREE.Vector2(
      Math.max(area.start[0], area.end[0]),
      Math.max(area.start[1], area.end[1])
    );

    return (
      minArea.x <= max.x &&
      maxArea.x >= min.x &&
      minArea.y <= max.y &&
      maxArea.y >= min.y
    );
  }

  updateMockUpObject(localCtx, go) {
    const area = this.conf.area;
    console.log('UPDATE MOCK UP => ', area);

    if (area.start && area.end) {
      const gameView = localCtx.getGameView();

      //update 3DTiles mock up object
      if (this.mockUpObject && this.mockUpObject.parent) {
        this.mockUpObject.parent.remove(this.mockUpObject);
      }

      //parse geometry intersected
      const materialsMockup = [];
      const geometryMockUp = new Game.THREE.BufferGeometry();
      const positionsMockUp = [];
      const normalsMockUp = [];

      const addToFinalMockUp = (positions, normals, material) => {
        let materialIndex = -1;
        for (let index = 0; index < materialsMockup.length; index++) {
          const m = materialsMockup[index];
          if (m.uuid == material.uuid) {
            materialIndex = index;
            break;
          }
        }
        if (materialIndex == -1) {
          materialsMockup.push(material);
          materialIndex = materialsMockup.length - 1;
        }

        //TODO could mix group between them
        geometryMockUp.addGroup(
          positionsMockUp.length / 3,
          positions.length / 3,
          materialIndex
        );

        positionsMockUp.push(...positions);
        normalsMockUp.push(...normals);
      };

      const layerManager = gameView.getLayerManager();
      layerManager.tilesManagers.forEach((tileManager) => {
        const object = tileManager.layer.root;

        if (!object) return;

        //gml and cityobjectid intersecting area
        const cityObjectIDs = [];
        const gmlIds = [];

        //add cityobject intersecting area
        object.traverse((child) => {
          if (child.geometry && !child.userData.metadata.children) {
            const tileId = udviz.Components.getTileFromMesh(child).tileId;

            //check if its belong to the area
            const bb = child.geometry.boundingBox;

            const minChild = bb.min.clone().applyMatrix4(child.matrixWorld);
            const maxChild = bb.max.clone().applyMatrix4(child.matrixWorld);

            if (this.intersectArea(minChild, maxChild)) {
              //check more precisely what batchID intersect
              const positions = child.geometry.attributes.position.array;
              const normals = child.geometry.attributes.normal.array;
              const batchIds = child.geometry.attributes._BATCHID.array;

              if (
                positions.length != normals.length ||
                positions.length != 3 * batchIds.length
              ) {
                throw 'wrong count geometry';
              }

              //buffer attr
              let minBB, maxBB;

              const currentPositions = [];
              const currentNormals = [];
              let currentCount = -1;
              const position = new Game.THREE.Vector3();
              const normal = new Game.THREE.Vector3();
              const normalMatrixWorld =
                new Game.THREE.Matrix3().getNormalMatrix(child.matrixWorld);

              //check if the current positions normals should be add to mockup geometry
              const checkCurrentBatch = () => {
                //find material
                const groups = child.geometry.groups;
                let currentMaterial;
                for (let j = 0; j < groups.length; j++) {
                  const group = groups[j];
                  if (
                    currentCount >= group.start &&
                    currentCount <= group.start + group.count
                  ) {
                    //include
                    currentMaterial = child.material[group.materialIndex];
                    break;
                  }
                }

                if (!currentMaterial) throw 'do not find material';

                //compute bb
                minBB = new Game.THREE.Vector2(Infinity, Infinity); //reset
                maxBB = new Game.THREE.Vector2(-Infinity, -Infinity); //reset

                for (
                  let index = 0;
                  index < currentPositions.length;
                  index += 3
                ) {
                  const x = currentPositions[index];
                  const y = currentPositions[index + 1];

                  minBB.x = Math.min(x, minBB.x);
                  minBB.y = Math.min(y, minBB.y);
                  maxBB.x = Math.max(x, maxBB.x);
                  maxBB.y = Math.max(y, maxBB.y);
                }

                if (this.intersectArea(minBB, maxBB)) {
                  //intersect area should be add
                  addToFinalMockUp(
                    currentPositions,
                    currentNormals,
                    currentMaterial
                  );

                  //record cityobject id and gml id for further pass
                  cityObjectIDs.push(
                    new udviz.Components.CityObjectID(tileId, currentBatchID)
                  );

                  const gmlID =
                    tileManager.tiles[tileId].cityObjects[currentBatchID].props
                      .gml_id;

                  if (!gmlIds.includes(gmlID)) gmlIds.push(gmlID);
                }

                //reset
                currentPositions.length = 0;
                currentNormals.length = 0;
              };

              let currentBatchID = batchIds[0];
              for (let i = 0; i < positions.length; i += 3) {
                const count = i / 3;
                currentCount = count;
                const batchID = batchIds[count];

                if (currentBatchID != batchID) {
                  //new batch id check if previous one should be add to geometry
                  checkCurrentBatch();
                  currentBatchID = batchID;
                }

                //position
                position.x = positions[i];
                position.y = positions[i + 1];
                position.z = positions[i + 2];

                //add world position
                position.applyMatrix4(child.matrixWorld);
                currentPositions.push(position.x);
                currentPositions.push(position.y);
                currentPositions.push(position.z);

                //normal
                normal.x = normals[i];
                normal.y = normals[i + 1];
                normal.z = normals[i + 2];

                //add world normal
                normal.applyMatrix3(normalMatrixWorld);
                currentNormals.push(normal.x);
                currentNormals.push(normal.y);
                currentNormals.push(normal.z);
              }
              //the last batchID has not been checked
              checkCurrentBatch();
            }
          }
        });

        //add missing batch if not intersected
        object.traverse((child) => {
          if (child.geometry && !child.userData.metadata.children) {
            const tileId = udviz.Components.getTileFromMesh(child).tileId;

            //atributes
            const positions = child.geometry.attributes.position.array;
            const normals = child.geometry.attributes.normal.array;
            const batchIds = child.geometry.attributes._BATCHID.array;

            if (
              positions.length != normals.length ||
              positions.length != 3 * batchIds.length
            ) {
              throw 'wrong count geometry';
            }

            const normalMatrixWorld = new Game.THREE.Matrix3().getNormalMatrix(
              child.matrixWorld
            );

            for (let i = 0; i < batchIds.length; i++) {
              const batchID = batchIds[i];
              const cityObjectId = new udviz.Components.CityObjectID(
                tileId,
                batchID
              );

              const cityObject = tileManager.getCityObject(cityObjectId);

              const gmlID = cityObject.props.gml_id;

              if (gmlIds.includes(gmlID)) {
                //cityobject having a gmlid intersecting
                let alreadyAdded = false;
                for (let j = 0; j < cityObjectIDs.length; j++) {
                  const alreadyAddCityObjectID = cityObjectIDs[j];
                  if (cityObjectId.equal(alreadyAddCityObjectID)) {
                    alreadyAdded = true;
                    break;
                  }
                }

                if (!alreadyAdded) {
                  //cityobject not intersecting but having a gml id intersecting
                  const chunkPositions = positions.slice(
                    cityObject.indexStart * 3,
                    (cityObject.indexEnd + 1) * 3
                  ); //+1 because slice does not include last index

                  const chunkNormals = normals.slice(
                    cityObject.indexStart * 3,
                    (cityObject.indexEnd + 1) * 3
                  );

                  if (cityObject.indexCount <= 2) {
                    throw 'wrong indexCount';
                  }

                  //apply world transform
                  const position = new Game.THREE.Vector3();
                  const normal = new Game.THREE.Vector3();
                  for (let j = 0; j < chunkPositions.length; j += 3) {
                    //position
                    position.x = chunkPositions[j];
                    position.y = chunkPositions[j + 1];
                    position.z = chunkPositions[j + 2];

                    //add world position
                    position.applyMatrix4(child.matrixWorld);
                    chunkPositions[j] = position.x;
                    chunkPositions[j + 1] = position.y;
                    chunkPositions[j + 2] = position.z;

                    //normal
                    normal.x = chunkNormals[j];
                    normal.y = chunkNormals[j + 1];
                    normal.z = chunkNormals[j + 2];

                    //add world normal
                    normal.applyMatrix3(normalMatrixWorld);
                    chunkNormals[j] = normal.x;
                    chunkNormals[j + 1] = normal.y;
                    chunkNormals[j + 2] = normal.z;
                  }

                  //one cityobject get one material index dynamic search
                  const count = cityObject.indexStart;
                  let added = false; //just for debug
                  for (let j = 0; j < child.geometry.groups.length; j++) {
                    const group = child.geometry.groups[j];

                    if (
                      count >= group.start &&
                      count <= group.start + group.count
                    ) {
                      //found material add to mock up and break
                      addToFinalMockUp(
                        chunkPositions,
                        chunkNormals,
                        child.material[group.materialIndex]
                      );
                      added = true;
                      break;
                    }
                  }
                  if (!added) throw 'do not find material'; //just for debug
                }
              }
            }
          }
        });
      });

      //create mock up from geometry
      geometryMockUp.setAttribute(
        'position',
        new Game.THREE.BufferAttribute(new Float32Array(positionsMockUp), 3)
      );
      geometryMockUp.setAttribute(
        'normal',
        new Game.THREE.BufferAttribute(new Float32Array(normalsMockUp), 3)
      );

      //center geometryockUp on xy and put it at zero on z
      geometryMockUp.computeBoundingBox();
      const bbMockUp = geometryMockUp.boundingBox;
      const centerMockUp = bbMockUp.min.clone().lerp(bbMockUp.max, 0.5);
      const geoPositionsMockUp = geometryMockUp.attributes.position.array;
      for (let index = 0; index < geoPositionsMockUp.length; index += 3) {
        geoPositionsMockUp[index] -= centerMockUp.x;
        geoPositionsMockUp[index + 1] -= centerMockUp.y;
        geoPositionsMockUp[index + 2] -= bbMockUp.min.z; //so it's on the table
      }

      //create mesh
      this.mockUpObject = new Game.THREE.Mesh(geometryMockUp, materialsMockup);
      this.mockUpObject.name = 'MockUp Object';
      const renderComp = go.getComponent(Game.Render.TYPE);
      renderComp.addObject3D(this.mockUpObject);

      console.log('Legonizer');
      const heigtMap = legonizer(geometryMockUp, 50);
      console.log('End Legonizer');
      generateCSV(heigtMap);
      //adapt scale to fit the table
      const widthMockUp = bbMockUp.max.x - bbMockUp.min.x;
      const depthMockUp = bbMockUp.max.y - bbMockUp.min.y;
      const widthTable = go.getScale().x; //edited via editor
      const depthTable = go.getScale().y; //edited via editor
      const minMockUpScale = Math.min(1 / widthMockUp, 1 / depthMockUp);
      const minTableScale = Math.min(widthTable, depthTable);
      //scale = constant / go.scale => remain mockup proportion
      this.mockUpObject.scale.set(
        (minTableScale * minMockUpScale) / widthTable,
        (minTableScale * minMockUpScale) / depthTable,
        (minTableScale * minMockUpScale) / 1
      );

      //update selectedAreaObject
      if (this.selectedAreaObject && this.selectedAreaObject.parent) {
        this.selectedAreaObject.parent.remove(this.selectedAreaObject);
      }
      const minArea = new Game.THREE.Vector3(
        Math.min(area.start[0], area.end[0]),
        Math.min(area.start[1], area.end[1])
      );
      const maxArea = new Game.THREE.Vector3(
        Math.max(area.start[0], area.end[0]),
        Math.max(area.start[1], area.end[1])
      );
      const dim = maxArea.clone().sub(minArea);
      const geometrySelectedArea = new Game.THREE.BoxGeometry(
        dim.x,
        dim.y,
        500
      ); //500 HARD CODED TODO compute minZ and maxZ
      this.selectedAreaObject = new Game.THREE.Mesh(
        geometrySelectedArea,
        new Game.THREE.MeshBasicMaterial({
          color: new Game.THREE.Color().fromArray([0, 1, 0]),
          opacity: 0.5,
          transparent: true,
        })
      );
      this.selectedAreaObject.name = 'Selected Area MockUp';
      this.selectedAreaObject.position.lerpVectors(minArea, maxArea, 0.5);
      this.selectedAreaObject.renderOrder = 2; //render after preview of selected area

      gameView.getScene().add(this.selectedAreaObject);
    }
  }

  onOutdated() {
    this.updateMockUpObject(arguments[1], arguments[0]);
  }
};

//TODO Raycast method
/**
 *
 * @param {BufferGeometry} geometryBuffer
 */
function legonizer(geometryBuffer, ratioXY) {
  geometryBuffer.computeBoundingBox();
  const bbMockUp = geometryBuffer.boundingBox;

  const widthMockUp = bbMockUp.max.x - bbMockUp.min.x;

  const distanceEntrePoint = widthMockUp / ratioXY;
  const ratioY = Math.trunc(
    Math.abs(bbMockUp.min.y - bbMockUp.max.y) / distanceEntrePoint
  );

  const mesh = new Game.THREE.Mesh(geometryBuffer);

  const raycaster = new Game.THREE.Raycaster();
  const maxZMockup = bbMockUp.max.z;

  const heightMap = Array.from(Array(ratioXY), () => new Array(ratioY));

  for (let i = 0; i < ratioXY; i++) {
    for (let j = 0; j < ratioY; j++) {
      const positionRaycast = new Game.THREE.Vector3(
        bbMockUp.min.x + i * distanceEntrePoint,
        bbMockUp.min.y + j * distanceEntrePoint,
        maxZMockup
      );
      raycaster.set(positionRaycast, new Game.THREE.Vector3(0, 0, -1));
      const objects = raycaster.intersectObject(mesh);
      if (objects.length > 0) {
        const object = objects[0];
        heightMap[i][j] = maxZMockup - object.distance;
      } else {
        heightMap[i][j] = 0;
      }
    }
  }
  // Lego transformation
  const ratioZ = maxZMockup / 10;
  for (let i = 0; i < heightMap.length; i++) {
    for (let j = 0; j < heightMap[i].length; j++)
      heightMap[i][j] = Math.trunc(heightMap[i][j] / ratioZ);
  }
  return heightMap;
}
//

function generateCSV(heightMap) {
  let csvContent = 'data:text/csv;charset=utf-8,';

  // heightMap.forEach(function (rowArray) {
  //   const row = rowArray.join(',');
  //   csvContent += row + '\r\n';
  // });

  for (let i = 0; i < heightMap.length; i++) {
    const value = heightMap[i];

    for (var j = 0; j < value.length; j++) {
      var innerValue = value[j] === null ? '' : value[j].toString();
      var result = innerValue.replace(/"/g, '""');
      // if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) csvContent += ';';
      csvContent += result;
    }

    csvContent += '\n';
  }

  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
  console.log('end csv');
}

//TODO make the city visible only when menu is active since no need to view the city in conf room
//TODO make the select area an object with a transform control
class MenuCityMockUp {
  constructor(localCtx, go) {
    //ref
    this.localCtx = localCtx;
    this.go = go;

    //html
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const buttonSelect = document.createElement('button');
    buttonSelect.classList.add('button-imuv');
    buttonSelect.innerHTML = 'Changer de mode';
    this.rootHtml.appendChild(buttonSelect);

    //icon Mode
    this.iconMode = document.createElement('img');
    this.iconMode.classList.add('mock_up_icon_mode', 'mask_icon');
    this.rootHtml.appendChild(this.iconMode);

    //label mode
    this.labelMode = document.createElement('div');
    this.labelMode.classList.add('mock_up_label_mode');
    this.rootHtml.appendChild(this.labelMode);

    //attr
    this.itownsController = true; //default is itowns controller
    this.listeners = [];

    //callbacks
    buttonSelect.onclick = () => {
      this.setItownsController(!this.itownsController); //toggle
    };
  }

  removeListeners() {
    //remove listeners
    const manager = this.localCtx.getGameView().getInputManager();
    this.listeners.forEach((listener) => {
      manager.removeInputListener(listener);
    });
    this.listeners.length = 0; //clear array
  }

  enable() {
    this.setItownsController(this.itownsController); //update attributes of the inner class
  }

  setItownsController(value) {
    this.itownsController = value;

    const gameView = this.localCtx.getGameView();

    if (value == true) {
      this.labelMode.innerHTML = 'Itowns';
      this.iconMode.classList.remove('select_area_icon');
      this.iconMode.classList.add('town_icon');

      //remove pointer lock
      gameView.getInputManager().setPointerLock(false);

      //enable itowns rendering
      gameView.setItownsRendering(true);

      //tweak zoom factor
      const scriptUI = this.localCtx.findLocalScriptWithID('ui');
      gameView.getItownsView().controls.zoomInFactor = scriptUI
        .getMenuSettings()
        .getZoomFactorValue();
      gameView.getItownsView().controls.zoomOutFactor =
        1 / scriptUI.getMenuSettings().getZoomFactorValue();

      //trigger a render pass
      gameView.getItownsView().notifyChange(gameView.getCamera());

      //remove listeners
      this.removeListeners();
    } else {
      this.labelMode.innerHTML = 'Selectionez une région';
      this.iconMode.classList.remove('town_icon');
      this.iconMode.classList.add('select_area_icon');

      //disbale itowns rendering
      gameView.setItownsRendering(false);

      //add listeners
      const manager = gameView.getInputManager();
      const rootWelGL = gameView.getRootWebGL();

      let isDragging = false;

      const geometry = new Game.THREE.BoxGeometry(1, 1, 1);
      const material = new Game.THREE.MeshBasicMaterial({
        color: 0x0000ff,
        opacity: 0.3,
        transparent: true,
      });
      const selectAreaObject = new Game.THREE.Mesh(geometry, material);
      selectAreaObject.name = 'Select Area Menu Object';

      //compute z + height of the box
      let minZ, maxZ;

      const mouseCoordToWorldCoord = (event, result) => {
        gameView
          .getItownsView()
          .getPickingPositionFromDepth(
            new Game.THREE.Vector2(event.offsetX, event.offsetY),
            result
          );

        // compute minZ maxZ according where the mouse is moving TODO check with a step in all over the rect maybe
        minZ = Math.min(minZ, result.z);
        maxZ = Math.max(maxZ, result.z);
        selectAreaObject.position.z = (minZ + maxZ) * 0.5;
        selectAreaObject.scale.z = 50 + maxZ - minZ; //50 higher to see it
      };

      const worldCoordStart = new Game.THREE.Vector3();
      const worldCoordCurrent = new Game.THREE.Vector3();
      const center = new Game.THREE.Vector3();

      const updateSelectAreaObject = () => {
        center.lerpVectors(worldCoordStart, worldCoordCurrent, 0.5);

        //place on the xy plane
        selectAreaObject.position.x = center.x;
        selectAreaObject.position.y = center.y;

        //compute scale
        selectAreaObject.scale.x = worldCoordCurrent.x - worldCoordStart.x;
        selectAreaObject.scale.y = worldCoordCurrent.y - worldCoordStart.y;
      };

      const dragStart = (event) => {
        if (udviz.Components.checkParentChild(event.target, gameView.ui))
          return; //ui has been clicked

        isDragging = true; //reset
        minZ = Infinity; //reset
        maxZ = -Infinity; //reset

        mouseCoordToWorldCoord(event, worldCoordStart);
        mouseCoordToWorldCoord(event, worldCoordCurrent);

        updateSelectAreaObject();

        gameView.getScene().add(selectAreaObject);
      };
      manager.addMouseInput(rootWelGL, 'mousedown', dragStart);

      const dragging = (event) => {
        if (
          udviz.Components.checkParentChild(event.target, gameView.ui) ||
          !isDragging
        )
          return; //ui

        mouseCoordToWorldCoord(event, worldCoordCurrent);
        updateSelectAreaObject();
      };
      manager.addMouseInput(rootWelGL, 'mousemove', dragging);

      const dragEnd = () => {
        if (!isDragging) return; //was not dragging

        gameView.getScene().remove(selectAreaObject);
        isDragging = false;

        if (worldCoordStart.equals(worldCoordCurrent)) return; //it is not an area

        //edit conf go
        const ws = this.localCtx.getWebSocketService();
        const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];
        const localScriptComp = this.go.getComponent(Game.LocalScript.TYPE);
        ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT, {
          goUUID: this.go.getUUID(),
          componentUUID: localScriptComp.getUUID(),
          key: 'area',
          value: {
            start: worldCoordStart.toArray(),
            end: worldCoordCurrent.toArray(),
          },
        });
      };
      manager.addMouseInput(rootWelGL, 'mouseup', dragEnd);

      //record for further dispose
      this.listeners.push(dragStart);
      this.listeners.push(dragging);
      this.listeners.push(dragEnd);
    }
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();

    //reset inputs
    this.removeListeners();
  }
}
