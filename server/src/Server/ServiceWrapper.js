const Shared = require('ud-viz/src/Game/Shared/Shared');

const firebase = require('firebase/app');
require('firebase/auth');

const fs = require('fs');

const ServiceWrapperModule = class ServiceWrapper {
  constructor() {
    //TODO like BBB these informations should not be public
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: 'AIzaSyCKMd8dIyrDWjUxuLAps9Gix782nK9Bu_o',
      authDomain: 'imuv-da2d9.firebaseapp.com',
      projectId: 'imuv-da2d9',
      storageBucket: 'imuv-da2d9.appspot.com',
      messagingSenderId: '263590659720',
      appId: '1:263590659720:web:ae6f9ba09907c746ab813d',
      measurementId: 'G-RRJ79PGETS',
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log(this.constructor.name, 'created');
  }

  createAccount(data, assetsManager) {
    const _this = this;
    return new Promise((resolve, reject) => {
      const nameUser = data.nameUser;
      const password = data.password;
      const email = data.email;
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log(nameUser, ' is sign up');
          const user = userCredential.user;
          user
            .sendEmailVerification()
            .then(function () {
              // Email sent.
              console.log('verification email sent');
            })
            .catch(function (error) {
              // An error happened.
              console.error(error);
              reject(error);
            });

          //TODO these informations should not be stock locally but inside a firebase db
          _this.addUserInLocalJSON(user.uid, assetsManager).then(resolve);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  fetchUserDefaultExtraData(nameUser = 'default_name', assetsManager) {
    let avatarJSON = assetsManager.fetchPrefabJSON('avatar');
    avatarJSON.components.LocalScript.conf.name = nameUser;
    avatarJSON = new Shared.GameObject(avatarJSON).toJSON(true); //fill missing fields

    return {
      nameUser: nameUser,
      initialized: false,
      avatarJSON: avatarJSON,
    };
  }

  addUserInLocalJSON(uuid, assetsManager) {
    const usersJSONPath = './assets/data/users.json';

    const _this = this;

    return new Promise((resolve, reject) => {
      fs.readFile(usersJSONPath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          reject();
        }
        const usersJSON = JSON.parse(data);
        usersJSON[uuid] = _this.fetchUserDefaultExtraData(
          nameUser,
          assetsManager
        );
        fs.writeFile(
          usersJSONPath,
          JSON.stringify(usersJSON),
          {
            encoding: 'utf8',
            flag: 'w',
            mode: 0o666,
          },
          resolve
        );
      });
    });
  }
};

module.exports = ServiceWrapperModule;
