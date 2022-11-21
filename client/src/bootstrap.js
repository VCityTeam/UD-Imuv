/** @format */

import './style.css';

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import Pack from 'ud-viz/src/Game/Components/Pack';
import ImuvConstants from '../../imuv.constants';
import { SystemUtils } from 'ud-viz/src/Components/Components';

import { InfoUI } from './InfoUI/InfoUI';

//to launch a game
import * as JitsiIframeAPI from 'jitsi-iframe-api';
import { AnimatedText } from './LocalScriptsModule/AnimatedText/AnimatedText';
import { AssetsManager } from 'ud-viz/src/Views/Views';
import { DistantGame } from './DistantGame/DistantGame';
import { SignInView } from './Sign/Sign';

//declare global var _DEBUG_ flag
window.__DEBUG__ = process.env.NODE_ENV === 'development' ? true : false;

//Connect WebsocketService to Imuv Server
const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(
  ImuvConstants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
  function (message) {
    alert(message);
  }
);

const infoUI = new InfoUI();
infoUI.load('./commit_info.json').then(function () {
  document.body.appendChild(infoUI.html());
});

//Check URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD to decide what to do
const paramsUrl = new URLSearchParams(window.location.search);

const addReceptionView = function () {
  const reception = new ReceptionView(webSocketService);
  document.body.appendChild(reception.html());
};

if (paramsUrl.has(ImuvConstants.URL_PARAMETER.ID_KEY)) {
  const id = paramsUrl.get(ImuvConstants.URL_PARAMETER.ID_KEY);
  let event = null;
  let wrongParams = false;
  const params = {};

  switch (id) {
    case ImuvConstants.URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD.ID_VALUE:
      event = ImuvConstants.URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD;
      //get params
      for (const key in event.PARAMS_KEY) {
        const paramsKey = encodeURI(event.PARAMS_KEY[key]);
        if (!paramsUrl.has(paramsKey)) {
          wrongParams = true;
        } else {
          params[paramsKey] = decodeURIComponent(paramsUrl.get(paramsKey));
        }
      }

      if (wrongParams) {
        console.warn('wrong params url');
        addReceptionView();
      } else {
        //JSON transform
        params[event.PARAMS_KEY.POSITION] = Pack.vector3ArrayFromURIComponent(
          params[event.PARAMS_KEY.POSITION]
        );
        params[event.PARAMS_KEY.ROTATION] = Pack.eulerArrayFromURIComponent(
          params[event.PARAMS_KEY.ROTATION]
        );

        if (
          params[event.PARAMS_KEY.POSITION] &&
          params[event.PARAMS_KEY.ROTATION]
        ) {
          const signInView = new SignInView(webSocketService);
          document.body.appendChild(signInView.html());

          const launchGame = function (role) {
            signInView.dispose();

            SystemUtils.File.loadJSON('./assets/config/config_game.json').then(
              function (config) {
                //load assets
                const assetsManager = new AssetsManager();
                assetsManager
                  .loadFromConfig(config.assetsManager, document.body)
                  .then(function () {
                    const distantGame = new DistantGame(
                      webSocketService,
                      assetsManager,
                      config
                    );

                    distantGame.start(
                      {
                        firstGameView: false,
                        editorMode: false,
                        role: role,
                      },
                      {
                        ImuvConstants: ImuvConstants,
                        AnimatedText: AnimatedText,
                        JitsiIframeAPI: JitsiIframeAPI,
                      }
                    );

                    //app is loaded and ready to receive worldstate
                    webSocketService.emit(
                      ImuvConstants.WEBSOCKET.MSG_TYPES.READY_TO_RECEIVE_STATE,
                      params
                    );
                  });
              }
            );
          };

          //wait event to launchGame as not guest
          webSocketService.on(
            ImuvConstants.WEBSOCKET.MSG_TYPES.SIGNED,
            function (data) {
              if (data.role != ImuvConstants.USER.ROLE.GUEST) {
                launchGame(data.role);
              }
            }
          );

          //launchGame as a guest
          signInView.addButton("Continuer en tant qu'invité", function () {
            launchGame(ImuvConstants.USER.ROLE.GUEST);
          });
        } else {
          console.warn('wrong uri component');
          addReceptionView();
        }
      }

      break;
    default:
      console.warn('URL_PARAMETER ID not handle ', id);
      addReceptionView();
  }
} else {
  addReceptionView();
}
