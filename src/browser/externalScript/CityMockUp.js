import * as THREE from 'three';
import * as itowns from 'itowns';
import { checkParentChild } from '@ud-viz/utils_browser';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent, Command } from '@ud-viz/game_shared';
import { constant } from '@ud-viz/game_shared_template';

import { UI } from './UI';
import { CameraManager } from './CameraManager';
import { AvatarController } from './AvatarController';
import { C3DTiles } from '@ud-viz/widget_3d_tiles';
import { FEATURE_USER_DATA_KEY } from './component/constant';

export class CityMockUp extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    // buffer
    this.itownsCamPos = null;
    this.itownsCamQuat = null;

    // 3D object
    this.mockUpObject = null;
    this.selectedAreaObject = null;
  }

  init() {
    if (this.context.userData.isEditorGameView) {
      // add a plane 1,1 to well adjust the go transform
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);

      const renderComp = this.object3D.getComponent(RenderComponent.TYPE);
      renderComp.getController().addObject3D(plane);
    }

    // Custom refine the conf area

    const boundingVolumeBox = new THREE.Box3();

    // add tool
    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );

    const layers = this.context.frame3D.itownsView
      .getLayers()
      .filter((el) => el.isC3DTilesLayer);
    layers.forEach((layer) => {
      layer.update = itowns.process3dTilesNode(
        (layer, camera, node, tileMatrixWorld) => {
          if (!node.boundingVolume || !node.boundingVolume.box) return true; // do not requet (culling it)

          boundingVolumeBox.copy(node.boundingVolume.box);
          boundingVolumeBox.applyMatrix4(tileMatrixWorld);

          const result = !this.intersectArea(
            boundingVolumeBox.min,
            boundingVolumeBox.max
          );

          return result; // request if it is intersected area
        },
        (context, layer, node) => {
          if (layer.tileset.tiles[node.tileId].children === undefined) {
            return false; // I guess no object so no refine
          }
          if (layer.tileset.tiles[node.tileId].isTileset) {
            return true; // refine if it's tileset
          }

          boundingVolumeBox.copy(node.boundingVolume.box);
          boundingVolumeBox.applyMatrix4(node.matrixWorld);

          const result = this.intersectArea(
            boundingVolumeBox.min,
            boundingVolumeBox.max
          );

          return result; // refine if it's intersecting area
        }
      );
      layer.addEventListener(
        itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
        ({ tileContent }) => {
          const boundingBox = new THREE.Box3().setFromObject(tileContent);

          // only update if tile intersect the area
          if (this.intersectArea(boundingBox.min, boundingBox.max)) {
            this.updateMockUpObject();
          }
        }
      );
    });
    const menu = new MenuCityMockUp(this.context, this.object3D);

    scriptUI.addTool(
      './assets/img/ui/icon_mock_up.png', // TODO: all hardcoded value should in this.variables
      'Maquette',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); // already moving
          return;
        }

        if (onClose) {
          // record
          this.itownsCamPos.set(
            this.context.frame3D.camera.position.x,
            this.context.frame3D.camera.position.y,
            this.context.frame3D.camera.position.z
          );
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.itownsView.controls.enabled = false;

          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true);
          });
        } else {
          // remove avatar controls
          avatarController.setAvatarControllerMode(false);

          if (!this.itownsCamPos && !this.itownsCamQuat) {
            // first time camera in sky

            const currentPosition = new THREE.Vector3().copy(
              this.context.frame3D.camera.position
            );

            // 200 meters up
            const endPosition = new THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            // look down
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

    // DEBUG
    this.context.inputManager.addKeyInput('a', 'keyup', () => {
      this.updateMockUpObject();
    });
  }

  intersectArea(min, max) {
    const area = this.variables.area;

    if (!area.start || !area.end) return false;

    // TODO could be optimize if not compute at each intersect
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
      // update 3DTiles mock up object
      if (this.mockUpObject && this.mockUpObject.parent) {
        this.mockUpObject.parent.remove(this.mockUpObject);
      }

      // parse geometry intersected
      const geometryMockUp = new THREE.BufferGeometry();
      const positionsMockUp = [];
      const normalsMockUp = [];
      const materials = [];

      const addToFinalMockUp = (positions, normals, color) => {
        let materialIndex = -1;
        const material = materials.filter((mat, index) => {
          if (mat.color.getHex() == color) {
            materialIndex = index;
            return true;
          }
          return false;
        });
        if (material.length == 0) {
          materials.push(new THREE.MeshStandardMaterial({ color: color }));
          materialIndex = materials.length - 1;
        }

        geometryMockUp.addGroup(
          positionsMockUp.length / 3,
          positions.length / 3,
          materialIndex
        );

        positionsMockUp.push(...positions);
        normalsMockUp.push(...normals);
      };

      // compute potential object intersecting
      const potentialObjects = new Map();
      this.context.frame3D.itownsView
        .getLayers()
        .filter((el) => el.isC3DTilesLayer)
        .forEach((l) => {
          l.object3d.traverse((child) => {
            if (child.geometry && child.geometry.attributes._BATCHID) {
              const bbChild = child.geometry.boundingBox
                .clone()
                .applyMatrix4(child.matrixWorld);
              if (this.intersectArea(bbChild.min, bbChild.max))
                potentialObjects.set(child.uuid, child);
            }
          });
        });

      // compute gml_id intersecting
      const gmlIDs = [];
      const bbBuffer = new THREE.Box3();
      this.context.frame3D.itownsView
        .getLayers()
        .filter((el) => el.isC3DTilesLayer)
        .forEach((l) => {
          /* First pass to find gmlids to add to mock up */
          for (const [, c3dTfeatures] of l.tilesC3DTileFeatures) {
            for (const [, feature] of c3dTfeatures) {
              const gmlId = feature.getInfo().batchTable['gml_id'];
              if (gmlIDs.includes(gmlId) || !gmlId) continue; // gml id already added
              if (!potentialObjects.has(feature.object3d.uuid)) continue; // object3d not intersecting with area

              feature.computeWorldBox3(bbBuffer);

              if (this.intersectArea(bbBuffer.min, bbBuffer.max))
                gmlIDs.push(gmlId);
            }
          }
        });

      // add to mockup gmlids recorded
      const bufferPos = new THREE.Vector3();
      const bufferNormal = new THREE.Vector3();
      this.context.frame3D.itownsView
        .getLayers()
        .filter((el) => el.isC3DTilesLayer)
        .forEach((layer) => {
          for (const [, c3dTfeatures] of layer.tilesC3DTileFeatures) {
            for (const [, feature] of c3dTfeatures) {
              const gmlId = feature.getInfo().batchTable['gml_id'];
              if (gmlIDs.includes(gmlId)) {
                // add to the mockup

                const positions = [];
                const normals = [];
                const normalMatrixWorld = new THREE.Matrix3().getNormalMatrix(
                  feature.object3d.matrixWorld
                );

                feature.groups.forEach((group) => {
                  const positionIndexStart = group.start * 3;
                  const positionIndexCount = (group.start + group.count) * 3;

                  for (
                    let index = positionIndexStart;
                    index < positionIndexCount;
                    index += 3
                  ) {
                    bufferPos.x =
                      feature.object3d.geometry.attributes.position.array[
                        index
                      ];
                    bufferPos.y =
                      feature.object3d.geometry.attributes.position.array[
                        index + 1
                      ];
                    bufferPos.z =
                      feature.object3d.geometry.attributes.position.array[
                        index + 2
                      ];

                    positions.push(
                      ...bufferPos
                        .applyMatrix4(feature.object3d.matrixWorld)
                        .toArray()
                    );

                    bufferNormal.x =
                      feature.object3d.geometry.attributes.normal.array[index];
                    bufferNormal.y =
                      feature.object3d.geometry.attributes.normal.array[
                        index + 1
                      ];
                    bufferNormal.z =
                      feature.object3d.geometry.attributes.normal.array[
                        index + 2
                      ];

                    normals.push(
                      ...bufferNormal.applyMatrix3(normalMatrixWorld).toArray()
                    );
                  }
                });

                addToFinalMockUp(
                  positions,
                  normals,
                  feature.userData[FEATURE_USER_DATA_KEY.INITIAL_COLOR]
                );
              }
            }
          }
        });

      // create mock up from geometry
      geometryMockUp.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positionsMockUp), 3)
      );
      geometryMockUp.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normalsMockUp), 3)
      );

      // center geometryockUp on xy and put it at zero on z
      geometryMockUp.computeBoundingBox();
      const bbMockUp = geometryMockUp.boundingBox;
      const centerMockUp = bbMockUp.min.clone().lerp(bbMockUp.max, 0.5);
      const geoPositionsMockUp = geometryMockUp.attributes.position.array;
      for (let index = 0; index < geoPositionsMockUp.length; index += 3) {
        geoPositionsMockUp[index] -= centerMockUp.x;
        geoPositionsMockUp[index + 1] -= centerMockUp.y;
        geoPositionsMockUp[index + 2] -= bbMockUp.min.z; // so it's on the table
      }

      // create mesh
      this.mockUpObject = new THREE.Mesh(geometryMockUp, materials);
      this.mockUpObject.name = 'MockUp Object';
      const renderComp = this.object3D.getComponent(RenderComponent.TYPE);
      renderComp.getController().addObject3D(this.mockUpObject);

      // adapt scale to fit the table
      const widthMockUp = bbMockUp.max.x - bbMockUp.min.x;
      const depthMockUp = bbMockUp.max.y - bbMockUp.min.y;
      const widthTable = this.object3D.scale.x; // edited via editor
      const depthTable = this.object3D.scale.y; // edited via editor
      const minMockUpScale = Math.min(1 / widthMockUp, 1 / depthMockUp);
      const minTableScale = Math.min(widthTable, depthTable);
      // scale = constant / this.object3D.scale => remain mockup proportion
      this.mockUpObject.scale.set(
        (minTableScale * minMockUpScale) / widthTable,
        (minTableScale * minMockUpScale) / depthTable,
        (minTableScale * minMockUpScale) / 1
      );

      // update selectedAreaObject
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
      const geometrySelectedArea = new THREE.BoxGeometry(dim.x, dim.y, 500); // 500 HARD CODED TODO compute minZ and maxZ
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
      this.selectedAreaObject.renderOrder = 2; // render after prethis.context.frame3D.itownsView of selected area
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

// TODO make the city visible only when menu is active since no need to this.context.frame3D.itownsView the city in conf room
// TODO make the select area an object with a transform control
class MenuCityMockUp {
  constructor(context, object3D) {
    /** @type {ExternalGame.Context} */
    this.context = context;

    this.object3D = object3D;

    // html
    this.domElement = document.createElement('div');
    this.domElement.classList.add('contextual_menu');

    const buttonSelect = document.createElement('button');
    buttonSelect.classList.add('button-imuv');
    buttonSelect.innerHTML = 'Changer de mode';
    this.domElement.appendChild(buttonSelect);

    this.widget3DTiles = new C3DTiles(this.context.frame3D.itownsView, {
      parentElement: this.domElement,
    });
    const contextSelection = {
      feature: null,
      layer: null,
    };
    this.widget3DTilesListener = (event) => {
      console.log('click');
      if (contextSelection.feature) {
        // reset feature userData
        contextSelection.feature.userData.selectedColor = null;
        // and update style of its layer
        contextSelection.layer.updateStyle([contextSelection.feature.tileId]);
        // reset context selection
        contextSelection.feature = null;
        contextSelection.layer = null;
      }

      // get intersects based on the click event
      const intersects = this.context.frame3D.itownsView.pickObjectsAt(
        event,
        0,
        this.context.frame3D.itownsView
          .getLayers()
          .filter((el) => el.isC3DTilesLayer)
      );

      if (intersects.length) {
        // get featureClicked
        const featureClicked =
          intersects[0].layer.getC3DTileFeatureFromIntersectsArray(intersects);
        if (featureClicked) {
          // write in userData the selectedColor
          featureClicked.userData.selectedColor = 'blue';
          // and update its style layer
          intersects[0].layer.updateStyle();

          // set contextSelection
          contextSelection.feature = featureClicked;
          contextSelection.layer = intersects[0].layer;
        }
      }
      this.widget3DTiles.displayC3DTFeatureInfo(
        contextSelection.feature,
        contextSelection.layer
      );
      this.context.frame3D.itownsView.notifyChange(); // need a redraw of the this.context.frame3D.itownsView
    };

    // icon Mode
    this.iconMode = document.createElement('img');
    this.iconMode.classList.add('mock_up_icon_mode', 'mask_icon');
    this.domElement.appendChild(this.iconMode);

    // label mode
    this.labelMode = document.createElement('div');
    this.labelMode.classList.add('mock_up_label_mode');
    this.domElement.appendChild(this.labelMode);

    // attr
    this.itownsController = true; // default is itowns controller
    this.listeners = [];

    // callbacks
    buttonSelect.onclick = () => {
      this.setItownsController(!this.itownsController); // toggle
    };
  }

  removeListeners() {
    // remove listeners
    this.listeners.forEach((listener) => {
      this.context.inputManager.removeInputListener(listener);
    });
    this.listeners.length = 0; // clear array
  }

  enable() {
    this.setItownsController(this.itownsController); // update attributes of the inner class
  }

  setItownsController(value) {
    this.itownsController = value;

    if (value == true) {
      this.labelMode.innerHTML = 'Itowns';
      this.iconMode.classList.remove('select_area_icon');
      this.iconMode.classList.add('town_icon');
      this.widget3DTiles.domElement.hidden = false;

      // remove pointer lock
      this.context.inputManager.setPointerLock(false);

      // enable itowns rendering
      this.context.frame3D.itownsView.controls.enabled = true;

      // tweak zoom factor
      const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
      this.context.frame3D.itownsView.controls.zoomInFactor = scriptUI
        .getMenuSettings()
        .getZoomFactorValue();
      this.context.frame3D.itownsView.controls.zoomOutFactor =
        1 / scriptUI.getMenuSettings().getZoomFactorValue();

      // remove listeners
      this.removeListeners();
      this.context.frame3D.domElement.addEventListener(
        'click',
        this.widget3DTilesListener
      );
    } else {
      this.widget3DTiles.domElement.hidden = true;
      this.context.frame3D.domElement.removeEventListener(
        'click',
        this.widget3DTilesListener
      );

      this.labelMode.innerHTML = 'Selectionez une région';
      this.iconMode.classList.remove('town_icon');
      this.iconMode.classList.add('select_area_icon');

      // disbale itowns rendering
      this.context.frame3D.itownsView.controls.enabled = false;

      // add listeners
      let isDragging = false;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        opacity: 0.3,
        transparent: true,
      });
      const selectAreaObject = new THREE.Mesh(geometry, material);
      selectAreaObject.name = 'Select Area Menu Object';

      // compute z + height of the box
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
        selectAreaObject.scale.z = 50 + maxZ - minZ; // 50 higher to see it
      };

      const worldCoordStart = new THREE.Vector3();
      const worldCoordCurrent = new THREE.Vector3();
      const center = new THREE.Vector3();

      const updateSelectAreaObject = () => {
        center.lerpVectors(worldCoordStart, worldCoordCurrent, 0.5);

        // place on the xy plane
        selectAreaObject.position.x = center.x;
        selectAreaObject.position.y = center.y;

        // compute scale
        selectAreaObject.scale.x = worldCoordCurrent.x - worldCoordStart.x;
        selectAreaObject.scale.y = worldCoordCurrent.y - worldCoordStart.y;
        selectAreaObject.updateMatrixWorld();
      };

      const dragStart = (event) => {
        if (checkParentChild(event.target, this.context.frame3D.ui)) return; // ui has been clicked

        isDragging = true; // reset
        minZ = Infinity; // reset
        maxZ = -Infinity; // reset

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
          return; // ui

        mouseCoordToWorldCoord(event, worldCoordCurrent);
        updateSelectAreaObject();
      };
      this.context.inputManager.addMouseInput(
        this.context.frame3D.domElementWebGL,
        'mousemove',
        dragging
      );

      const dragEnd = () => {
        if (!isDragging) return; // was not dragging

        this.context.frame3D.scene.remove(selectAreaObject);
        isDragging = false;

        if (worldCoordStart.equals(worldCoordCurrent)) return; // it is not an area

        const cmd = new Command({
          type: constant.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES,
          data: {
            object3DUUID: this.object3D.uuid,
            variableName: 'area',
            variableValue: {
              start: worldCoordStart.toArray(),
              end: worldCoordCurrent.toArray(),
            },
          },
        });

        // edit conf go
        this.context.sendCommandsToGameContext([cmd]);
      };
      this.context.inputManager.addMouseInput(
        this.context.frame3D.domElementWebGL,
        'mouseup',
        dragEnd
      );

      // record for further dispose
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

    // reset inputs
    this.removeListeners();

    this.context.frame3D.domElement.removeEventListener(
      'click',
      this.widget3DTilesListener
    );
  }
}
