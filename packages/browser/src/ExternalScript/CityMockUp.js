import { Game, THREE, itowns, checkParentChild, Shared } from '@ud-viz/browser';

export class CityMockUp extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    //buffer
    this.itownsCamPos = null;
    this.itownsCamQuat = null;

    //3D object
    this.mockUpObject = null;
    this.selectedAreaObject = null;
  }

  init() {
    if (this.context.userData.isEditorGameView) {
      //add a plane 1,1 to well adjust the go transform
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);

      const renderComp = this.object3D.getComponent(
        Shared.Game.Component.Render.TYPE
      );
      renderComp.getController().addObject3D(plane);
    }

    //Custom refine the conf area

    const boundingVolumeBox = new THREE.Box3();

    this.context.frame3D.layerManager.tilesManagers.forEach((tileManager) => {
      tileManager.layer.update = itowns.process3dTilesNode(
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

      tileManager.addEventListener(TilesManager.EVENT_TILE_LOADED, (tile) => {
        const boundingBox = new THREE.Box3().setFromObject(tile);

        //only update if tile intersect the area
        if (this.intersectArea(boundingBox.min, boundingBox.max)) {
          this.updateMockUpObject();
        }
      });
    });

    //add tool
    const scriptUI = this.context.findExternalScriptWithID('UI');
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    const menu = new MenuCityMockUp(this.context, this.object3D);

    scriptUI.addTool(
      './assets/img/ui/icon_mock_up.png',
      'Maquette',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); //already moving
          return;
        }

        if (onClose) {
          //record
          this.itownsCamPos.set(
            this.context.frame3D.camera.position.x,
            this.context.frame3D.camera.position.y,
            this.context.frame3D.camera.position.z
          );
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.enableItownsViewControls(false);

          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true);
          });
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false);

          if (!this.itownsCamPos && !this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new THREE.Vector3().copy(
              this.context.frame3D.camera.position
            );

            //200 meters up
            const endPosition = new THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(0.01, 0, 0)
            );

            this.itownsCamPos = endPosition;
            this.itownsCamQuat = endQuaternion;
          }

          cameraManager
            .moveToTransform(this.itownsCamPos, this.itownsCamQuat, 2000)
            .then(() => {
              menu.enable();
              resolve(true);
            });
        }
      },
      menu
    );

    //DEBUG
    this.context.inputManager.addKeyInput('a', 'keyup', () => {
      this.updateMockUpObject();
    });
  }

  intersectArea(min, max) {
    const area = this.variables.area;

    if (!area.start || !area.end) return false;

    //TODO could be optimize if not compute at each intersect
    const minArea = new THREE.Vector3(
      Math.min(area.start[0], area.end[0]),
      Math.min(area.start[1], area.end[1])
    );
    const maxArea = new THREE.Vector3(
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

  updateMockUpObject() {
    const area = this.variables.area;
    console.log('UPDATE MOCK UP => ', area);

    if (area.start && area.end) {
      //update 3DTiles mock up object
      if (this.mockUpObject && this.mockUpObject.parent) {
        this.mockUpObject.parent.remove(this.mockUpObject);
      }

      //parse geometry intersected
      const materialsMockup = [];
      const geometryMockUp = new THREE.BufferGeometry();
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

      this.context.frame3D.layerManager.tilesManagers.forEach((tileManager) => {
        const object = tileManager.layer.root;

        if (!object) return;

        //gml and cityobjectid intersecting area
        const cityObjectIDs = [];
        const gmlIds = [];

        //add cityobject intersecting area
        object.traverse((child) => {
          if (child.geometry && !child.userData.metadata.children) {
            const tileId = getTileFromMesh(child).tileId;

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
              const position = new THREE.Vector3();
              const normal = new THREE.Vector3();
              const normalMatrixWorld = new THREE.Matrix3().getNormalMatrix(
                child.matrixWorld
              );

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
                minBB = new THREE.Vector2(Infinity, Infinity); //reset
                maxBB = new THREE.Vector2(-Infinity, -Infinity); //reset

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
                  cityObjectIDs.push(new CityObjectID(tileId, currentBatchID));

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
            const tileId = getTileFromMesh(child).tileId;

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

            const normalMatrixWorld = new THREE.Matrix3().getNormalMatrix(
              child.matrixWorld
            );

            for (let i = 0; i < batchIds.length; i++) {
              const batchID = batchIds[i];
              const cityObjectId = new CityObjectID(tileId, batchID);

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
                  const position = new THREE.Vector3();
                  const normal = new THREE.Vector3();
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
        new THREE.BufferAttribute(new Float32Array(positionsMockUp), 3)
      );
      geometryMockUp.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normalsMockUp), 3)
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
      this.mockUpObject = new THREE.Mesh(geometryMockUp, materialsMockup);
      this.mockUpObject.name = 'MockUp Object';
      const renderComp = this.object3D.getComponent(
        Shared.Game.Component.Render.TYPE
      );
      renderComp.getController().addObject3D(this.mockUpObject);

      //adapt scale to fit the table
      const widthMockUp = bbMockUp.max.x - bbMockUp.min.x;
      const depthMockUp = bbMockUp.max.y - bbMockUp.min.y;
      const widthTable = this.object3D.scale.x; //edited via editor
      const depthTable = this.object3D.scale.y; //edited via editor
      const minMockUpScale = Math.min(1 / widthMockUp, 1 / depthMockUp);
      const minTableScale = Math.min(widthTable, depthTable);
      //scale = constant / this.object3D.scale => remain mockup proportion
      this.mockUpObject.scale.set(
        (minTableScale * minMockUpScale) / widthTable,
        (minTableScale * minMockUpScale) / depthTable,
        (minTableScale * minMockUpScale) / 1
      );

      //update selectedAreaObject
      if (this.selectedAreaObject && this.selectedAreaObject.parent) {
        this.selectedAreaObject.parent.remove(this.selectedAreaObject);
      }
      const minArea = new THREE.Vector3(
        Math.min(area.start[0], area.end[0]),
        Math.min(area.start[1], area.end[1])
      );
      const maxArea = new THREE.Vector3(
        Math.max(area.start[0], area.end[0]),
        Math.max(area.start[1], area.end[1])
      );
      const dim = maxArea.clone().sub(minArea);
      const geometrySelectedArea = new THREE.BoxGeometry(dim.x, dim.y, 500); //500 HARD CODED TODO compute minZ and maxZ
      this.selectedAreaObject = new THREE.Mesh(
        geometrySelectedArea,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().fromArray([0, 1, 0]),
          opacity: 0.5,
          transparent: true,
        })
      );
      this.selectedAreaObject.name = 'Selected Area MockUp';
      this.selectedAreaObject.position.lerpVectors(minArea, maxArea, 0.5);
      this.selectedAreaObject.renderOrder = 2; //render after preview of selected area
      this.selectedAreaObject.updateMatrixWorld();

      this.context.frame3D.scene.add(this.selectedAreaObject);
    }
  }

  onOutdated() {
    this.updateMockUpObject();
  }

  static get ID_SCRIPT() {
    return 'city_mock_up_id_ext_script';
  }
}

//TODO make the city visible only when menu is active since no need to view the city in conf room
//TODO make the select area an object with a transform control
class MenuCityMockUp {
  constructor(context, object3D) {
    /** @type {ExternalGame.Context} */
    this.context = context;

    this.object3D = object3D;

    //html
    this.domElement = document.createElement('div');
    this.domElement.classList.add('contextual_menu');

    const buttonSelect = document.createElement('button');
    buttonSelect.classList.add('button-imuv');
    buttonSelect.innerHTML = 'Changer de mode';
    this.domElement.appendChild(buttonSelect);

    //icon Mode
    this.iconMode = document.createElement('img');
    this.iconMode.classList.add('mock_up_icon_mode', 'mask_icon');
    this.domElement.appendChild(this.iconMode);

    //label mode
    this.labelMode = document.createElement('div');
    this.labelMode.classList.add('mock_up_label_mode');
    this.domElement.appendChild(this.labelMode);

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
    this.listeners.forEach((listener) => {
      this.context.inputManager.removeInputListener(listener);
    });
    this.listeners.length = 0; //clear array
  }

  enable() {
    this.setItownsController(this.itownsController); //update attributes of the inner class
  }

  setItownsController(value) {
    this.itownsController = value;

    if (value == true) {
      this.labelMode.innerHTML = 'Itowns';
      this.iconMode.classList.remove('select_area_icon');
      this.iconMode.classList.add('town_icon');

      //remove pointer lock
      this.context.inputManager.setPointerLock(false);

      //enable itowns rendering
      this.context.frame3D.enableItownsViewControls(true);

      //tweak zoom factor
      const scriptUI = this.context.findExternalScriptWithID('UI');
      this.context.frame3D.itownsView.controls.zoomInFactor = scriptUI
        .getMenuSettings()
        .getZoomFactorValue();
      this.context.frame3D.itownsView.controls.zoomOutFactor =
        1 / scriptUI.getMenuSettings().getZoomFactorValue();

      //remove listeners
      this.removeListeners();
    } else {
      this.labelMode.innerHTML = 'Selectionez une région';
      this.iconMode.classList.remove('town_icon');
      this.iconMode.classList.add('select_area_icon');

      //disbale itowns rendering
      this.context.frame3D.enableItownsViewControls(false);

      //add listeners
      let isDragging = false;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        opacity: 0.3,
        transparent: true,
      });
      const selectAreaObject = new THREE.Mesh(geometry, material);
      selectAreaObject.name = 'Select Area Menu Object';

      //compute z + height of the box
      let minZ, maxZ;

      const mouseCoordToWorldCoord = (event, result) => {
        this.context.frame3D.itownsView.getPickingPositionFromDepth(
          new THREE.Vector2(event.offsetX, event.offsetY),
          result
        );

        // compute minZ maxZ according where the mouse is moving TODO check with a step in all over the rect maybe
        minZ = Math.min(minZ, result.z);
        maxZ = Math.max(maxZ, result.z);
        selectAreaObject.position.z = (minZ + maxZ) * 0.5;
        selectAreaObject.scale.z = 50 + maxZ - minZ; //50 higher to see it
      };

      const worldCoordStart = new THREE.Vector3();
      const worldCoordCurrent = new THREE.Vector3();
      const center = new THREE.Vector3();

      const updateSelectAreaObject = () => {
        center.lerpVectors(worldCoordStart, worldCoordCurrent, 0.5);

        //place on the xy plane
        selectAreaObject.position.x = center.x;
        selectAreaObject.position.y = center.y;

        //compute scale
        selectAreaObject.scale.x = worldCoordCurrent.x - worldCoordStart.x;
        selectAreaObject.scale.y = worldCoordCurrent.y - worldCoordStart.y;
        selectAreaObject.updateMatrixWorld();
      };

      const dragStart = (event) => {
        if (checkParentChild(event.target, this.context.frame3D.ui)) return; //ui has been clicked

        isDragging = true; //reset
        minZ = Infinity; //reset
        maxZ = -Infinity; //reset

        mouseCoordToWorldCoord(event, worldCoordStart);
        mouseCoordToWorldCoord(event, worldCoordCurrent);

        updateSelectAreaObject();

        this.context.frame3D.scene.add(selectAreaObject);
      };
      this.context.inputManager.addMouseInput(
        this.context.frame3D.domElementWebGL,
        'mousedown',
        dragStart
      );

      const dragging = (event) => {
        if (
          checkParentChild(event.target, this.context.frame3D.ui) ||
          !isDragging
        )
          return; //ui

        mouseCoordToWorldCoord(event, worldCoordCurrent);
        updateSelectAreaObject();
      };
      this.context.inputManager.addMouseInput(
        this.context.frame3D.domElementWebGL,
        'mousemove',
        dragging
      );

      const dragEnd = () => {
        if (!isDragging) return; //was not dragging

        this.context.frame3D.scene.remove(selectAreaObject);
        isDragging = false;

        if (worldCoordStart.equals(worldCoordCurrent)) return; //it is not an area

        //edit conf go
        this.context.sendCommandToGameContext([
          new Shared.Command({
            type: Shared.Game.ScriptTemplate.Constants.COMMAND
              .UPDATE_EXTERNALSCRIPT_VARIABLES,
            data: {
              object3DUUID: this.object3D.uuid,
              variableName: 'area',
              variableValue: {
                start: worldCoordStart.toArray(),
                end: worldCoordCurrent.toArray(),
              },
            },
          }),
        ]);
      };
      this.context.inputManager.addMouseInput(
        this.context.frame3D.domElementWebGL,
        'mouseup',
        dragEnd
      );

      //record for further dispose
      this.listeners.push(dragStart);
      this.listeners.push(dragging);
      this.listeners.push(dragEnd);
    }
  }

  html() {
    return this.domElement;
  }

  dispose() {
    this.domElement.remove();

    //reset inputs
    this.removeListeners();
  }
}
