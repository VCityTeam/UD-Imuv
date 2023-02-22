const { Game } = require('@ud-viz/shared');

const AVATAR_SPEED_ROTATION_Z = 0.00001;
const AVATAR_SPEED_ROTATION_X = 0.00001;
const AVATAR_ANGLE_MIN = Math.PI / 5;
const AVATAR_ANGLE_MAX = 2 * Math.PI - Math.PI / 10;

module.exports = class Avatar extends Game.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    //commands buffer
    this.commands = {};

    //city avatar go
    this.cityAvatar = null;

    this.canJump = true;
  }

  init() {
    //spawn
    this.spawn();

    //init commands
    // for (const type in Game.Command.TYPE) {
    //   this.commands[Game.Command.TYPE[type]] = [];
    // }
  }

  spawn() {
    //spawn
    const gmScript = this.context.findGameScriptWithID('WorldGameManager');
    gmScript.initiazeSpawnTransform(this.object3D);
  }

  fetchCommands(commands, gameObject) {
    //get commands sign by its user
    for (let i = commands.length - 1; i >= 0; i--) {
      const cmd = commands[i];
      if (cmd.getGameObjectUUID() == gameObject.getUUID()) {
        const type = cmd.getType();
        this.commands[type].push(cmd);
        //can do this because on decremente
        commands.splice(i, 1);
      }
    }

    const cmds = this.commands;

    //no more that one
    if (cmds[Game.Command.TYPE.ESCAPE].length)
      cmds[Game.Command.TYPE.ESCAPE].splice(
        1,
        cmds[Game.Command.TYPE.ESCAPE].length - 1
      );

    const filterCommands = function (idStart, idEnd) {
      const moveStart = cmds[idStart];
      const moveEnd = cmds[idEnd];
      if (moveEnd.length) {
        moveStart.length = 0;
        moveEnd.length = 0;
      } else if (moveStart.length >= 1)
        moveStart.splice(1, moveStart.length - 1);
    };

    filterCommands(
      Game.Command.TYPE.MOVE_FORWARD_START,
      Game.Command.TYPE.MOVE_FORWARD_END
    );
    filterCommands(
      Game.Command.TYPE.MOVE_BACKWARD_START,
      Game.Command.TYPE.MOVE_BACKWARD_END
    );
    filterCommands(
      Game.Command.TYPE.MOVE_LEFT_START,
      Game.Command.TYPE.MOVE_LEFT_END
    );
    filterCommands(
      Game.Command.TYPE.MOVE_RIGHT_START,
      Game.Command.TYPE.MOVE_RIGHT_END
    );
  }

  /**
   * It applies the commands to the avatar
   * @param {udviz.Game.GameObject} gameObject - The game object that the script is attached to.
   * @param {udviz.Game.WorldContext} worldContext - the context of the world, which contains the asstetsManager, the world, the dt...
   */
  applyCommands(gameObject, worldContext) {
    const dt = worldContext.getDt();
    const Command = Game.Command;
    const THREE = Game.THREE;

    const gmGo = gameObject.computeRoot();
    const scriptGM = gmGo.fetchWorldScripts()['worldGameManager'];
    if (!scriptGM) throw new Error('no gm script');
    const mapGo = scriptGM.getMap();
    if (!mapGo) return; //no map => no commands
    const scriptMap = mapGo.fetchWorldScripts()['map'];
    if (!scriptMap) throw new Error('no map world script');

    const avatarSpeedMove = scriptMap.getAvatarSpeedMove();

    let elevationComputed = false;

    for (const type in this.commands) {
      const cmds = this.commands[type];

      if (cmds.length) {
        const cmd = cmds[0];

        const oldPosition = gameObject.getPosition().clone();

        switch (cmd.getType()) {
          case Command.TYPE.MOVE_FORWARD_START:
            gameObject.move(
              gameObject.computeForwardVector().setLength(dt * avatarSpeedMove)
            );
            gameObject.setOutdated(true);
            break;
          case Command.TYPE.MOVE_LEFT_START:
            gameObject.move(
              gameObject
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5)
                .setLength(dt * avatarSpeedMove * 0.5)
            );
            gameObject.setOutdated(true);
            break;
          case Command.TYPE.MOVE_RIGHT_START:
            gameObject.move(
              gameObject
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5)
                .setLength(dt * avatarSpeedMove * 0.5)
            );
            gameObject.setOutdated(true);
            break;
          case Command.TYPE.MOVE_BACKWARD_START:
            gameObject.move(
              gameObject
                .computeBackwardVector()
                .setLength(dt * avatarSpeedMove * 0.3)
            );
            gameObject.setOutdated(true);
            break;
          case Command.TYPE.ROTATE:
            gameObject.rotate(
              new THREE.Vector3(
                cmd.getData().vector.x * AVATAR_SPEED_ROTATION_X,
                cmd.getData().vector.y,
                cmd.getData().vector.z * AVATAR_SPEED_ROTATION_Z
              ).multiplyScalar(dt)
            );
            this.clampRotation(gameObject);
            gameObject.setOutdated(true);
            cmds.shift(); //remove one by one
            break;
          case Command.TYPE.ESCAPE:
            this.removeCityAvatar(worldContext);
            cmds.shift();
            return; //no more command apply for this frame
          default:
        }

        //update elevation
        const isOut = !scriptMap.updateElevation(gameObject);
        elevationComputed = true;

        if (isOut) {
          if (scriptMap.cityAvatarAllow() && this.canJump) {
            this.createCityAvatar(worldContext);
          } else {
            gameObject.setPosition(oldPosition);
            gameObject.setOutdated(true);
          }
        }
      }
    }

    if (!elevationComputed) scriptMap.updateElevation(gameObject);
  }

  createCityAvatar(worldContext) {
    if (this.cityAvatar) return;

    //reset rotation
    this.go.setRotation(new Game.THREE.Vector3(0, 0, 0));

    //freeze
    this.go.setFreeze(true); //freeze

    //invisible
    this.go.getComponent(Game.LocalScript.TYPE).conf.visible = false;

    //notify change
    this.go.setOutdated(true);

    //add a city avatar
    this.cityAvatar = worldContext
      .getAssetsManager()
      .createPrefab('city_avatar');

    //copy render comp
    const renderCompJSON = this.go.getComponent(Game.Render.TYPE).toJSON();
    this.cityAvatar.setComponent(
      Game.Render.TYPE,
      new Game.Render(this.cityAvatar, renderCompJSON)
    );

    //copy name
    this.cityAvatar.getComponent(Game.LocalScript.TYPE).conf.name =
      this.go.getComponent(Game.LocalScript.TYPE).conf.name;

    //index texture
    this.cityAvatar.getComponent(Game.LocalScript.TYPE).conf.path_face_texture =
      this.go.getComponent(Game.LocalScript.TYPE).conf.path_face_texture;

    worldContext
      .getWorld()
      .addGameObject(this.cityAvatar, worldContext, this.go);

    //clear cmds
    for (const id in this.commands) {
      this.commands[id].length = 0;
    }
  }

  removeCityAvatar(worldContext) {
    if (!this.cityAvatar) return; //already remove

    worldContext.getWorld().removeGameObject(this.cityAvatar.getUUID());
    this.cityAvatar = null;
    this.go.setFreeze(false);
    this.spawn();

    //invisible
    this.go.getComponent(Game.LocalScript.TYPE).conf.visible = true;

    this.go.setOutdated(true);
  }

  getCityAvatar() {
    return this.cityAvatar;
  }

  clampRotation(gameObject) {
    //clamp
    const rotation = gameObject.getRotation();
    rotation.y = 0;
    //borne between 0 => 2pi
    const angle1 = AVATAR_ANGLE_MIN;
    const angle2 = AVATAR_ANGLE_MAX;
    if (rotation.x > Math.PI) {
      rotation.x = Math.max(rotation.x, angle2);
    } else {
      rotation.x = Math.min(angle1, rotation.x);
    }
  }

  tick() {
    return; //WIP
    const gameObject = arguments[0];
    const worldContext = arguments[1];
    this.fetchCommands(worldContext.getCommands(), gameObject);
    this.applyCommands(gameObject, worldContext);
  }

  onEnterCollision() {
    const go = arguments[0];
    const result = arguments[1];
    // const worldContext = arguments[2];

    const colliderGO = result.b.getGameObject();
    const collider = colliderGO.getComponent('Collider');

    //check if is interaction_zone
    const interactionZone = colliderGO.fetchWorldScripts()['interaction_zone'];
    if (interactionZone) {
      interactionZone.onAvatarEnter(go);
    }

    //check if is interaction_zone
    const portal = colliderGO.fetchWorldScripts()['portal'];
    if (portal) {
      portal.notifyEnter(go, this);
    }

    //check if is teleporter
    const teleporterScript = colliderGO.fetchWorldScripts()['teleporter'];
    if (teleporterScript) {
      teleporterScript.onAvatar(go);
    }

    //check if is city_avatar_not_allow_area
    const cityAvatarNotAllowAreaScript =
      colliderGO.fetchWorldScripts()['city_avatar_not_allow_area'];
    if (cityAvatarNotAllowAreaScript) {
      this.canJump = false;
    }

    this.collide(collider, go, result);
  }

  collide(collider, go, result) {
    if (collider.isBody()) {
      const p = go.getPosition();
      p.x -= result.overlap * result.overlap_x;
      p.y -= result.overlap * result.overlap_y;
      go.setOutdated(true);
    }
  }

  isColliding() {
    return;
    const go = arguments[0];
    const result = arguments[1];
    const colliderGO = result.b.getGameObject();
    const collider = colliderGO.getComponent('Collider');

    //check if is interaction_zone
    const interactionZone = colliderGO.fetchWorldScripts()['interaction_zone'];
    if (interactionZone) {
      interactionZone.onAvatarColliding(go);
    }

    //check if is city_avatar_not_allow_area
    const cityAvatarNotAllowAreaScript =
      colliderGO.fetchWorldScripts()['city_avatar_not_allow_area'];
    if (cityAvatarNotAllowAreaScript) {
      this.canJump = false;
    }

    this.collide(collider, go, result);
  }

  onLeaveCollision() {
    // console.log('on leave');
    const go = arguments[0];
    const uuidColliderGO = arguments[1];
    const wCtxt = arguments[2];
    const colliderGO = wCtxt
      .getWorld()
      .getGameObject()
      .computeRoot()
      .find(uuidColliderGO);

    //check if is interaction_zone
    const interactionZone = colliderGO.fetchWorldScripts()['interaction_zone'];
    if (interactionZone) {
      interactionZone.onAvatarLeave(go);
    }

    //check if is city_avatar_not_allow_area
    const cityAvatarNotAllowAreaScript =
      colliderGO.fetchWorldScripts()['city_avatar_not_allow_area'];
    if (cityAvatarNotAllowAreaScript) {
      this.canJump = true;
    }
  }
};
