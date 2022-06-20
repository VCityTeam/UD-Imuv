/** @format */

import WorldStateInterpolator from 'ud-viz/src/Game/WorldStateInterpolator';
import { WorldState, WorldStateDiff } from 'ud-viz/src/Game/Game';
import { GameView } from 'ud-viz/src/Views/Views';
import ImuvConstants from '../../../imuv.constants';

export class DistantGame {
  constructor(webSocketService, assetsManager, config) {
    this.config = config;
    this.interpolator = new WorldStateInterpolator(
      config.worldStateInterpolator.renderDelay
    );
    this.webSocketService = webSocketService;
    this.assetsManager = assetsManager;
    this.gameView = null;
  }

  /**
   *
   * @returns {GameView} return the gameview of the local game
   */
  getGameView() {
    return this.gameView;
  }

  /**
   * dispose the application
   */
  dispose(keepAssets = false) {
    if (this.gameView) this.gameView.dispose(keepAssets); //keep assets
    //reset websocketservices
    this.webSocketService.reset([
      ImuvConstants.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
      ImuvConstants.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
    ]);
  }

  reset(userData, localScriptModules) {
    this.dispose(true);

    const gV = new GameView({
      assetsManager: this.assetsManager,
      interpolator: this.interpolator,
      config: this.config,
      userData: userData,
      localScriptModules: localScriptModules,
    });

    const ctxGameView = gV.getLocalContext();
    ctxGameView.setWebSocketService(this.webSocketService);

    //register in tick of the gameview
    const _this = this;
    gV.addTickRequester(function () {
      const cmds = gV.getInputManager().computeCommands();
      const cmdsJSON = [];
      cmds.forEach(function (cmd) {
        cmdsJSON.push(cmd.toJSON());
      });
      _this.webSocketService.emit(
        ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS,
        cmdsJSON
      );
    });

    this.gameView = gV;
  }

  start(userData = {}, localScriptModules) {
    return new Promise((resolve) => {
      this.reset(userData, localScriptModules);

      const _this = this;

      // Register callbacks
      this.webSocketService.on(
        ImuvConstants.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
        (json) => {
          if (!json) throw new Error('no data');
          console.warn(ImuvConstants.WEBSOCKET.MSG_TYPES.JOIN_WORLD, json);

          const state = new WorldState(json.state);

          if (_this.gameView.getLastState()) {
            userData.firstGameView = false;
            _this.start(userData, localScriptModules);
          }

          _this.interpolator.onFirstState(state);
          _this.gameView.writeUserData('avatarUUID', json.avatarUUID);
          _this.gameView.writeUserData('userID', json.userID);
          _this.gameView.writeUserData('settings', json.settings);
          _this.gameView.start(state).then(resolve);
        }
      );

      this.webSocketService.on(
        ImuvConstants.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
        (diffJSON) => {
          _this.interpolator.onNewDiff(new WorldStateDiff(diffJSON));
        }
      );
    });
  }
}
