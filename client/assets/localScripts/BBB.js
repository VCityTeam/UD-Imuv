/** @format */

let udviz = null;

module.exports = class BBB {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    //ui
    this.createBBBRoomButton = null;
    this.closeCurrentIframe = null;
    this.roomList = null;
    this.bbbIframe = null;
  }

  init() {
    const localCtx = arguments[1];

    const webSocketService = localCtx.getWebSocketService();
    const _this = this;

    if (webSocketService && !localCtx.getGameView().getUserData('isGuest')) {
      //init ui
      this.createBBBRoomButton = document.createElement('div');
      this.createBBBRoomButton.classList.add('button_Editor'); //TODO put another css classes
      this.createBBBRoomButton.innerHTML = 'Create BBB Room';
      localCtx.getGameView().appendToUI(this.createBBBRoomButton);

      this.closeCurrentIframe = document.createElement('div');
      this.closeCurrentIframe.classList.add('button_Editor'); //TODO put another css classes
      this.closeCurrentIframe.innerHTML = 'Close BBB ROOM';
      localCtx.getGameView().appendToUI(this.closeCurrentIframe);

      this.roomList = document.createElement('ul');
      localCtx.getGameView().appendToUI(this.roomList);

      //Callbacks
      this.createBBBRoomButton.onclick = function () {
        const nameRoom = window.prompt('Name of the room');

        webSocketService.emit(
          udviz.Game.Shared.Components.Constants.WEBSOCKET.MSG_TYPES
            .CREATE_BBB_ROOM,
          nameRoom
        );
      };

      this.closeCurrentIframe.onclick = function () {
        if (_this.bbbIframe) _this.bbbIframe.remove();
      };

      webSocketService.on(
        udviz.Game.Shared.Components.Constants.WEBSOCKET.MSG_TYPES.ON_BBB_URLS,
        function (data) {
          //update ui
          //   console.log('receive urls ', data);

          //clear list
          const list = _this.roomList;
          while (list.firstChild) {
            list.removeChild(list.firstChild);
          }

          if (data) {
            data.forEach(function (dataRoom) {
              const roomButton = document.createElement('div');
              roomButton.innerHTML = dataRoom.name;
              roomButton.classList.add('button_Editor'); //TODO refacto css
              list.appendChild(roomButton);

              //callback
              roomButton.onclick = function () {
                const iframe = document.createElement('iframe');
                iframe.src = dataRoom.url;
                iframe.style.width = '500px';
                iframe.style.height = '500px';
                const subdomain = '*';
                iframe.allow =
                  'microphone ' + subdomain + '; camera  ' + subdomain + ';';

                localCtx.getGameView().appendToUI(iframe);

                if (_this.bbbIframe) _this.bbbIframe.remove();
                _this.bbbIframe = iframe;
              };
            });
          }
        }
      );

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          console.log('Video + audio allowed');
        })
        .catch((e) => {
          console.log('e: ', e);
        });
    }
  }

  tick() {}

  update() {}
};
