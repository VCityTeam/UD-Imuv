import { ExternalGame, THREE } from '@ud-viz/browser';
import { Routine } from './Component/Routine';

const DISTANCE_CAMERA_AVATAR = 5;
const DISTANCE_CAMERA_ZEPPELIN = 40;

export class Camera extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.avatarGO = null;
    this.zeppelinGO = null;

    //method to focus a go
    this.focusCamera = null;

    //routines camera
    this.routines = [];
  }

  getDistanceCameraAvatar() {
    return DISTANCE_CAMERA_AVATAR;
  }

  getDistanceCameraZeppelin() {
    return DISTANCE_CAMERA_ZEPPELIN;
  }

  getFocusCamera() {
    return this.focusCamera;
  }

  init() {
    //cameraman
    this.focusCamera = new Focus(this.context.frame3D.camera);

    this.context.inputManager.addKeyInput('f', 'keydown', () => {
      this.focusCamera.toggleMode();
    });

    if (this.context.userData.firstGameObject) {
      //work with avatar_controller localscript
      this.addTravelingRoutine();
    }
  }

  getAvatarGO() {
    return this.avatarGO;
  }

  fetchStaticObject() {
    const scriptStaticObject =
      this.context.findExternalScriptWithID('StaticObject');
    return scriptStaticObject.object3D;
  }

  addRoutine(r) {
    this.routines.push(r);
  }

  hasRoutine() {
    return this.routines.length;
  }

  addTravelingRoutine() {
    //anonymous function
    const createSplashScreen = function () {
      const result = document.createElement('div');
      result.classList.add('splash');

      const bg = document.createElement('div');
      bg.classList.add('bg_splash');
      result.appendChild(bg);

      const label = document.createElement('div');
      label.classList.add('label_splash');
      label.innerHTML = 'Welcome to Flying Campus';
      result.appendChild(label);

      return result;
    };

    const splash = createSplashScreen();
    const duration = this.variables.traveling_time;
    if (!duration) return; //if no traveling time return

    document.body.appendChild(splash);

    //buffer
    let startPos = null;
    let startQuat = null;
    let currentTime = 0;

    //first travelling
    this.addRoutine(
      new Routine(
        (dt) => {
          if (!this.avatarGO) return false;

          this.focusCamera.setTarget(this.avatarGO);
          const t = this.focusCamera.computeTransformTarget(
            null,
            DISTANCE_CAMERA_AVATAR
          );

          //init relatively
          if (!startPos && !startQuat) {
            startPos = t.position
              .clone()
              .sub(new THREE.Vector3(1000, 1000, -1000));
            startQuat = t.quaternion
              .clone()
              .multiply(
                new THREE.Quaternion().setFromEuler(
                  new THREE.Euler(-Math.PI * 0.5, 0, 0)
                )
              );
          }

          currentTime += dt;
          const ratio = Math.min(Math.max(0, currentTime / duration), 1);

          const p = t.position.lerp(startPos, 1 - ratio);
          const q = t.quaternion.slerp(startQuat, 1 - ratio);

          this.context.frame3D.camera.position.copy(p);
          this.context.frame3D.camera.quaternion.copy(q);

          this.context.frame3D.camera.updateProjectionMatrix();

          return ratio >= 1;
        },
        () => {
          splash.remove();

          const avatarController =
            this.context.findExternalScriptWithID('AvatarController');
          avatarController.setAvatarControllerMode(true);
        }
      )
    );
  }

  tick() {
    //if not initialized look for avatar go
    let cityAvatar = null;
    if (!this.avatarGO) {
      this.avatarGO = this.context.object3D.getObjectByProperty(
        'uuid',
        this.context.userData.avatarUUID
      );
    } else {
      cityAvatar = this.avatarGO.getObjectByProperty('name', 'city_avatar');
    }

    if (!this.zeppelinGO) {
      this.zeppelinGO = this.context.object3D.getObjectByProperty(
        'name',
        'Zeppelin'
      );
    }

    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    const zeppelinController =
      this.context.findExternalScriptWithID('ZeppelinController');

    //routines are prior
    if (this.hasRoutine()) {
      const currentRoutine = this.routines[0];
      const finished = currentRoutine.tick(this.context.dt);
      if (finished) {
        currentRoutine.onEnd();
        this.routines.shift(); //remove
      }
    } else if (cityAvatar) {
      this.focusTarget(cityAvatar, DISTANCE_CAMERA_AVATAR);
    } else if (avatarController.getAvatarControllerMode()) {
      this.focusTarget(this.avatarGO, DISTANCE_CAMERA_AVATAR);
    } else if (
      zeppelinController &&
      zeppelinController.getZeppelinControllerMode()
    ) {
      this.focusTarget(this.zeppelinGO, DISTANCE_CAMERA_ZEPPELIN);
    }
  }

  focusTarget(target, distance) {
    this.focusCamera.setTarget(target);
    this.focusCamera.focusTarget(this.fetchStaticObject(), distance);
  }
}

//focus
const CAMERA_ANGLE = Math.PI / 20;
const THIRD_PERSON_FOV = 60;

class Focus {
  constructor(camera) {
    //quaternion
    this.quaternionCam = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.PI * 0.5, 0, 0)
    );
    this.quaternionAngle = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-CAMERA_ANGLE, 0, 0)
    );

    //three js camera
    this.camera = camera;
    camera.fov = THIRD_PERSON_FOV;

    //target
    this.target = null;
    this.bbTarget = null;

    //raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.camera = camera;

    //mode
    this.isTPV = true;
  }

  setTarget(gameObject) {
    if (this.target == gameObject) return; //only when its changed

    this.target = gameObject;

    if (this.target) {
      //follow tps
      this.camera.fov = THIRD_PERSON_FOV;
      const obj = this.target.getObject3D();
      this.bbTarget = new THREE.Box3().setFromObject(obj); //compute here one time
      this.camera.updateProjectionMatrix();
    }
  }

  focusTarget(obstacle, distance) {
    if (!this.target) {
      // console.warn('no target');
      return;
    }
    const transform = this.computeTransformTarget(obstacle, distance);

    this.camera.position.copy(transform.position);
    this.camera.quaternion.copy(transform.quaternion);

    this.camera.updateProjectionMatrix();
  }

  computeTransformTarget(obstacle = null, distance) {
    if (!this.target) return null;

    //world transform
    const obj = this.target.getObject3D();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    obj.matrixWorld.decompose(position, quaternion, new THREE.Vector3());

    const zDiff = this.bbTarget.max.z - this.bbTarget.min.z;
    position.z += zDiff;

    const dir = this.target
      .getDefaultForward()
      .applyQuaternion(this.quaternionAngle)
      .applyQuaternion(quaternion);

    if (this.isTPV && obstacle) {
      //compute intersection
      this.raycaster.set(position, dir.clone().negate());
      const intersects = this.raycaster.intersectObject(obstacle, true);
      if (intersects.length) {
        distance = Math.min(distance, intersects[0].distance);
      }
    }

    if (!this.isTPV) distance = -0.8;

    position.sub(dir.setLength(distance));

    quaternion.multiply(this.quaternionCam);
    quaternion.multiply(this.quaternionAngle);

    //this is not a transform of THREEUtils.Transform
    return { position: position, quaternion: quaternion };
  }

  toggleMode() {
    this.isTPV = !this.isTPV;

    if (this.isTPV) {
      this.camera.fov = 60;
    } else {
      this.camera.fov = 90;
    }

    this.camera.updateProjectionMatrix();
  }
}
