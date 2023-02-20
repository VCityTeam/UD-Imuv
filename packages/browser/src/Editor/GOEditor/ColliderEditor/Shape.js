import { THREE, ConvexGeometry } from 'ud-viz';
export const POLYGON_TYPE = 'Polygon';
export const CIRCLE_TYPE = 'Circle';
import * as QuickHull from 'quickhull';

class AbstractShape {
  constructor(parent) {
    if (new.target === AbstractShape) {
      throw new TypeError('Cannot construct AbstractShape instances directly');
    }
    this.points = [];

    this.shapeObject = new THREE.Object3D();
    this.shapeObject.name = 'ShapeObject3D';
    this.shapeObject.shape = this;
    parent.add(this.shapeObject);

    this.name = 'Shape' + this.shapeObject.uuid;
    this.matMesh = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.matMesh.side = THREE.DoubleSide;

    this.colMeshDefault = 0xff0000;
    this.colMeshSelected = 0x69b00b;

    this.colPointDefault = 0xffff00;
    this.colPointCurrentShape = 0x00ffff;
    this.colPointSelected = 0x0b69b0;

    this.mesh = null;
  }

  /**
   *
   * @param {Mesh} point : sphere
   */
  addPoint(point) {
    this.getObject3D().add(point);
    point.updateMatrixWorld();

    this.points.push(point);
    point.name = 'Point' + this.points.length;
    point.userData = { type: 'Point' };
    this.updateMesh();
  }

  removePoint(point) {
    const index = this.points.indexOf(point);
    if (index >= 0) this.points.splice(index, 1);
    point.parent.remove(point);
    this.updateMesh();
  }

  setDefaultColor() {
    const _this = this;
    this.matMesh.color.set(this.colMeshDefault);
    if (this.mesh) {
      this.mesh.material = this.matMesh;
    }
    this.points.forEach(function (p) {
      p.material.color.set(_this.colPointDefault);
    });
  }

  setSelectedColor(objectSelected) {
    const _this = this;
    this.matMesh.color.set(this.colMeshSelected);
    if (this.mesh) {
      this.mesh.material = this.matMesh;
    }
    this.points.forEach(function (p) {
      if (objectSelected == p) {
        p.material.color.set(_this.colPointSelected);
      } else {
        p.material.color.set(_this.colPointCurrentShape);
      }
    });
  }

  getType() {
    return this.type;
  }

  getObject3D() {
    return this.shapeObject;
  }
}

export class PolygonShape extends AbstractShape {
  constructor(parent) {
    super(parent);
    this.previousMeshPosition = null;
    this.type = POLYGON_TYPE;
  }

  addPoint(point) {
    super.addPoint(point);
  }

  updateMesh() {
    const points = this.points;
    if (this.mesh) {
      this.mesh.parent.remove(this.mesh);
      this.mesh = null;
    }

    if (points.length < 4) return;

    const vertices = [];
    points.forEach((element) => {
      vertices.push(element.position);
    });

    const meshGeometry = new ConvexGeometry(vertices);
    meshGeometry.computeBoundingBox();
    const vecCenter = new THREE.Vector3();
    meshGeometry.boundingBox.getCenter(vecCenter);
    const positions = meshGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= vecCenter.x;
      positions[i + 1] -= vecCenter.y;
      positions[i + 2] -= vecCenter.z;
    }

    meshGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    //If you want the ray intersect the mesh you have to remove this boudingbox
    meshGeometry.boundingBox = null;

    this.mesh = new THREE.Mesh(meshGeometry, this.matMesh);
    this.mesh.position.copy(vecCenter);
    this.mesh.updateMatrixWorld();
    this.mesh.userData = { type: 'Mesh' };
    this.previousMeshPosition = this.mesh.position.clone();
    this.getObject3D().add(this.mesh);
  }

  adjustPoints() {
    const _this = this;
    this.points.forEach((point) => {
      const newPosition = point.position
        .clone()
        .add(
          _this.mesh.position.clone().sub(_this.previousMeshPosition.clone())
        );

      point.position.copy(newPosition);
    });
    this.previousMeshPosition = this.mesh.position.clone();
  }

  toJSON(posOffset) {
    const result = [];

    this.points.forEach(function (p) {
      result.push(p.position.clone().sub(posOffset));
    });

    const hull = QuickHull(result);
    hull.pop();

    const shape = {};
    shape.type = this.type;
    shape.points = hull;
    return shape;
  }
}

export class CircleShape extends AbstractShape {
  constructor(parent, radius = 5) {
    super(parent);
    this.type = CIRCLE_TYPE;
    this.radius = radius;
    this.center = null;
  }

  addPoint(point) {
    const _this = this;
    this.points.forEach(function (p) {
      _this.removePoint(p);
    });
    super.addPoint(point);
  }

  adjustPoints() {
    this.points[0].position.copy(this.mesh.position.clone());
  }

  updateMesh() {
    const points = this.points;
    if (this.mesh) {
      this.mesh.parent.remove(this.mesh);
      this.mesh = null;
    }
    if (!points.length) return;
    this.center = this.points[0].position;

    const geometry = new THREE.CircleGeometry(this.radius, 32);
    this.mesh = new THREE.Mesh(geometry, this.matMesh);
    this.mesh.position.copy(this.center);
    this.mesh.updateMatrixWorld();
    this.mesh.userData = { type: 'Mesh' };
    this.getObject3D().add(this.mesh);
  }

  getRadius() {
    return this.radius;
  }

  setRadius(r) {
    this.radius = r;
    this.updateMesh();
  }
  toJSON(posOffset) {
    const shape = {};
    shape.type = this.type;
    shape.center = this.center.clone().sub(posOffset);
    shape.radius = this.radius;
    return shape;
  }
}
