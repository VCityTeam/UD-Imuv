/**
 * Wrapper worker_threads
 *
 * @format
 */

const workerThreads = require('worker_threads');
const gm = require('gm');
const PNG = require('pngjs').PNG;

const udvShared = require('ud-viz/src/Game/Shared/Shared');
const Data = udvShared.Data;
const Command = udvShared.Command;
const GameObject = udvShared.GameObject;
const World = udvShared.World;

const fs = require('fs');

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

//server manager load script
class ScriptManager {
  constructor() {
    this.scripts = {};
  }

  loadFromConfig(config) {
    const scripts = this.scripts;
    return new Promise((resolve, reject) => {
      let count = 0;
      for (let idScript in config) {
        fs.readFile(config[idScript].path, 'utf8', (err, data) => {
          if (err) {
            reject();
          }
          scripts[idScript] = eval(data);

          count++;

          if (count == Object.keys(config).length) {
            console.log('Scripts loaded ', scripts);
            resolve();
          }
        });
      }
    });
  }

  fetchScript(idScript) {
    if (!this.scripts[idScript]) console.error('no script with id ', idScript);
    return this.scripts[idScript];
  }
}

WorldThreadModule.routine = function (serverConfig) {
  if (workerThreads.isMainThread) {
    throw new Error('Its not a worker');
  }

  const parentPort = workerThreads.parentPort;

  //load scripts
  const manager = new ScriptManager();
  manager.loadFromConfig(serverConfig.scripts).then(function () {
    //Variables
    let lastTimeTick = 0;
    let world; //the world being simulated
    const commands = [];

    //Callbacks
    const onInit = function (worldJSON) {
      world = new World(worldJSON, {
        isServerSide: true,
        modules: { gm: gm, PNG: PNG },
      });

      world.getGameObject().initAssets(manager, udvShared, true);

      world.load(function () {
        console.log(world.name, ' loaded');

        //loop
        const tick = function () {
          let dt;
          const now = Date.now();
          if (!lastTimeTick) {
            dt = 0;
          } else {
            dt = now - lastTimeTick;
          }
          lastTimeTick = now;

          world.tick(commands, dt); //tick with user commands
          commands.length = 0; //clear commands

          const currentState = world.computeWorldState();

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
      });
    };

    const onCommands = function (cmdsJSON) {
      cmdsJSON.forEach(function (cmdJSON) {
        commands.push(new Command(cmdJSON));
      });
    };

    const onAddGameObject = function (goJson) {
      const newGO = new GameObject(goJson);
      newGO.initAssets(manager, udvShared, true);
      world.addGameObject(newGO);
    };

    const onRemoveGameObject = function (uuid) {
      world.removeGameObject(uuid);
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
