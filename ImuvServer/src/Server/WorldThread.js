/**
 * Wrapper worker_threads
 *
 * @format
 */

const workerThreads = require('worker_threads');
const gm = require('gm');
const PNG = require('pngjs').PNG;

const udvShared = require('ud-viz/src/Game/Shared/Shared');
const Data = udvShared.Components.Data;
const Command = udvShared.Command;
const GameObject = udvShared.GameObject;
const World = udvShared.World;

const AssetsManagerServer = require('./AssetsManagerServer');

const WorldThreadModule = class WorldThread {
  constructor(path) {
    //thread js
    this.worker = new workerThreads.Worker(path);

    //callbacks
    this.callbacks = {};

    //listen
    this.worker.on(
      'message',
      function (msgPacked) {
        const msg = Data.unpack(msgPacked);
        if (this.callbacks[msg.msgType]) {
          this.callbacks[msg.msgType](msg.data);
        }
      }.bind(this)
    );
  }

  post(msgType, data) {
    this.worker.postMessage(
      Data.pack({
        msgType: msgType,
        data: data,
      })
    );
  }

  on(msgType, callback) {
    this.callbacks[msgType] = callback;
  }
};

//dont know how to create static var other way
WorldThreadModule.MSG_TYPES = {
  INIT: 'init',
  COMMANDS: 'cmds',
  WORLDSTATE: 'state',
  ADD_GAMEOBJECT: 'add_gameobject',
  REMOVE_GAMEOBJECT: 'remove_gameobject',
};

WorldThreadModule.routine = function (serverConfig) {
  if (workerThreads.isMainThread) {
    throw new Error('Its not a worker');
  }

  const parentPort = workerThreads.parentPort;

  const gCtx = {
    assetsManager: new AssetsManagerServer(),
    dt: 0,
    commands: [],
    world: null,
    UDVShared: udvShared,
  };

  //load scripts
  gCtx.assetsManager
    .loadFromConfig(serverConfig.assetsManager)
    .then(function () {
      //Variables
      let lastTimeTick = 0;

      //Callbacks
      const onInit = function (worldJSON) {
        gCtx.world = new World(worldJSON, {
          isServerSide: true,
          modules: { gm: gm, PNG: PNG },
        });

        gCtx.world.load(function () {
          console.log(gCtx.world.name, ' loaded');

          gCtx.world.on('portalEvent', function () {
            console.log('portal event');
          });

          //loop
          const tick = function () {
            const now = Date.now();
            if (!lastTimeTick) {
              gCtx.dt = 0;
            } else {
              gCtx.dt = now - lastTimeTick;
            }
            lastTimeTick = now;

            gCtx.world.tick(gCtx); //tick with user commands
            gCtx.commands.length = 0; //clear commands

            const currentState = gCtx.world.computeWorldState();

            //post worldstate to main thread
            const message = {
              msgType: WorldThreadModule.MSG_TYPES.WORLDSTATE,
              data: currentState.toJSON(),
            };
            parentPort.postMessage(Data.pack(message));
          };
          const fps = serverConfig.thread.fps;
          if (!fps) throw new Error('no fps');
          setInterval(tick, 1000 / fps);
        }, gCtx);
      };

      const onCommands = function (cmdsJSON) {
        cmdsJSON.forEach(function (cmdJSON) {
          gCtx.commands.push(new Command(cmdJSON));
        });
      };

      const onAddGameObject = function (goJson) {
        const newGO = new GameObject(goJson);
        gCtx.world.addGameObject(newGO, gCtx, gCtx.world.getGameObject(), null);
      };

      const onRemoveGameObject = function (uuid) {
        gCtx.world.removeGameObject(uuid);
      };

      //listening parentPort
      parentPort.on('message', (msgPacked) => {
        const msg = Data.unpack(msgPacked);
        switch (msg.msgType) {
          case WorldThreadModule.MSG_TYPES.INIT:
            onInit(msg.data);
            break;
          case WorldThreadModule.MSG_TYPES.COMMANDS:
            onCommands(msg.data);
            break;
          case WorldThreadModule.MSG_TYPES.ADD_GAMEOBJECT:
            onAddGameObject(msg.data);
            break;
          case WorldThreadModule.MSG_TYPES.REMOVE_GAMEOBJECT:
            onRemoveGameObject(msg.data);
            break;
          default:
            console.log('default msg ', msg.data);
        }
      });
    });
};

module.exports = WorldThreadModule;
