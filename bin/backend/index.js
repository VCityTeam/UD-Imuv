const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const { useParseEndPoint, connect, computeUserMiddleware } = require('./parse');
const reload = require('reload');
const { json } = require('body-parser');
const {
  createGameWebsocketService,
  readGameObjects3DAsJSON,
} = require('./gameWebSocketService');
const { dataUriToBuffer } = require('@ud-viz/utils_shared');
const { MathUtils } = require('three');
const path = require('path');
const fs = require('fs');
const { THREAD, PARSE } = require('./constant');
const { constant } = require('@ud-viz/game_shared');

const FOLDER_PATH_PUBLIC = path.resolve(__dirname, '../../public');
const PATH_GAME_OBJECT_3D = '/assets/gameObject3D';
const PATH_GAME_OBJECT_3D_IMAGES = '/assets/img/gameObject3D';
const PATH_AVATAR_IMAGES = '/assets/img/gameObject3D';
const absolutePath = (path) => FOLDER_PATH_PUBLIC + path;
const browserPath = (path) => './' + path;

// launch an express app
const app = express();

if (process.argv[2] && isNaN(process.argv[2])) {
  throw new Error('INVALID PORT');
}
const port = process.argv[2];

const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('backend running in mode ', NODE_ENV);

const options = {
  contentTypeFilterRegexp: /text\/html/,
};

// TODO: the limit should be in config
app.use(json({ limit: '100mb' }));

// TODO: see how to modify html title + bundle import procedurally
app.use(
  stringReplace(
    {
      RUN_MODE: NODE_ENV,
    },
    options
  )
);

// public folder is expose
app.use(express.static(FOLDER_PATH_PUBLIC));

// create an http server
const httpServer = app.listen(port, (err) => {
  if (err) {
    console.error('Server does not start');
    return;
  }
  console.log('Http server listening on port', port);
});

const gameSocketService = createGameWebsocketService(
  httpServer,
  absolutePath(PATH_GAME_OBJECT_3D)
);

const bufferToImagePath = (buffer, path) => {
  const filename = MathUtils.generateUUID() + '.jpeg';
  fs.writeFileSync(absolutePath(path + filename), buffer);
  return browserPath(path + filename);
};

const cleanUnusedImages = () => {
  const folderPath = path.resolve(
    __dirname,
    '../../public/assets/img/uploaded'
  ); // absolute path on this computer

  const gameObjects3DString = JSON.stringify(
    readGameObjects3DAsJSON(
      path.resolve(__dirname, '../../public/assets/gameObject3D')
    )
  );

  fs.readdir(folderPath, (err, files) => {
    files.forEach((file) => {
      // check if ref by something in worlds
      if (!gameObjects3DString.includes(file)) {
        // delete it
        // delete a file
        fs.unlink(folderPath + file, (err) => {
          if (err) {
            throw err;
          }

          console.log(folderPath + file + ' deleted.');
        });
      }
    });
  });
};

app.use('/save_avatar', computeUserMiddleware, (req, res) => {
  if (req.user) {
    // this is an user
    const newAvatarJSON = req.body;

    // replace dataURI by path and create an image on backend
    const bufferTextureFace = dataUriToBuffer(
      newAvatarJSON.components.ExternalScript.variables.path_face_texture
    );

    if (bufferTextureFace) {
      // new images
      newAvatarJSON.components.ExternalScript.variables.path_face_texture =
        bufferToImagePath(bufferTextureFace, PATH_AVATAR_IMAGES);
    }

    // apply avatar changes to the avatar in game
    let userSocketWrapper = null;
    let thread = null;
    for (const uuid in gameSocketService.threads) {
      const userSocketWrappers = gameSocketService.threads[
        uuid
      ].socketWrappers.filter((sW) => {
        if (!sW.userData.avatar) console.error(sW);
        return sW.userData.avatar.uuid == newAvatarJSON.uuid;
      });
      if (userSocketWrappers.length) {
        thread = gameSocketService.threads[uuid];
        userSocketWrapper = userSocketWrappers[0];
        break;
      }
    }

    if (!userSocketWrapper) {
      console.info('no userSocketWrapper found with', newAvatarJSON.uuid);
      for (const uuid in gameSocketService.threads) {
        gameSocketService.threads[uuid].socketWrappers.forEach((sw) =>
          console.log(sw.userData.avatar.uuid)
        );
      }
      res.sendStatus(500);
      return;
    }

    // write in user database
    const Parse = connect();
    // retrieve user in db
    const query = new Parse.Query(Parse.User);
    query
      .get(req.user.id)
      .then(async (parseUser) => {
        if (!parseUser) throw new Error('no parse user for this token'); // not a user registered
        parseUser.set(
          PARSE.KEY.AVATAR_COLOR,
          JSON.stringify(newAvatarJSON.components.Render.color)
        );
        parseUser.set(
          PARSE.KEY.AVATAR_ID_RENDER_DATA,
          newAvatarJSON.components.Render.idRenderData
        );
        console.log(
          newAvatarJSON.components.ExternalScript.variables.path_face_texture
        );
        parseUser.set(
          PARSE.KEY.AVATAR_TEXTURE_FACE_PATH,
          newAvatarJSON.components.ExternalScript.variables.path_face_texture
        );
        await parseUser.save(null, { useMasterKey: true });

        // replace avatar json in socket wrapper
        userSocketWrapper.userData.avatar = newAvatarJSON;

        thread.apply(THREAD.EVENT.EDIT_AVATAR, newAvatarJSON).then(() => {
          res.send(); // indicate to client that avatar has been successfully edited
          // update userdata of the client context
          userSocketWrapper.socket.emit(
            constant.WEBSOCKET.MSG_TYPE.USER_DATA_UPDATE,
            userSocketWrapper.userData
          );
        });
      })
      .catch((error) => {
        console.warn(error);
        res.send(500);
      });
  } else {
    res.sendStatus(401);
  }
});

useParseEndPoint(app);

reload(app, { port: 8082 }); // TODO: pass reload port as the http server port
