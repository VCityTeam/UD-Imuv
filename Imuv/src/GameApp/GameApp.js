/** @format */

import { Game } from 'ud-viz';
import { Routine } from 'ud-viz/src/Game/Components/Cameraman';

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

  start(onLoad) {
    this.gameView = new Game.GameView({
      isLocal: false,
      assetsManager: this.assetsManager,
      webSocketService: this.webSocketService,
      worldStateInterpolator: new Game.Components.WorldStateInterpolator(
        this.config.worldStateInterpolator
      ),
      config: this.config,
    });

    const duration = this.config.game.traveling_time;
    const gV = this.gameView;
    const splash = this.createSplashScreen();

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
      const startPos = camera.position.clone();
      const startQuat = camera.quaternion.clone();

      //first travelling
      cameraman.addRoutine(
        new Routine(
          function (dt) {
            const t = cameraman.computeTransformTarget();

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

    this.gameView.load().then(onLoad);
  }
}
