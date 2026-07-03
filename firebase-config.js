// firebase-config.js — connects this site to your Firebase project.
// These values are safe to be public (they're identifiers, not secret
// keys). Real security comes from the Firestore rules + your admin
// email/password, not from hiding this file.

const firebaseConfig = {
  apiKey: "AIzaSyDATWPM7g2AvccSDqB9B4YJlZoBZRtW2WI",
  authDomain: "govt-job-portal-aafba.firebaseapp.com",
  projectId: "govt-job-portal-aafba",
  storageBucket: "govt-job-portal-aafba.firebasestorage.app",
  messagingSenderId: "394350993798",
  appId: "1:394350993798:web:66302d900ab274623ccc07",
  measurementId: "G-4DGSTS1P3G"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();