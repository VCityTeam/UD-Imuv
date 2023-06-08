import { Data } from '@ud-viz/shared';
import { SocketIOWrapper, AssetManager } from '@ud-viz/browser';
import { Constant as UDIMUVConstant } from '@ud-imuv/shared';
import { InfoUI } from './InfoUI/InfoUI';
import { ReceptionView } from './Reception/Reception';
import { SignInView } from './Sign/Sign';

// connect to gamesocketservice
const socketIOWrapper = new SocketIOWrapper();
socketIOWrapper.connectToServer();
socketIOWrapper.on(UDIMUVConstant.WEBSOCKET.MSG_TYPE.INFO, (message) => {
  console.info(message);
});

const infoUI = new InfoUI();
infoUI.load('./commit_info.json').then(function () {
  document.body.appendChild(infoUI.html());
});

const addReceptionView = () => {
  const reception = new ReceptionView(socketIOWrapper);
  document.body.appendChild(reception.html());
};

//Check URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD to decide what to do
const paramsUrl = new URLSearchParams(window.location.search);

if (paramsUrl.has(UDIMUVConstant.URL_PARAMETER.ID_KEY)) {
  const id = paramsUrl.has(UDIMUVConstant.URL_PARAMETER.ID_KEY);
  let event = null;
  let wrongParams = false;
  const params = {};

  switch (id) {
    case UDIMUVConstant.URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD.ID_VALUE:
      event = UDIMUVConstant.URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD;
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
        params[event.PARAMS_KEY.POSITION] = Data.vector3ArrayFromURIComponent(
          params[event.PARAMS_KEY.POSITION]
        );
        params[event.PARAMS_KEY.ROTATION] = Data.eulerArrayFromURIComponent(
          params[event.PARAMS_KEY.ROTATION]
        );

        if (
          params[event.PARAMS_KEY.POSITION] &&
          params[event.PARAMS_KEY.ROTATION]
        ) {
          const signInView = new SignInView(socketIOWrapper);
          document.body.appendChild(signInView.html());

          const launchGame = function (role) {
            signInView.dispose();

            FileUtil.loadJSON('./assets/config/config.json').then(function (
              config
            ) {
              //load assets
              const assetManager = new AssetManager();
              assetManager
                .loadFromConfig(config.assetManager, document.body)
                .then(() => {
                  debugger;
                  // const distantGame = new DistantGame(
                  //   webSocketService,
                  //   assetManager,
                  //   config
                  // );
                  // distantGame.start(
                  //   {
                  //     firstGameView: false,
                  //     editorMode: false,
                  //     role: role,
                  //   },
                  //   {
                  //     Constant: Constant,
                  //     AnimatedText: AnimatedText,
                  //     JitsiIframeAPI: JitsiIframeAPI,
                  //   }
                  // );
                  // //app is loaded and ready to receive worldstate
                  // webSocketService.emit(
                  //   Constant.WEBSOCKET.MSG_TYPE.READY_TO_RECEIVE_STATE,
                  //   params
                  // );
                });
            });
          };

          //wait event to launchGame as not guest
          socketIOWrapper.on(
            UDIMUVConstant.WEBSOCKET.MSG_TYPE.SIGNED,
            function (data) {
              if (data.role != UDIMUVConstant.USER.ROLE.GUEST) {
                launchGame(data.role);
              }
            }
          );

          //launchGame as a guest
          signInView.addButton("Continuer en tant qu'invité", function () {
            launchGame(UDIMUVConstant.USER.ROLE.GUEST);
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
