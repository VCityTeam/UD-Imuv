/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import { SystemUtils } from 'ud-viz/src/Components/Components';
import Constants from 'ud-viz/src/Game/Components/Constants';
import { CommitInfo } from './CommitInfo/CommitInfo';

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

SystemUtils.File.loadJSON('./assets/commit/commit_info.json').then(
  (commitJson) => {
    const commitInfo = new CommitInfo(commitJson);
    document.body.appendChild(commitInfo.html());
  }
);
