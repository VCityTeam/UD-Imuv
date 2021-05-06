/** @format */

import { ReceptionView } from './Reception/Reception';

import firebase from 'firebase';

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
firebase.analytics(); //not sure what this is doing but it was write in the example version

const reception = new ReceptionView();
document.body.appendChild(reception.html());
