/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import { SystemUtils } from 'ud-viz/src/Components/Components';
import Constants from 'ud-viz/src/Game/Components/Constants';

const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(
  Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
  function (message) {
    alert(message);
  }
);

SystemUtils.File.loadJSON('./assets/config/config_features.json').then(
  (configFeatures) => {
    const reception = new ReceptionView(webSocketService, configFeatures);
    document.body.appendChild(reception.html());
  }
);
