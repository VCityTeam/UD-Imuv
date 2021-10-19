const firebase = require('firebase/app');
require('firebase/auth');

const bbb = require('bigbluebutton-js');

const exec = require('child-process-promise').exec;
const fs = require('fs');
const parseString = require('xml2js').parseString;

const ServiceWrapperModule = class ServiceWrapper {
  constructor(config) {
    this.config = config;

    //TODO hide these informations
    this.bbbAPI = bbb.api(config.ENV.BBB_URL, config.ENV.BBB_SECRET);

    //TODO like BBB these informations should not be public
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: config.ENV.FIREBASE_API_KEY,
      authDomain: config.ENV.FIREBASE_AUTH_DOMAIN,
      projectId: config.ENV.FIREBASE_PROJECT_ID,
      storageBucket: config.ENV.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.ENV.FIREBASE_MESSAGING_SENDER_ID,
      appId: config.ENV.FIREBASE_APP_ID,
      measurementId: config.ENV.FIREBASE_MEASUREMENT_ID,
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log(this.constructor.name, 'created');
  }

  queryBBBRooms() {
    const _this = this;
    return new Promise((resolve, reject) => {
      const meetingsURL = _this.bbbAPI.monitoring.getMeetings();
      const pathTempXML = './assets/temp/bbb_data.xml';

      try {
        exec('wget ' + meetingsURL + ' -O ' + pathTempXML).then(function () {
          if (fs.existsSync(pathTempXML)) {
            //file exists
            fs.readFile(pathTempXML, 'utf-8', function (err, data) {
              if (err) {
                throw new Error(err);
              }

              parseString(data, function (errParser, jsData) {
                const result = [];

                if (errParser) {
                  throw new Error(errParser);
                }

                if (!jsData.response) throw new Error('no response');

                if (jsData.response.returncode[0] != 'SUCCESS')
                  throw new Error('response status is not SUCCESS');

                if (
                  jsData.response.messageKey &&
                  jsData.response.messageKey[0] == 'noMeetings'
                ) {
                  console.warn('no bbb meetings alived');
                  resolve(result);
                  return;
                }

                const meetings = jsData.response.meetings;
                meetings[0].meeting.forEach(function (m) {
                  // api.administration.end(m.meetingID[0], m.moderatorPW[0]);
                  // console.log('end bbb meeting ', m.meetingID[0]);
                  result.push(new BBBRoom(m));
                });

                resolve(result);
              });
            });
          } else {
            reject('cant reach url meetings xml file');
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  endBBBRooms() {
    const api = this.bbbAPI;
    return new Promise((resolve, reject) => {
      this.queryBBBRooms()
        .then(function (rooms) {
          rooms.forEach(function (r) {
            r.end(api);
          });

          console.log('clean bbb rooms on the server');
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  createBBBRoom(uuid, name) {
    name = name || 'default_BBB_ROOM_Name';

    const mPw = 'mpw';
    const aPw = 'apw';

    const meetingCreateUrl = this.bbbAPI.administration.create(name, uuid, {
      attendeePW: aPw,
      moderatorPW: mPw,
      duration: 0, //no limit
      meetingExpireWhenLastUserLeftInMinutes: 0, //no limit
      meetingExpireIfNoUserJoinedInMinutes: 0, //no limit
    });

    return new Promise((resolve, reject) => {
      bbb
        .http(meetingCreateUrl)
        .then(() => {
          console.log(name, 'created');
          resolve({
            url: this.bbbAPI.administration.join('attendee', uuid, aPw),
            name: name,
            uuid: uuid,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  createAccount(data) {
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

          resolve(user.uid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  signIn(data) {
    const password = data.password;
    const email = data.email;

    return new Promise((resolve, reject) => {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
          const user = userCredential.user;
          if (user.emailVerified) {
            resolve();
          } else {
            reject(new Error('Email is not verified'));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
};

module.exports = ServiceWrapperModule;

class BBBRoom {
  constructor(params) {
    this.params = params;
  }

  end(api) {
    console.log('end ', this.params.meetingName[0], this.params.meetingID[0]);

    api.administration.end(
      this.params.meetingID[0],
      this.params.moderatorPW[0]
    );
  }
}
