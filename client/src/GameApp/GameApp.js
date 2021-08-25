/** @format */

import { Game } from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/GameView/GameView';
import { MenuAvatarView } from '../MenuAvatar/MenuAvatar';
import Constants from 'ud-viz/src/Game/Shared/Components/Constants';
import WorldStateDiff from 'ud-viz/src/Game/Shared/WorldStateDiff';
import WorldState from 'ud-viz/src/Game/Shared/WorldState';

import './GameApp.css';

export class GameApp {
  constructor(webSocketService, assetsManager, config) {
    this.gameView = null;
    this.assetsManager = assetsManager;
    this.webSocketService = webSocketService;

    this.worldStateInterpolator = null;

    this.config = config;
  }

  dispose() {
    this.gameView.dispose();
    //reset websocketservices
    this.webSocketService.reset([
      Constants.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
      Constants.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
    ]);
  }

  start(onLoad, firstGameView, isGuest) {
    const _this = this;

    const worldStateInterpolator = new Game.Components.WorldStateInterpolator(
      this.config.worldStateInterpolator
    );
    this.worldStateInterpolator = worldStateInterpolator;

    this.gameView = new GameView({
      assetsManager: this.assetsManager,
      stateComputer: worldStateInterpolator,
      config: this.config,
      firstGameView: firstGameView,
    });

    const onFirstStateJSON = function (json) {
      const state = new WorldState(json.state);
      _this.worldStateInterpolator.onFirstState(state);
      _this.gameView.onFirstState(state, json.avatarUUID);
    };

    // Register callbacks
    this.webSocketService.on(
      Constants.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
      (firstStateJSON) => {
        if (!firstStateJSON) throw new Error('no data');
        console.log('JOIN_WORLD ', firstStateJSON);

        if (!_this.gameView.getLastState()) {
          //view was not intialized do it
          onFirstStateJSON(firstStateJSON);
        } else {
          //this need to be disposed
          _this.dispose();

          _this.start(
            onFirstStateJSON.bind(_this, firstStateJSON),
            false,
            isGuest
          );
        }
      }
    );

    this.webSocketService.on(
      Constants.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF,
      (diffJSON) => {
        worldStateInterpolator.onNewDiff(new WorldStateDiff(diffJSON));
      }
    );

    //register in tick of the gameview
    this.gameView.addTickRequester(function () {
      _this.gameView
        .getInputManager()
        .sendCommandsToServer(_this.webSocketService);
    });

    if (!isGuest) {
      //INIT UI
      const menuAvatarButton = document.createElement('div');
      menuAvatarButton.classList.add('button_GameApp');
      menuAvatarButton.innerHTML = 'Menu Avatar';
      this.gameView.appendToUI(menuAvatarButton);

      //INIT CALLBACKS
      menuAvatarButton.onclick = function () {
        const menuAvatar = new MenuAvatarView(
          _this.webSocketService,
          _this.config,
          _this.assetsManager
        );

        menuAvatar.setOnClose(function () {
          //render view
          _this.gameView.setIsRendering(true);
          _this.gameView.getInputManager().setPause(false);
          //remove html
          menuAvatar.dispose();
          //append html
          document.body.appendChild(_this.gameView.html());
        });

        //remove html
        _this.gameView.html().remove();
        //stop rendering view
        _this.gameView.setIsRendering(false);
        _this.gameView.getInputManager().setPause(true);
        //add menuavatar view
        document.body.appendChild(menuAvatar.html());
      };
    }

    onLoad();
  }
}
