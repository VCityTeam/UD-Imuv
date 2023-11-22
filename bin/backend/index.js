const express = require('express');
const { stringReplace } = require('string-replace-middleware');
const {
  connect,
  computeUserMiddleware,
  createUser,
  isAdminMiddleware,
} = require('./parse');
const jwt = require('jsonwebtoken');
const reload = require('reload');
const { json } = require('body-parser');
const {
  createGameWebsocketService,
  readGameObjects3DAsJSON,
} = require('./gameWebSocketService');
const {
  dataUriToBuffer,
  arrayPushOnce,
  computeFilenameFromPath,
} = require('@ud-viz/utils_shared');
const { MathUtils } = require('three');
const path = require('path');
const fs = require('fs');
const { THREAD, PARSE } = require('./constant');
const { exec } = require('child-process-promise');
const PARSE_VALUE = require('../../src/shared/constant').PARSE.VALUE;

const FOLDER_PATH_PUBLIC = path.resolve(__dirname, '../../public');
const PATH_GAME_OBJECT_3D = '/assets/gameObject3D/';
const PATH_GAME_OBJECT_3D_IMAGES = '/assets/img/gameObject3D/';
const PATH_AVATAR_IMAGES = '/assets/img/avatar/';
const absolutePath = (path) => FOLDER_PATH_PUBLIC + path;
const browserPath = (path) => '.' + path;

// launch an express app
const app = express();

const Parse = connect();

const port = process.env.PORT;

const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('backend running in mode ', NODE_ENV);

const options = {
  contentTypeFilterRegexp: /text\/html/,
};

// TODO: the limit should be in config
app.use(json({ limit: '100mb' }));

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

const deleteUnusedAvatarImages = async () => {
  const Parse = connect();

  const query = new Parse.Query(Parse.User);
  try {
    let results = await query.distinct(PARSE.KEY.AVATAR_TEXTURE_FACE_PATH);
    arrayPushOnce(results, absolutePath(PATH_AVATAR_IMAGES + 'default.jpeg')); // do not remove the default image
    results = results.map((el) => computeFilenameFromPath(el));

    console.log(results);

    const folderPath = absolutePath(PATH_AVATAR_IMAGES);
    fs.readdir(folderPath, (err, files) => {
      files.forEach((filename) => {
        if (!results.includes(filename)) {
          fs.unlink(folderPath + filename, (err) => {
            if (err) {
              throw err;
            }
            console.log(folderPath + filename + ' deleted.');
          });
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
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
        if (!sW.userData.avatar) console.error(sW.userData);
        if (!sW.userData.avatar.uuid) console.error(sW.userData);
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
          res.send(newAvatarJSON); // indicate to client that avatar has been successfully edited
          deleteUnusedAvatarImages(); // clean images not used anymore
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

app.use('/save_settings', computeUserMiddleware, (req, res) => {
  if (req.user) {
    const query = new Parse.Query(Parse.User);
    query.get(req.user.id).then((parseUser) => {
      parseUser.set(PARSE.KEY.SETTINGS, JSON.stringify(req.body));
      parseUser.save(null, { useMasterKey: true });
    });
  } else {
    res.sendStatus(401);
  }
});

app.use('/sign_in', async (req, res) => {
  try {
    const user = await Parse.User.logIn(req.body.name, req.body.password);

    const tokenContent = {
      name: await user.get(PARSE.KEY.NAME),
      id: await user.id,
      role: await user.get(PARSE.KEY.ROLE),
    };

    console.log(tokenContent);

    res.send(jwt.sign(tokenContent, process.env.JSON_WEB_TOKEN_SECRET));
  } catch (error) {
    res.status(401).send(error);
  }
});

app.use('/sign_up', async (req, res) => {
  try {
    const user = await createUser(
      req.body.name,
      req.body.password,
      PARSE_VALUE.ROLE_DEFAULT
    );

    res.send(
      jwt.sign(
        {
          name: await user.get(PARSE.KEY.NAME),
          id: await user.id,
          role: await user.get(PARSE.KEY.ROLE),
        },
        process.env.JSON_WEB_TOKEN_SECRET
      )
    );
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
});

app.use('/verify_token', computeUserMiddleware, (req, res) => {
  res.send(req.user);
});

app.use('/verify_admin_token', isAdminMiddleware, (req, res) => {
  res.send(req.user);
});

app.use('/pull_gameobjects3D', isAdminMiddleware, (req, res) => {
  res.send(readGameObjects3DAsJSON(absolutePath(PATH_GAME_OBJECT_3D)));
});

// TODO: need to save images and to reload socketservice
app.use('/save_gameObject3D', isAdminMiddleware, (req, res) => {
  const object3DJSON = req.body;
  const contentIndexJSON = JSON.parse(
    fs.readFileSync(absolutePath(PATH_GAME_OBJECT_3D) + 'index.json')
  );
  const pathFile =
    absolutePath(PATH_GAME_OBJECT_3D) +
    contentIndexJSON[object3DJSON.object.uuid];
  fs.writeFileSync(pathFile, JSON.stringify(object3DJSON));
  exec('npx prettier ' + pathFile + ' -w').then(() => res.send());
});

reload(app, { port: 8082 }); // TODO: pass reload port as the http server port
