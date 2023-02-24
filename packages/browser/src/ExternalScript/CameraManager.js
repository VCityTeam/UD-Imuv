import { ExternalScriptTemplate, THREE } from '@ud-viz/browser';

const DISTANCE_AVATAR = 5;
const ANGLE_AVATAR = Math.PI / 20;

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
      ANGLE_AVATAR
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
      ANGLE_AVATAR
    );
  }
}
