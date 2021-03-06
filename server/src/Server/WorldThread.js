/**
 * Wrapper worker_threads
 *
 * @format
 */

const ImuvConstants = require('../../../imuv.constants');

const workerThreads = require('worker_threads');
const gm = require('gm');
const PNG = require('pngjs').PNG;
const Game = require('ud-viz/src/Game/Game');
const Pack = Game.Components.Pack;
const Command = Game.Command;
const GameObject = Game.GameObject;
const World = Game.World;
const process = require('process');

const AssetsManagerServer = require('./AssetsManagerServer');

const WorldThreadModule = class WorldThread {
  constructor(path) {
    //thread js
    this.worker = new workerThreads.Worker(path);

    //callbacks
    this.callbacks = {};

    //users register inside this thread
    this.users = {};

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

  getUsers() {
    return this.users;
  }

  stop() {
    this.post(WorldThreadModule.MSG_TYPES.STOP, {});

    //disconnect users
    for (let key in this.users) {
      this.users[key].getSocket().disconnect();
    }
  }

  addUser(user) {
    user.setThread(this);
    this.users[user.getUUID()] = user;
  }

  removeUser(user) {
    user.setThread(null);
    delete this.users[user.getUUID()];
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
  EDIT_CONF_COMPONENT: 'edit_conf_component',
  EDIT_AVATAR_RENDER: 'edit_avatar_render',
};

WorldThreadModule.routine = function (serverConfig) {
  if (workerThreads.isMainThread) {
    throw new Error('Its not a worker');
  }

  const parentPort = workerThreads.parentPort;
  const assetsManager = new AssetsManagerServer();

  //load scripts
  assetsManager.loadFromConfig(serverConfig.assetsManager).then(function () {
    const worldStateComputer = new Game.WorldStateComputer(
      assetsManager,
      serverConfig.worldDispatcher.worldThread.fps,
      { Game: Game }
    );

    //listening parentPort
    parentPort.on('message', (msgPacked) => {
      const msg = Pack.unpack(msgPacked);
      switch (msg.msgType) {
        case WorldThreadModule.MSG_TYPES.INIT: {
          //create a server world
          const world = new World(msg.data, {
            isServerSide: true,
            modules: { gm: gm, PNG: PNG, ImuvConstants: ImuvConstants },
          });

          worldStateComputer.start(world);

          worldStateComputer.addAfterTickRequester(function () {
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
            .on(ImuvConstants.WORLD.EVENT.PORTAL, function (args) {
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
        }
        case WorldThreadModule.MSG_TYPES.COMMANDS: {
          //create js object from json
          const cmds = [];
          msg.data.forEach(function (c) {
            cmds.push(new Command(c));
          });

          //pass to the computer
          worldStateComputer.onCommands(cmds);
          break;
        }
        case WorldThreadModule.MSG_TYPES.EDIT_AVATAR_RENDER: {
          // console.log(msg.data)

          const avatarGO = worldStateComputer
            .getWorldContext()
            .getWorld()
            .getGameObject()
            .find(msg.data.avatarUUID);

          if (!avatarGO) throw new Error('no avatar');

          const editAvatarGO = function (go) {
            const renderComp = go.getComponent(Game.Render.TYPE);
            //color
            renderComp.setColor(
              new Game.THREE.Color().fromArray(msg.data.color)
            );
            //model id
            renderComp.setIdRenderData(msg.data.idRenderData);

            const localComp = go.getComponent(Game.LocalScript.TYPE);
            //texture face
            localComp.conf.path_face_texture = msg.data.path_face_texture;

            go.setOutdated(true);
          };

          editAvatarGO(avatarGO);

          //check if city avatar
          const cityAvatar = avatarGO
            .fetchWorldScripts()
            ['avatar'].getCityAvatar();
          if (cityAvatar) {
            editAvatarGO(cityAvatar);
          }

          break;
        }
        case WorldThreadModule.MSG_TYPES.ADD_GAMEOBJECT: {
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
              if (portal) {
                portal.fetchWorldScripts()['portal'].setTransformOf(newGO);
                //fade out could be handle there
                worldStateComputer
                  .getWorldContext()
                  .getWorld()
                  .updateCollisionBuffer();
              }
            } else if (transformJSON) {
              newGO.setFromTransformJSON(transformJSON);
              worldStateComputer
                .getWorldContext()
                .getWorld()
                .updateCollisionBuffer();
            }
          });

          break;
        }
        case WorldThreadModule.MSG_TYPES.REMOVE_GAMEOBJECT: {
          worldStateComputer.onRemoveGameObject(msg.data);
          break;
        }
        case WorldThreadModule.MSG_TYPES.QUERY_GAMEOBJECT: {
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
        }
        case WorldThreadModule.MSG_TYPES.EDIT_CONF_COMPONENT: {
          const goUUID = msg.data.goUUID;
          const componentUUID = msg.data.componentUUID;
          const key = msg.data.key;
          const value = msg.data.value;

          if (!goUUID || !componentUUID || !key) {
            console.warn('data are imcomplete', msg.data);
            break;
          }

          const go = worldStateComputer
            .getWorldContext()
            .getWorld()
            .getGameObject()
            .find(goUUID);

          if (!go) {
            console.warn('no go with UUID', goUUID);
            break;
          }

          const component = go.getComponentByUUID(componentUUID);
          component.getConf()[key] = value;

          go.setOutdated(true); //force to send new go state

          break;
        }
        case WorldThreadModule.MSG_TYPES.STOP: {
          console.warn(
            worldStateComputer.getWorldContext().getWorld().getName(),
            ' stop'
          );
          process.exit(0);
          break; //mandatory to respect the rules of the linter
        }

        default:
          console.warn('default msg ', msg.data);
      }
    });
  });
};

module.exports = WorldThreadModule;
