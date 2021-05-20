/** @format */

import { THREE } from 'ud-viz';

const ColliderComponent = require('ud-viz/src/Game/Shared/GameObject/Components/Collider');

import * as ShapeController from '../../Components/ShapeController';

const CANVAS_TEXTURE_SIZE = 2046;

export class ColliderModel {
  constructor(gameObjectModel) {
    this.gameObjectModel = gameObjectModel;

    //shapes
    this.shapes = [];

    //meshes
    this.plan = null;

    //rendering canvas texture
    this.canvasTexture = document.createElement('canvas');
    this.loader = new THREE.TextureLoader();

    //shape to draw on texture in addition
    this.currentShape = null;

  }

  init() {
    this.initScene();
    this.initCollider();
  }

  addCurrentShape() {
    this.shapes.push(this.currentShape.clone());
    this.setCurrentShape(null);
    this.bindShapesGO(); //add shapes in go as well
  }

  remove(shape) {
    if (this.currentShape == shape) {
      this.currentShape = null;
    }

    const index = this.shapes.indexOf(shape);
    if (index >= 0) this.shapes.splice(index, 1);

    this.updatePlanTexture();
    this.bindShapesGO(); //remove in go json as well
  }

  getCurrentShape() {
    return this.currentShape;
  }

  setCurrentShape(shape) {
    this.currentShape = shape;

    const index = this.shapes.indexOf(shape);
    if (index >= 0) this.shapes.splice(index, 1);

    this.updatePlanTexture();
  }

  bindShapesGO() {
    const gameobject = this.gameObjectModel.getGameObject();
    const body = gameobject.getComponent(ColliderComponent.TYPE);
    if (!body) throw new Error();
    body.setShapesJSON(this.shapesToJSON());
  }

  initCollider() {
    //check if there is already a body component if not create one
    const gameobject = this.gameObjectModel.getGameObject();
    const body = gameobject.getComponent(ColliderComponent.TYPE);
    if (!body) {
      gameobject.setComponent(
        ColliderComponent.TYPE,
        new ColliderComponent(gameobject, {
          type: ColliderComponent.TYPE,
          shapes: [],
        })
      );
    } else {
      //check if shape must be load
      const shapesJSON = body.getShapesJSON();
      const shapes = [];
      shapesJSON.forEach(function (shape) {
        switch (shape.type) {
          case ShapeController.Polygon.TYPE:
            shapes.push(new ShapeController.Polygon().fromJSON(shape));
            break;
          case ShapeController.Circle.TYPE:
            shapes.push(new ShapeController.Circle().fromJSON(shape));
            break;
          default:
            throw new Error();
        }
      });
      this.shapes = shapes;
    }
  }

  shapesToJSON() {
    const result = [];

    const position = this.gameObjectModel.getGameObject().getPosition();
    this.shapes.forEach(function (shape) {
      const json = shape.toJSON(position);
      result.push(json);
    });

    return result;
  }

  getShapes() {
    return this.shapes;
  }

  getBoundingBox() {
    return this.gameObjectModel.getBoundingBox();
  }

  getPlanMesh() {
    return this.plan;
  }

  getScene() {
    return this.gameObjectModel.getScene();
  }

  addZPlan(step) {
    let z = this.plan.position.z + step;
    const bbox = this.getBoundingBox();
    z = Math.max(Math.min(z, bbox.max.z), bbox.min.z);
    this.plan.position.z = z;
  }

  initScene() {
    const bbox = this.computeOffsetBB();
    const center = bbox.min.clone().lerp(bbox.max, 0.5);
    const widthO = bbox.max.x - bbox.min.x;
    const heightO = bbox.max.y - bbox.min.y;

    const planGeometry = new THREE.PlaneGeometry(widthO, heightO);
    this.plan = new THREE.Mesh(planGeometry, new THREE.MeshBasicMaterial());
    this.plan.position.copy(center);
    this.getScene().add(this.plan);
    this.plan.renderOrder = 1; //on top of gameobject object3D

    this.initCollider();
    this.updatePlanTexture();
  }

  dispose() {
    this.getScene().remove(this.plan);
  }

  computeOffsetBB() {
    const bb = this.getBoundingBox().clone();
    const offset = new THREE.Vector3(5, 5, 5);
    bb.max.add(offset);
    bb.min.sub(offset);
    return bb;
  }

  updatePlanTexture() {
    this.canvasTexture.width = CANVAS_TEXTURE_SIZE;
    this.canvasTexture.height = CANVAS_TEXTURE_SIZE;
    const ctx = this.canvasTexture.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_TEXTURE_SIZE, CANVAS_TEXTURE_SIZE);

    const bb = this.computeOffsetBB();

    this.shapes.forEach(function (s) {
      s.draw(ctx, CANVAS_TEXTURE_SIZE, 'red', bb);
    });
    if (this.currentShape)
      this.currentShape.draw(ctx, CANVAS_TEXTURE_SIZE, 'green', bb);

    const url = this.canvasTexture.toDataURL('image/png');
    const textureShape = this.loader.load(url);
    textureShape.flipY = false;
    textureShape.flipX = true;
    textureShape.magFilter = THREE.NearestFilter;
    textureShape.minFilter = THREE.NearestFilter;
    this.plan.material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 'white',
      transparent: true,
      opacity: .5,
      map: textureShape
    });
  }
}
