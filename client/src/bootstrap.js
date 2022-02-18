/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import Constants from 'ud-viz/src/Game/Components/Constants';

const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(
  Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
  function (message) {
    alert(message);
  }
);

const reception = new ReceptionView(webSocketService);
document.body.appendChild(reception.html());