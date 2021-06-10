/** @format */

import { Game, THREE } from 'ud-viz';
import Routine from 'ud-viz/src/Game/Shared/Components/Routine';
import { MenuAvatarView } from '../MenuAvatar/MenuAvatar';
import Data from 'ud-viz/src/Game/Shared/Components/Data';
import WorldStateDiff from 'ud-viz/src/Game/Shared/WorldStateDiff';

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

  start(onLoad, firstGameView, isGuest) {
    this.gameView = new Game.GameView({
      isLocal: false,
      assetsManager: this.assetsManager,
      webSocketService: this.webSocketService,
      worldStateInterpolator: new Game.Components.WorldStateInterpolator(
        this.config.worldStateInterpolator
      ),
      config: this.config,
      firstGameView: firstGameView,
    });

    const gV = this.gameView;
    const _this = this;

    // Register callbacks
    this.webSocketService.on(
      Data.WEBSOCKET.MSG_TYPES.JOIN_WORLD,
      (firstStateJSON) => {
        if (!firstStateJSON) throw new Error('no data');
        console.log('JOIN_WORLD ', firstStateJSON);

        //TODO mettre un flag initialized a la place de check this.view (wait refacto ud-vizView)
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
        _this.gameView
          .getWorldStateInterpolator()
          .onNewDiff(new WorldStateDiff(diffJSON));
      }
    );

    this.gameView.load().then(function () {
      onLoad();

      //register in tick of the gameview
      gV.addTickRequester(function () {
        gV.getInputManager().sendCommandsToServer(_this.webSocketService);
      });
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
          gV.setPause(false);
          //append html
          document.body.appendChild(gV.html());
        });

        //remove html
        gV.html().remove();
        //stop rendering view
        gV.setPause(true);
        //add menuavatar view
        document.body.appendChild(menuAvatar.html());
      };
    }
  }
}
