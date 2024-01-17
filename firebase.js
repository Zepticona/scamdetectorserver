import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
    apiKey: "AIzaSyDzbDOQbVBxFmBqVcXOd0e4SXsqfpJrp6o",
    authDomain: "scam-detector-app.firebaseapp.com",
    databaseURL: "https://scam-detector-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "scam-detector-app",
    storageBucket: "scam-detector-app.appspot.com",
    messagingSenderId: "68047405998",
    appId: "1:68047405998:web:5451f48af35b27b07d3e3f",
    measurementId: "G-WMMMGBY5R1",
    storageBucket: 'gs://scam-detector-app.appspot.com'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app)
const storage = getStorage(app)


export {db, storage, ref, uploadBytes}

