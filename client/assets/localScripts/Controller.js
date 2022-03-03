/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const itownsType = require('itowns');
/** @type {itownsType} */
let itowns = null;

module.exports = class Controller {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
    itowns = udviz.itowns;

    //Avatar controller
    this.avatarGO = null;
    this.avatarCameraman = null;
    this.avatarController = false;

    //routines camera
    this.routines = [];

    //buffer
    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  fetchStaticObject(go) {
    const scriptStaticObject = go.fetchLocalScripts()['static_object'];
    return scriptStaticObject.getObject();
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();

    //DEBUG inputs
    const _this = this;
    manager.addKeyInput('p', 'keydown', function () {
      console.log('Gameview ', gameView);
      console.log('Camera ', camera);
      console.log('uuid ', udviz.THREE.MathUtils.generateUUID());

      const avatar = gameView.getLastState().gameObject.findByName('avatar');
      if (avatar) console.log(avatar.object3D);

      console.log(new Game.GameObject({}).toJSON(true));
    });
    manager.addKeyInput('a', 'keydown', function () {
      _this.setAvatarController(!_this.avatarController, localCtx);
    });
    manager.addMouseInput(manager.element, 'click', function () {
      manager.setPointerLock(false);
    });

    //init controllers
    this.initAvatarController(localCtx);

    if (localCtx.getGameView().getUserData('firstGameView')) {
      this.addTravelingRoutine(localCtx);
    } else {
      this.setAvatarController(true, localCtx);
    }
  }

  addRoutine(r) {
    this.routines.push(r);
  }

  hasRoutine() {
    return this.routines.length;
  }

  addTravelingRoutine(localCtx) {
    const splash = this.createSplashScreen();
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
          _this.setAvatarController(true, localCtx);
        }
      )
    );
  }

  initAvatarController(localCtx) {
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();

    //cameraman
    this.avatarCameraman = new AvatarCameraman(camera);

    //force listening so isPressed works
    manager.listenKeys(['c']);

    const _this = this;
    manager.addKeyInput('y', 'keydown', function () {
      _this.avatarCameraman.toggleMode();
    });
  }

  setAvatarController(value, localCtx) {
    if (value == this.avatarController) {
      console.warn('same value');
      return;
    }

    this.avatarController = value;

    //FORWARD
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const Command = Game.Command;

    if (value) {
      //forward
      manager.addKeyCommand(
        Command.TYPE.MOVE_FORWARD,
        ['z', 'ArrowUp'],
        function () {
          manager.setPointerLock(true);
          if (manager.isPressed('c')) {
            return new Command({ type: Command.TYPE.RUN });
          } else {
            return new Command({ type: Command.TYPE.MOVE_FORWARD });
          }
        }
      );

      //BACKWARD
      manager.addKeyCommand(
        Command.TYPE.MOVE_BACKWARD,
        ['s', 'ArrowDown'],
        function () {
          manager.setPointerLock(true);
          return new Command({ type: Command.TYPE.MOVE_BACKWARD });
        }
      );

      //LEFT
      manager.addKeyCommand(
        Command.TYPE.MOVE_LEFT,
        ['q', 'ArrowLeft'],
        function () {
          manager.setPointerLock(true);
          return new Command({ type: Command.TYPE.MOVE_LEFT });
        }
      );

      //RIGHT
      manager.addKeyCommand(
        Command.TYPE.MOVE_RIGHT,
        ['d', 'ArrowRight'],
        function () {
          manager.setPointerLock(true);
          return new Command({ type: Command.TYPE.MOVE_RIGHT });
        }
      );

      //ROTATE
      manager.addMouseCommand('mousemove', function () {
        if (
          manager.getPointerLock() ||
          (this.isDragging() && !manager.getPointerLock())
        ) {
          const event = this.event('mousemove');
          if (event.movementX != 0 || event.movementY != 0) {
            let pixelX = -event.movementX;
            let pixelY = -event.movementY;

            if (this.isDragging()) {
              const dragRatio = 2; //TODO conf ?
              pixelX *= dragRatio;
              pixelY *= dragRatio;
            }

            return new Command({
              type: Command.TYPE.ROTATE,
              data: {
                vector: new Game.THREE.Vector3(pixelY, 0, pixelX),
              },
            });
          }
        }
        return null;
      });
    } else {
      manager.removeKeyCommand(Command.TYPE.MOVE_FORWARD, ['z', 'ArrowUp']);
      manager.removeKeyCommand(Command.TYPE.MOVE_BACKWARD, ['s', 'ArrowDown']);
      manager.removeKeyCommand(Command.TYPE.MOVE_RIGHT, ['d', 'ArrowRight']);
      manager.removeKeyCommand(Command.TYPE.MOVE_LEFT, ['q', 'ArrowLeft']);
      manager.removeMouseCommand('mousemove');
    }
  }

  createSplashScreen() {
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
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //if not initialized look for avatar go
    if (!this.avatarGO) {
      this.avatarGO = localCtx
        .getGameView()
        .getLastState()
        .getGameObject()
        .find(localCtx.getGameView().getUserData('avatarUUID'));

      //init dynamically
      this.avatarCameraman.setTarget(this.avatarGO);
    }

    //routines are prior
    if (this.hasRoutine()) {
      const currentRoutine = this.routines[0];
      const finished = currentRoutine.tick(localCtx.getDt());
      if (finished) {
        currentRoutine.onEnd();
        this.routines.shift(); //remove
      }
    } else {
      if (this.avatarController) {
        this.avatarCameraman.focusTarget(this.fetchStaticObject(go));
      }
    }
  }

  initSwitchItownsController(localCtx) {
    const _this = this;

    const gameView = localCtx.getGameView();
    const div = gameView.getRenderer().domElement;
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();
    const Routine = Game.Components.Routine;
    const Command = Game.Command;

    //SWITCH CONTROLS
    const view = gameView.getItownsView();
    if (view) {
      manager.addKeyInput('a', 'keydown', function () {
        if (_this.avatarCameraman.hasRoutine()) return; //already routine

        const duration = 2000;
        let currentTime = 0;
        const camera = _this.avatarCameraman.getCamera();

        let startPos = camera.position.clone();
        let startQuat = camera.quaternion.clone();

        if (view.controls) {
          //record
          const camera = _this.avatarCameraman.getCamera();
          _this.itownsCamPos.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          _this.itownsCamQuat.setFromEuler(camera.rotation);

          _this.avatarCameraman.addRoutine(
            new Routine(
              function (dt) {
                const t = _this.avatarCameraman.computeTransformTarget();

                //no avatar yet
                if (!t) return false;

                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                view.notifyChange(); //trigger camera event

                return ratio >= 1;
              },
              function () {
                view.controls.dispose();
                view.controls = null;
              }
            )
          );
        } else {
          if (!_this.itownsCamPos && !_this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new Game.THREE.Vector3().copy(
              _this.avatarCameraman.getCamera().position
            );

            //200 meters up
            const endPosition = new Game.THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new Game.THREE.Quaternion().setFromEuler(
              new Game.THREE.Euler(0, 0, 0)
            );

            _this.itownsCamPos = endPosition;
            _this.itownsCamQuat = endQuaternion;
          }

          _this.avatarCameraman.addRoutine(
            new Routine(
              function (dt) {
                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = _this.itownsCamPos.clone().lerp(startPos, 1 - ratio);
                const q = _this.itownsCamQuat
                  .clone()
                  .slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                view.notifyChange(); //trigger camera event

                return ratio >= 1;
              },
              function () {
                manager.setPointerLock(false);

                //creating controls like put it in _this.view.controls
                const c = new itowns.PlanarControls(view, {
                  handleCollision: false,
                  focusOnMouseOver: false, //TODO itowns bug not working
                  focusOnMouseClick: false,
                  zoomFactor: 0.9, //TODO working ?
                });
              }
            )
          );
        }
      });
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
