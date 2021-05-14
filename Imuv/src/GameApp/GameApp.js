/** @format */

import { Game, jquery } from 'ud-viz';

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

    const offsetTime = 1000;

    const splash = this.createSplashScreen();
    document.body.appendChild(splash);
    setTimeout(function () {
      splash.remove();
    }, offsetTime + this.config.game.traveling_time);

    this.gameView.load().then(onLoad);
  }
}
