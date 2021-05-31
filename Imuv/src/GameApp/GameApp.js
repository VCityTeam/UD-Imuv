/** @format */

import { Game, THREE } from 'ud-viz';
import { Routine } from 'ud-viz/src/Game/Components/Cameraman';
import { MenuAvatarView } from '../MenuAvatar/MenuAvatar';
const Data = require('ud-viz/src/Game/Shared/Components/Data');
const WorldStateDiff = require('ud-viz/src/Game/Shared/WorldStateDiff');

import './GameApp.css';

export class GameApp {
  constructor(webSocketService, assetsManager, config) {
    this.gameView = null;
    this.assetsManager = assetsManager;
    this.webSocketService = webSocketService;

    this.config = config;

    //DEBUG
    // window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  createSplashScreen() {
    const result = document.createElement('div');
    result.classList.add('splash_GameApp');

    const bg = document.createElement('div');
    bg.classList.add('bg_splash_GameApp');
    result.appendChild(bg);

    const label = document.createElement('div');
    label.classList.add('label_splash_GameApp');
    label.innerHTML = 'Welcome to Flying Campus';
    result.appendChild(label);

    return result;
  }

  start(onLoad, travelling, isGuest) {
    this.gameView = new Game.GameView({
      isLocal: false,
      assetsManager: this.assetsManager,
      webSocketService: this.webSocketService,
      worldStateInterpolator: new Game.Components.WorldStateInterpolator(
        this.config.worldStateInterpolator
      ),
      config: this.config,
    });

    const gV = this.gameView;
    const _this = this;

    if (travelling) {
      const splash = this.createSplashScreen();
      const duration = this.config.game.traveling_time;

      this.gameView.setOnFirstStateEnd(function () {
        const offsetTime = 1000;

        document.body.appendChild(splash);
        setTimeout(function () {
          splash.remove();
        }, offsetTime + duration);

        const cameraman = gV.getCameraman();
        let currentTime = 0;
        cameraman.setFilmingTarget(false);
        const camera = cameraman.getCamera();
        const startPos = new THREE.Vector3(
          1843660.0895859331,
          5174613.11242678,
          485.8525534292738
        );
        const startQuat = new THREE.Quaternion(
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
          new Routine(
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
              cameraman.setFilmingTarget(true);
              gV.setFog(true);
            }
          )
        );
      });
    }

    // Register callbacks
    this.webSocketService.on(
      Data.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
      (firstStateJSON) => {
        if (!firstStateJSON) throw new Error('no data');
        console.log('JOIN_WORLD ', firstStateJSON);

        //TODO mettre un flag initialized a la place de check this.view
        if (!_this.gameView.view) {
          //view was not intialized do it
          _this.gameView.onFirstStateJSON(firstStateJSON);
        } else {
          //this need to be disposed
          _this.gameView.dispose();

          //reset websocketservices
          _this.webSocketService.reset([
            Data.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
            Data.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
          ]);

          _this.start(
            function () {
              _this.gameView.onFirstStateJSON(firstStateJSON);
              console.log('gameview loaded');
            },
            false,
            isGuest
          );
        }
      }
    );

    this.webSocketService.on(
      Data.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
      (diffJSON) => {
        // console.log(_this.id, ' diff');

        //TODO getter worldstate interpolator
        _this.gameView.worldStateInterpolator.onNewDiff(
          new WorldStateDiff(diffJSON)
        );
      }
    );

    this.gameView.load().then(onLoad);

    if (!isGuest) {
      //INIT UI
      const menuAvatarButton = document.createElement('div');
      menuAvatarButton.classList.add('button_GameApp');
      menuAvatarButton.innerHTML = 'Menu Avatar';
      this.gameView.appendToUI(menuAvatarButton);

      //INIT CALLBACKS
      menuAvatarButton.onclick = function (event) {
        const menuAvatar = new MenuAvatarView(
          _this.webSocketService,
          _this.config,
          _this.assetsManager
        );

        //TODO clean this
        menuAvatar.setOnClose(function () {
          gV.setPause(false);
          gV.initInputs(gV.lastState);
          document.body.appendChild(gV.html());
        });
        gV.html().remove();
        gV.setPause(true);
        gV.inputManager.dispose();
        document.body.appendChild(menuAvatar.html());
      };
    }
  }
}
