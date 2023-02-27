import { ExternalScriptTemplate, THREE } from '@ud-viz/browser';

const DISTANCE_AVATAR = 5;
const DISTANCE_ZEPPELIN = 40;
const CAMERA_ANGLE = Math.PI / 20;

export class CameraManager extends ExternalScriptTemplate.CameraManager {
  followAvatar() {
    const avatarGO = this.context.object3D.getObjectByProperty(
      'uuid',
      this.context.userData.avatarUUID
    );
    const bbAvatar = new THREE.Box3().setFromObject(avatarGO);
    this.followObject3D(
      avatarGO,
      DISTANCE_AVATAR,
      new THREE.Vector3(0, 0, bbAvatar.max.z - bbAvatar.min.z),
      CAMERA_ANGLE
    );
  }

  moveToZeppelin() {
    let z = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        z = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });
    const bb = new THREE.Box3().setFromObject(z);
    return this.moveToObject3D(
      z,
      2000,
      DISTANCE_ZEPPELIN,
      new THREE.Vector3(0, 0, bb.max.z - bb.min.z),
      CAMERA_ANGLE
    );
  }

  moveToAvatar() {
    const avatarGO = this.context.object3D.getObjectByProperty(
      'uuid',
      this.context.userData.avatarUUID
    );
    const bbAvatar = new THREE.Box3().setFromObject(avatarGO);
    return this.moveToObject3D(
      avatarGO,
      2000,
      DISTANCE_AVATAR,
      new THREE.Vector3(0, 0, bbAvatar.max.z - bbAvatar.min.z),
      CAMERA_ANGLE
    );
  }
}