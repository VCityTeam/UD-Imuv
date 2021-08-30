/**
 * Wrapper worker_threads
 *
 * @format
 */

const workerThreads = require('worker_threads');
const gm = require('gm');
const PNG = require('pngjs').PNG;
const Shared = require('ud-viz/src/Game/Shared/Shared');
const Pack = Shared.Components.Pack;
const Command = Shared.Command;
const GameObject = Shared.GameObject;
const World = Shared.World;

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
        const msg = Pack.unpack(msgPacked);
        if (this.callbacks[msg.msgType]) {
          this.callbacks[msg.msgType](msg.data);
        }
      }.bind(this)
    );
  }

  stop() {
    this.post(WorldThreadModule.MSG_TYPES.STOP, {});
  }

  //parent thread => child thread
  post(msgType, data) {
    this.worker.postMessage(
      Pack.pack({
        msgType: msgType,
        data: data,
      })
    );
  }

  //register callback from child thread => parent thread
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
  AVATAR_PORTAL: 'avatar_portal',
  QUERY_GAMEOBJECT: 'query_gameobject',
  GAMEOBJECT_RESPONSE: 'gameobject_response',
  STOP: 'stop_thread',
};

WorldThreadModule.routine = function (serverConfig) {
  if (workerThreads.isMainThread) {
    throw new Error('Its not a worker');
  }

  const parentPort = workerThreads.parentPort;
  const assetsManager = new AssetsManagerServer();

  //load scripts
  assetsManager.loadFromConfig(serverConfig.assetsManager).then(function () {
    const worldStateComputer = new Shared.WorldStateComputer(
      assetsManager,
      serverConfig.thread.fps,
      { Shared: Shared }
    );

    //listening parentPort
    parentPort.on('message', (msgPacked) => {
      const msg = Pack.unpack(msgPacked);
      switch (msg.msgType) {
        case WorldThreadModule.MSG_TYPES.INIT:
          //create a server world
          const world = new World(msg.data, {
            isServerSide: true,
            modules: { gm: gm, PNG: PNG },
          });

          worldStateComputer.load(world);

          worldStateComputer.setOnAfterTick(function () {
            const currentState = worldStateComputer.computeCurrentState(false);
            //post worldstate to main thread
            const message = {
              msgType: WorldThreadModule.MSG_TYPES.WORLDSTATE,
              data: currentState.toJSON(),
            };
            parentPort.postMessage(Pack.pack(message));
          });

          //world events
          worldStateComputer
            .getWorldContext()
            .getWorld()
            .on('portalEvent', function (args) {
              const avatarGO = args[0];
              const uuidDest = args[1];
              const portalUUID = args[2];

              const dataPortalEvent = {
                avatarUUID: avatarGO.getUUID(),
                worldUUID: uuidDest,
                portalUUID: portalUUID,
              };

              const message = {
                msgType: WorldThreadModule.MSG_TYPES.AVATAR_PORTAL,
                data: dataPortalEvent,
              };
              parentPort.postMessage(Pack.pack(message));
            });
          break;
        case WorldThreadModule.MSG_TYPES.COMMANDS:
          //create js object from json
          const cmds = [];
          msg.data.forEach(function (c) {
            cmds.push(new Command(c));
          });

          //pass to the computer
          worldStateComputer.onCommands(cmds);
          break;
        case WorldThreadModule.MSG_TYPES.ADD_GAMEOBJECT:
          const goJson = msg.data.gameObject;
          const portalUUID = msg.data.portalUUID;
          const transformJSON = msg.data.transform;
          const newGO = new GameObject(goJson);

          worldStateComputer.onAddGameObject(newGO, function () {
            if (portalUUID) {
              const portal = worldStateComputer
                .getWorldContext()
                .getWorld()
                .getGameObject()
                .find(portalUUID);
              portal.fetchWorldScripts()['portal'].setTransformOf(newGO);
              worldStateComputer
                .getWorldContext()
                .getWorld()
                .updateCollisionBuffer();
            } else if (transformJSON) {
              newGO.setFromTransformJSON(transformJSON);
              worldStateComputer
                .getWorldContext()
                .getWorld()
                .updateCollisionBuffer();
            }
          });

          break;
        case WorldThreadModule.MSG_TYPES.REMOVE_GAMEOBJECT:
          worldStateComputer.onRemoveGameObject(msg.data);
          break;
        case WorldThreadModule.MSG_TYPES.QUERY_GAMEOBJECT:
          const go = worldStateComputer
            .getWorldContext()
            .getWorld()
            .getGameObject()
            .find(msg.data);
          const message = {
            msgType: WorldThreadModule.MSG_TYPES.GAMEOBJECT_RESPONSE,
            data: go.toJSON(true),
          };
          parentPort.postMessage(Pack.pack(message));
          break;
        case WorldThreadModule.MSG_TYPES.STOP:
          console.log(
            worldStateComputer.getWorldContext().getWorld().getName(),
            ' stop'
          );
          process.exit(0);
          break;
        default:
          console.log('default msg ', msg.data);
      }
    });
  });
};

module.exports = WorldThreadModule;
