/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Camera {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.avatarGO = null;
    this.avatarCameraman = null;

    //routines camera
    this.routines = [];
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();

    //cameraman
    this.avatarCameraman = new AvatarCameraman(camera);

    const _this = this;
    manager.addKeyInput('y', 'keydown', function () {
      _this.avatarCameraman.toggleMode();
    });

    if (localCtx.getGameView().getUserData('firstGameView')) {
      //work with avatar_controller localscript
      this.addTravelingRoutine(localCtx);
    }
  }

  fetchStaticObject(go) {
    const scriptStaticObject = go.fetchLocalScripts()['static_object'];
    return scriptStaticObject.getObject();
  }

  addRoutine(r) {
    this.routines.push(r);
  }

  hasRoutine() {
    return this.routines.length;
  }

  addTravelingRoutine(localCtx) {
    //anonymous function
    const createSplashScreen = function () {
      const result = document.createElement('div');
      result.classList.add('splash_controller');

      const bg = document.createElement('div');
      bg.classList.add('bg_splash_controller');
      result.appendChild(bg);

      const label = document.createElement('div');
      label.classList.add('label_splash_controller');
      label.innerHTML = 'Welcome to Flying Campus';
      result.appendChild(label);

      return result;
    };

    const splash = createSplashScreen();
    const duration = this.conf.traveling_time;
    if (!duration) return; //if no traveling time return

    const _this = this;

    document.body.appendChild(splash);
    const camera = localCtx.getGameView().getCamera();

    //buffer
    let startPos = null;
    let startQuat = null;
    let currentTime = 0;

    //first travelling
    this.addRoutine(
      new Game.Components.Routine(
        function (dt) {
          if (!_this.avatarGO) return false;
          const t = _this.avatarCameraman.computeTransformTarget();

          //init relatively
          if (!startPos && !startQuat) {
            startPos = t.position
              .clone()
              .sub(new Game.THREE.Vector3(-1000, -1000, -1000));
            startQuat = t.quaternion
              .clone()
              .multiply(
                new Game.THREE.Quaternion().setFromEuler(
                  new Game.THREE.Euler(-Math.PI * 0.5, 0, 0)
                )
              );
          }

          currentTime += dt;
          const ratio = Math.min(Math.max(0, currentTime / duration), 1);

          const p = t.position.lerp(startPos, 1 - ratio);
          const q = t.quaternion.slerp(startQuat, 1 - ratio);

          camera.position.copy(p);
          camera.quaternion.copy(q);

          camera.updateProjectionMatrix();

          return ratio >= 1;
        },
        function () {
          splash.remove();
          const rootGO = localCtx.getRootGameObject();
          const avatarController =
            rootGO.fetchLocalScripts()['avatar_controller'];
          avatarController.setAvatarControllerMode(true, localCtx);
        }
      )
    );
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //if not initialized look for avatar go
    if (!this.avatarGO) {
      this.avatarGO = localCtx
        .getRootGameObject()
        .find(localCtx.getGameView().getUserData('avatarUUID'));

      //init dynamically
      this.avatarCameraman.setTarget(this.avatarGO);
    }

    const rootGO = localCtx.getRootGameObject();
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];

    //routines are prior
    if (this.hasRoutine()) {
      const currentRoutine = this.routines[0];
      const finished = currentRoutine.tick(localCtx.getDt());
      if (finished) {
        currentRoutine.onEnd();
        this.routines.shift(); //remove
      }
    } else if (avatarController.getAvatarControllerMode()) {
      this.avatarCameraman.focusTarget(this.fetchStaticObject(go));
    }
  }
};

//avatarCameraman
const CAMERA_ANGLE = Math.PI / 12;
const THIRD_PERSON_FOV = 60;

class AvatarCameraman {
  constructor(camera) {
    //quaternion
    this.quaternionCam = new Game.THREE.Quaternion().setFromEuler(
      new Game.THREE.Euler(Math.PI * 0.5, 0, 0)
    );
    this.quaternionAngle = new Game.THREE.Quaternion().setFromEuler(
      new Game.THREE.Euler(-CAMERA_ANGLE, 0, 0)
    );

    //three js camera
    this.camera = camera;

    //target
    this.target = null;
    this.bbTarget = null;

    //raycaster
    this.raycaster = new Game.THREE.Raycaster();
    this.raycaster.camera = camera;

    //mode
    this.isTPV = true;
  }

  getCamera() {
    return this.camera;
  }

  setTarget(gameObject) {
    if (this.target == gameObject) return; //only when its changed

    this.target = gameObject;

    if (this.target) {
      //follow tps
      this.camera.fov = THIRD_PERSON_FOV;
      const obj = this.target.computeObject3D();
      this.bbTarget = new Game.THREE.Box3().setFromObject(obj); //compute here one time
      this.camera.updateProjectionMatrix();
    }
  }

  focusTarget(obstacle) {
    if (!this.target) {
      // console.warn('no target');
      return;
    }
    const transform = this.computeTransformTarget(obstacle);

    this.camera.position.copy(transform.position);
    this.camera.quaternion.copy(transform.quaternion);

    this.camera.updateProjectionMatrix();
  }

  computeTransformTarget(obstacle = null) {
    if (!this.target) return null;

    //world transform
    const obj = this.target.computeObject3D();
    let position = new Game.THREE.Vector3();
    let quaternion = new Game.THREE.Quaternion();
    obj.matrixWorld.decompose(position, quaternion, new Game.THREE.Vector3());

    const zDiff = this.bbTarget.max.z - this.bbTarget.min.z;
    position.z += zDiff;

    const dir = this.target
      .getDefaultForward()
      .applyQuaternion(this.quaternionAngle)
      .applyQuaternion(quaternion);

    //TODO compute dist so the bottom of the gameobject is at the bottom of the screen
    let distance = 3;
    if (!this.isTPV) distance = -3;

    //compute intersection
    if (obstacle) {
      //TODO opti calcul avec un bvh ? ou avec un plan au niveau du perso?
      this.raycaster.set(position, dir.clone().negate());
      const intersects = this.raycaster.intersectObject(obstacle, true);
      if (intersects.length) {
        intersects.forEach(function (inter) {
          distance = Math.min(distance, inter.distance);
        });
      }
    }

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
