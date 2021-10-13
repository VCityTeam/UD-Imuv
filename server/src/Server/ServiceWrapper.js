const firebase = require('firebase/app');
require('firebase/auth');

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

  createAccount(data) {
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
