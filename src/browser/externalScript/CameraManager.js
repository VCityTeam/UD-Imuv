import * as THREE from 'three';

import { CameraManager as BaseCameraManager } from '@ud-viz/game_browser_template';

const DISTANCE_AVATAR = 5;
const DISTANCE_ZEPPELIN = 40;
const CAMERA_ANGLE = Math.PI / 20;

export class CameraManager extends BaseCameraManager {
  followAvatar() {
    const avatarGO = this.context.object3D.getObjectByProperty(
      'uuid',
      this.context.userData.avatar.uuid
    );
    if (!avatarGO) console.error('no avatar');
    const bbAvatar = new THREE.Box3().setFromObject(avatarGO);
    this.followObject3D(
      avatarGO,
      DISTANCE_AVATAR,
      new THREE.Vector3(0, 0, bbAvatar.max.z - bbAvatar.min.z),
      CAMERA_ANGLE
    );
  }

  followZeppelin() {
    let z = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        z = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });
    if (!z) throw new Error('no zeppelin');
    const bb = new THREE.Box3().setFromObject(z);
    this.followObject3D(
      z,
      DISTANCE_ZEPPELIN,
      new THREE.Vector3(0, 0, bb.max.z - bb.min.z),
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
    if (!z) throw new Error('no zeppelin');
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
      this.context.userData.avatar.uuid
    );
    if (!avatarGO) throw new Error('no avatar');
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
