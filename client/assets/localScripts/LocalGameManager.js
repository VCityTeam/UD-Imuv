/** @format */

//dynamics modules
let udviz = null;
let Shared = null;
let itowns = null;

module.exports = class LocalGameManager {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
    itowns = udviz.itowns;

    this.obstacle = new Shared.THREE.Object3D();
    this.obstacle.name = 'LocalGameManager_Obstacle';

    this.cameraman = null;

    this.fogObject = null;

    //dynamic html
    this.fpsLabel = null;
    this.avatarCount = null;
    this.createBBBRoomButton = null;

    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //init obstacle
    const state = localCtx.getGameView().getLastState();
    const o = state.getOrigin();
    if (!o) debugger; //DEBUG
    const [x, y] = Shared.proj4.default('EPSG:3946').forward([o.lng, o.lat]);

    this.obstacle.position.x = x;
    this.obstacle.position.y = y;
    this.obstacle.position.z = o.alt;

    this.fogObject = new Shared.THREE.Fog(
      localCtx.getGameView().getSkyColor(),
      this.conf.fog.near,
      this.conf.fog.far
    );

    //init cameraman
    this.cameraman = new Cameraman(
      localCtx.getGameView().getItownsView().camera.camera3D
    );

    this.initInputs(localCtx);
    this.initUI(go, localCtx);

    if (localCtx.getGameView().getUserData('firstGameView')) {
      this.initTraveling(localCtx.getGameView().getItownsView());
    }

    const w = localCtx.getWebSocketService();
    if (w) {
      const _this = this;
      w.on(
        udviz.Game.Shared.Components.Constants.WEBSOCKET.MSG_TYPES.ON_BBB_URL,
        function (data) {
          //create a join button
          const joinButton = document.createElement('div');
          joinButton.classList.add('button_Editor'); //TODO css class
          joinButton.innerHTML = 'join ' + data.name;
          localCtx.getGameView().appendToUI(joinButton);

          joinButton.onclick = function () {
            const iframe = document.createElement('iframe');
            iframe.src = data.url;
            iframe.style.width = '500px';
            iframe.style.height = '500px';
            const suddomain = '*';
            iframe.allow =
              'microphone ' + suddomain + '; camera  ' + suddomain + ';';

            console.log(iframe);
            localCtx.getGameView().appendToUI(iframe);
          };
        }
      );

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          console.log('Video + audio allowed');
        })
        .catch((e) => {
          console.log('e: ', e);
        });
    }
  }

  initUI(go, localCtx) {
    const gameView = localCtx.getGameView();

    this.fpsLabel = document.createElement('div');
    this.fpsLabel.classList.add('label_localGameManager');
    gameView.appendToUI(this.fpsLabel);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('label_localGameManager');
    gameView.appendToUI(this.avatarCount);

    const webSocketService = localCtx.getWebSocketService();
    if (webSocketService) {
      this.createBBBRoomButton = document.createElement('div');
      this.createBBBRoomButton.classList.add('button_Editor'); //TODO put another css classes
      this.createBBBRoomButton.innerHTML = 'Create BBB Room';
      gameView.appendToUI(this.createBBBRoomButton);

      //Callbacks
      this.createBBBRoomButton.onclick = function () {
        webSocketService.emit(
          udviz.Game.Shared.Components.Constants.WEBSOCKET.MSG_TYPES
            .CREATE_BBB_ROOM
        );
      };
    }

    this.updateUI(go, localCtx);
  }

  initTraveling(view) {
    const splash = this.createSplashScreen();
    const duration = this.conf.traveling_time;
    if (!duration) return; //if no traveling time return

    const _this = this;

    document.body.appendChild(splash);

    const cameraman = this.cameraman;
    let currentTime = 0;
    cameraman.setFilmingTarget(false);
    const camera = cameraman.getCamera();
    const startPos = new Shared.THREE.Vector3(
      1843660.0895859331,
      5174613.11242678,
      485.8525534292738
    );
    const startQuat = new Shared.THREE.Quaternion(
      0.027576004167469807,
      0.6755682684405119,
      0.736168525226603,
      0.030049644525890727
    );

    camera.position.copy(startPos);
    camera.quaternion.copy(startQuat);
    camera.updateProjectionMatrix();

    //first travelling
    cameraman.addRoutine(
      new Shared.Components.Routine(
        function (dt) {
          const t = cameraman.computeTransformTarget();

          //no avatar yet
          if (!t) return false;

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
          cameraman.setFilmingTarget(true);
          _this.setFog(view, true);
        }
      )
    );
  }

  createSplashScreen() {
    const result = document.createElement('div');
    result.classList.add('splash_localGameManager');

    const bg = document.createElement('div');
    bg.classList.add('bg_splash_localGameManager');
    result.appendChild(bg);

    const label = document.createElement('div');
    label.classList.add('label_splash_localGameManager');
    label.innerHTML = 'Welcome to Flying Campus';
    result.appendChild(label);

    return result;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    this.cameraman.tick(
      localCtx.getDt(),
      localCtx.getGameView().getLastState(),
      localCtx.getGameView().getUserData('avatarUUID'),
      this.obstacle
    );

    this.updateUI(go, localCtx);
  }

  updateUI(go, localCtx) {
    //update ui
    this.fpsLabel.innerHTML = 'FPS = ' + Math.round(1000 / localCtx.getDt());
    let avatarCount = 0;
    go.traverse(function (g) {
      if (g.name == 'avatar') avatarCount++;
    });
    this.avatarCount.innerHTML = 'Player: ' + avatarCount;
  }

  onNewGameObject() {
    const newGO = arguments[2];

    const _this = this;

    //add static object to obstacle
    if (newGO.isStatic()) {
      //register in obstacle
      const r = newGO.getComponent(Shared.Render.TYPE);
      if (r) {
        const clone = r.computeOriginalObject3D();

        const wT = newGO.computeWorldTransform();

        clone.position.x = wT.position.x;
        clone.position.y = wT.position.y;
        clone.position.z = wT.position.z;

        clone.rotation.x = wT.rotation.x;
        clone.rotation.y = wT.rotation.y;
        clone.rotation.z = wT.rotation.z;

        clone.scale.x = wT.scale.x;
        clone.scale.y = wT.scale.y;
        clone.scale.z = wT.scale.z;

        _this.obstacle.add(clone);
        _this.obstacle.updateMatrixWorld();
      }
    }
  }

  setFog(view, value) {
    if (value) {
      view.scene.fog = this.fogObject;
    } else {
      view.scene.fog = null;
    }
  }

  initInputs(localCtx) {
    const _this = this;

    const gameView = localCtx.getGameView();
    const view = gameView.getItownsView();
    const viewerDiv = view.domElement;
    const camera = view.camera.camera3D;
    const manager = gameView.getInputManager();
    const Routine = Shared.Components.Routine;
    const Command = Shared.Command;

    viewerDiv.requestPointerLock =
      viewerDiv.requestPointerLock || viewerDiv.mozRequestPointerLock;
    document.exitPointerLock =
      document.exitPointerLock || document.mozExitPointerLock;

    const MODE = {
      DEFAULT: 0,
      POINTER_LOCK: 1,
    };
    let currentMode = MODE.DEFAULT;
    const swicthMode = function (newMode) {
      currentMode = newMode;

      switch (currentMode) {
        case MODE.DEFAULT:
          document.exitPointerLock();
          break;
        case MODE.POINTER_LOCK:
          viewerDiv.requestPointerLock();
          break;

        default:
          break;
      }
    };

    //INPUTS LOCAL

    //SWITCH CONTROLS
    manager.addKeyInput('a', 'keydown', function () {
      if (_this.cameraman.hasRoutine()) return; //already routine

      const speed = 0.6;
      if (view.controls) {
        //record
        const camera = _this.cameraman.getCamera();
        _this.itownsCamPos.set(
          camera.position.x,
          camera.position.y,
          camera.position.z
        );
        _this.itownsCamQuat.setFromEuler(camera.rotation);

        _this.cameraman.addRoutine(
          new Routine(
            function (dt) {
              const t = _this.cameraman.computeTransformTarget();
              const camera = _this.cameraman.getCamera();
              const amount = speed * dt;
              const dist = t.position.distanceTo(camera.position);
              let ratio = amount / dist;
              ratio = Math.min(Math.max(0, ratio), 1);
              camera.position.lerp(t.position, ratio);
              camera.quaternion.slerp(t.quaternion, ratio);
              camera.updateProjectionMatrix();

              view.notifyChange(); //trigger camera event

              return ratio >= 1;
            },
            function () {
              view.controls.dispose();
              view.controls = null;
              _this.cameraman.setFilmingTarget(true);
              _this.setFog(view, true);
            }
          )
        );
      } else {
        if (!_this.itownsCamPos && !_this.itownsCamQuat) {
          //first time camera in sky

          const currentPosition = new Shared.THREE.Vector3().copy(
            _this.cameraman.getCamera().position
          );

          //200 meters up
          const endPosition = new Shared.THREE.Vector3(0, 0, 200).add(
            currentPosition
          );

          //look down
          const endQuaternion = new Shared.THREE.Quaternion().setFromEuler(
            new Shared.THREE.Euler(Math.PI / 5, 0, 0)
          );

          _this.itownsCamPos = endPosition;
          _this.itownsCamQuat = endQuaternion;
        }

        _this.setFog(view, false);

        _this.cameraman.addRoutine(
          new Routine(
            function (dt) {
              const camera = _this.cameraman.getCamera();
              const amount = speed * dt;
              const dist = _this.itownsCamPos.distanceTo(camera.position);
              let ratio = amount / dist;
              ratio = Math.min(Math.max(0, ratio), 1);
              camera.position.lerp(_this.itownsCamPos, ratio);
              camera.quaternion.slerp(_this.itownsCamQuat, ratio);
              camera.updateProjectionMatrix();

              view.notifyChange(); //trigger camera event

              return ratio >= 1;
            },
            function () {
              swicthMode(MODE.DEFAULT);

              //creating controls like put it in _this.view.controls
              const c = new itowns.PlanarControls(view, {
                handleCollision: false,
                focusOnMouseOver: false, //TODO itowns bug not working
                focusOnMouseClick: false,
              });

              _this.cameraman.setFilmingTarget(false);
            }
          )
        );
      }
    });

    manager.addKeyInput('p', 'keydown', function () {
      console.log('Gameview ', gameView);
      console.log('Camera ', camera);
    });

    //COMMANDS WORLD

    //FORWARD
    manager.listenKeys(['c']);
    manager.addKeyCommand(
      Command.TYPE.MOVE_FORWARD,
      ['z', 'ArrowUp'],
      function () {
        swicthMode(MODE.POINTER_LOCK);
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
        swicthMode(MODE.POINTER_LOCK);
        return new Command({ type: Command.TYPE.MOVE_BACKWARD });
      }
    );

    //LEFT
    manager.addKeyCommand(
      Command.TYPE.MOVE_LEFT,
      ['q', 'ArrowLeft'],
      function () {
        swicthMode(MODE.POINTER_LOCK);
        return new Command({ type: Command.TYPE.MOVE_LEFT });
      }
    );

    //RIGHT
    manager.addKeyCommand(
      Command.TYPE.MOVE_RIGHT,
      ['d', 'ArrowRight'],
      function () {
        swicthMode(MODE.POINTER_LOCK);
        return new Command({ type: Command.TYPE.MOVE_RIGHT });
      }
    );

    manager.addMouseCommand('mousedown', function () {
      const event = this.event('mousedown');
      swicthMode(MODE.DEFAULT);
      if (event.which != 3) return; //if its not a right click

      //1. sets the mouse position with a coordinate system where the center
      //   of the screen is the origin
      const mouse = new Shared.THREE.Vector2(
        -1 +
          (2 * event.offsetX) / (viewerDiv.clientWidth - viewerDiv.offsetLeft),
        1 - (2 * event.offsetY) / (viewerDiv.clientHeight - viewerDiv.offsetTop)
      );

      //2. set the picking ray from the camera position and mouse coordinates
      const raycaster = new Shared.THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      //3. compute intersections
      //TODO opti en enlevant la recursive et en selectionnant seulement les bon object3D

      const intersects = raycaster.intersectObject(_this.obstacle, true);

      if (intersects.length) {
        let minDist = Infinity;
        let p = null;

        intersects.forEach(function (i) {
          if (i.distance < minDist) {
            p = i.point;
            minDist = i.distance;
          }
        });

        //transform p map referentiel
        const bb = new Shared.THREE.Box3().setFromObject(_this.obstacle);
        p.sub(bb.min);

        //DEBUG
        console.log(p);

        _this.pointerMouseObject.position.copy(p.clone());
        _this.pointerMouseObject.updateMatrixWorld();

        return new Command({
          type: Command.TYPE.MOVE_TO,
          data: { target: new Shared.THREE.Vector2(p.x, p.y) },
        });
      } else {
        return null;
      }
    });

    //ROTATE
    manager.addMouseCommand('mousemove', function () {
      if (
        currentMode == MODE.POINTER_LOCK ||
        (this.isDragging() && currentMode == MODE.DEFAULT)
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
              vector: new Shared.THREE.Vector3(pixelY, 0, pixelX),
            },
          });
        }
      }
      return null;
    });
  }
};

//Cameraman
const CAMERA_ANGLE = Math.PI / 12;
const THIRD_PERSON_FOV = 60;

class Cameraman {
  constructor(camera) {
    //quaternion
    this.quaternionCam = new Shared.THREE.Quaternion().setFromEuler(
      new Shared.THREE.Euler(Math.PI * 0.5, 0, 0)
    );
    this.quaternionAngle = new Shared.THREE.Quaternion().setFromEuler(
      new Shared.THREE.Euler(-CAMERA_ANGLE, 0, 0)
    );

    //three js camera
    this.camera = camera;

    //target
    this.target = null;
    this.bbTarget = null;
    this.filmingTarget = true;

    //updating or not
    this.enabled = true;

    //raycaster
    this.raycaster = new Shared.THREE.Raycaster();
    this.raycaster.camera = camera;

    //routines
    this.routines = [];
  }

  isFilmingTarget() {
    return this.filmingTarget;
  }

  setFilmingTarget(value) {
    this.filmingTarget = value;
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
      this.bbTarget = new Shared.THREE.Box3().setFromObject(obj); //compute here one time
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

  computeTransformTarget(obstacle = null, distance) {
    if (!this.target) return null;

    //world transform
    const obj = this.target.computeObject3D();
    let position = new Shared.THREE.Vector3();
    let quaternion = new Shared.THREE.Quaternion();
    obj.matrixWorld.decompose(position, quaternion, new Shared.THREE.Vector3());

    const zDiff = this.bbTarget.max.z - this.bbTarget.min.z;
    position.z += zDiff;

    const dir = this.target
      .getDefaultForward()
      .applyQuaternion(this.quaternionAngle)
      .applyQuaternion(quaternion);

    //TODO compute dist so the bottom of the gameobject is at the bottom of the screen
    if (!distance) distance = 3;

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

  addRoutine(routine) {
    this.routines.push(routine);
  }

  hasRoutine() {
    return this.routines.length;
  }

  tick(dt, state, targetUUID, obstacle) {
    if (!this.enabled) return;

    if (!state) throw new Error('no state');
    const target = state.getGameObject().find(targetUUID); //TODO peut etre pas obligé de le reset a chaque fois
    this.setTarget(target);

    if (this.hasRoutine()) {
      const currentRoutine = this.routines[0];
      const finished = currentRoutine.tick(dt);
      if (finished) {
        currentRoutine.onEnd();
        this.routines.shift(); //remove
      }
    } else if (this.isFilmingTarget()) {
      this.focusTarget(obstacle);
    }
  }
}
