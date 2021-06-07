/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Game/Components/WebSocketService';
import Data from 'ud-viz/src/Game/Shared/Components/Data';

const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(Data.WEBSOCKET.MSG_TYPES.SERVER_ALERT, function (message) {
  alert(message);
});

const reception = new ReceptionView(webSocketService);
document.body.appendChild(reception.html());
