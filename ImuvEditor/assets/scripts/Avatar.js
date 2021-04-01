/** @format */

//scripts are commonJs module witout dependency all game context is pass as udvGameShared
//this is due to the fact that the code is import as a string then eval() in code by the (Script/Asssets)Manager
module.exports = class Avatar {
  constructor(conf) {
    this.conf = conf;
    this.commands = {};
  }

  init() {
    const gCtx = arguments[1];

    //init commands
    const Command = gCtx.UDVShared.Command;
    for (let type in Command.TYPE) {
      this.commands[Command.TYPE[type]] = [];
    }
  }

  fetchCommands(commands, gameObject, gCtx) {
    const Command = gCtx.UDVShared.Command;

    //get commands sign by its user
    let addMoveTo = false;
    for (let i = commands.length - 1; i >= 0; i--) {
      const cmd = commands[i];
      if (cmd.getAvatarID() == gameObject.getUUID()) {
        const type = cmd.getType();
        this.commands[type].push(cmd);
        //can do this because on decremente
        commands.splice(i, 1);

        if (type == Command.TYPE.MOVE_TO) addMoveTo = true;
      }
    }

    //filter
    const moveToCmds = this.commands[Command.TYPE.MOVE_TO];
    const forwardCmds = this.commands[Command.TYPE.MOVE_FORWARD];
    const backwardCmds = this.commands[Command.TYPE.MOVE_BACKWARD];

    if (addMoveTo) {
      //remove all commands which are not compatible
      forwardCmds.length = 0;
      backwardCmds.length = 0;
      //keep the most current
      moveToCmds.splice(0, moveToCmds.length - 1);
    }

    if (forwardCmds.length || backwardCmds.length) {
      moveToCmds.length = 0;
    }
  }

  applyCommands(gameObject, dt, gCtx) {
    //TODO create function in gameobject to get a nice API
    gameObject.outdated = false;

    //TODO mettre valeur fichier de conf
    const AVATAR_SPEED_MOVE = 0.01;
    const AVATAR_SPEED_RUN = 0.02;
    const AVATAR_SPEED_ROTATION_Z = 0.00005;
    const AVATAR_SPEED_ROTATION_X = 0.00005;

    const Command = gCtx.UDVShared.Command;
    const THREE = gCtx.UDVShared.THREE;

    for (let type in this.commands) {
      const cmds = this.commands[type];
      if (cmds.length) {
        const cmd = cmds[0];
        let cmdFinished = true;
        switch (cmd.getType()) {
          case Command.TYPE.MOVE_TO:
            const target = cmd.getData().target;
            const pos = gameObject.transform.position;
            const dir = new THREE.Vector3(target.x, target.y).sub(
              new THREE.Vector3(pos.x, pos.y)
            );
            const amount = AVATAR_SPEED_MOVE * dt;
            if (dir.length() >= amount) {
              cmdFinished = false;
              gameObject.move(dir.setLength(amount));
            } else {
              //just finished what needed
              gameObject.move(dir);
              cmdFinished = true;
            }
            break;
          case Command.TYPE.RUN:
            gameObject.move(
              gameObject.computeForwardVector().setLength(dt * AVATAR_SPEED_RUN)
            );
            break;
          case Command.TYPE.MOVE_FORWARD:
            gameObject.move(
              gameObject
                .computeForwardVector()
                .setLength(dt * AVATAR_SPEED_MOVE)
            );
            break;
          case Command.TYPE.MOVE_LEFT:
            gameObject.move(
              gameObject
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE)
            );
            break;
          case Command.TYPE.MOVE_RIGHT:
            gameObject.move(
              gameObject
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE)
            );
            break;
          case Command.TYPE.MOVE_BACKWARD:
            gameObject.move(
              gameObject
                .computeBackwardVector()
                .setLength(dt * AVATAR_SPEED_MOVE)
            );
            break;
          case Command.TYPE.ROTATE:
            const vectorJSON = cmd.getData().vector;
            const vector = new THREE.Vector3(
              vectorJSON.x * AVATAR_SPEED_ROTATION_X,
              vectorJSON.y,
              vectorJSON.z * AVATAR_SPEED_ROTATION_Z
            );
            gameObject.rotate(vector.multiplyScalar(dt));
            //clamp
            const rotation = gameObject.getTransform().rotation;
            rotation.y = 0;
            //borne between 0 => 2pi
            const angle1 = Math.PI / 10; //TODO valeur en config
            const angle2 = Math.PI * 2 - Math.PI / 20;
            if (rotation.x > Math.PI) {
              rotation.x = Math.max(rotation.x, angle2);
            } else {
              rotation.x = Math.min(angle1, rotation.x);
            }
            break;
          default:
        }
        if (cmdFinished) cmds.shift(); //remove it
      }
    }
  }

  tick() {
    const gameObject = arguments[0];
    const gCtx = arguments[1];

    this.fetchCommands(gCtx.commands, gameObject, gCtx);
    this.applyCommands(gameObject, gCtx.dt, gCtx);
  }

  onCollision() {
    const go = arguments[0];
    const result = arguments[1];
    go.transform.position.x -= result.overlap * result.overlap_x;
    go.transform.position.y -= result.overlap * result.overlap_y;
  }
};
