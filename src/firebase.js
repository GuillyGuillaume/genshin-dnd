// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzk9sWXthiO8I-5wDRxm8uglfqdVPyZA4",
  authDomain: "genshin-dnd.firebaseapp.com",
  databaseURL: "https://genshin-dnd-default-rtdb.firebaseio.com",
  projectId: "genshin-dnd",
  storageBucket: "genshin-dnd.appspot.com",
  messagingSenderId: "564704694087",
  appId: "1:564704694087:web:4f62f621a5af36eafb8662",
  measurementId: "G-W5PXGEVKQ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Export the database reference
export { database };