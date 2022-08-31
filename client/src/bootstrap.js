/** @format */

import { ReceptionView } from './Reception/Reception';
import { WebSocketService } from 'ud-viz/src/Components/WebSocketService';
import ImuvConstants from '../../imuv.constants';
import { CommitInfo } from './CommitInfo/CommitInfo';
import { DocPage } from './Doc/Doc';
import { SystemUtils } from 'ud-viz/src/Components/Components';

//declare global var _DEBUG_ flag
window.__DEBUG__ = process.env.NODE_ENV === 'development' ? true : false;

const webSocketService = new WebSocketService();
webSocketService.connectToServer();

webSocketService.on(
  ImuvConstants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
  function (message) {
    alert(message);
  }
);

const reception = new ReceptionView(webSocketService);
document.body.appendChild(reception.html());

SystemUtils.File.loadJSON('./commit_info.json').then((commitJson) => {
  const commitInfo = new CommitInfo(commitJson);
  document.body.appendChild(commitInfo.html());
});

const documentation = new DocPage();
document.body.appendChild(documentation.html());
document.body.appendChild(documentation.toggleShowButton);
