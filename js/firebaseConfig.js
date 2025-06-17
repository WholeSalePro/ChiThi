// Firebase v9 modular setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyArH87_5HnUnrP4ZntrNgXXwKvPTJWNA4o",
  authDomain: "chiti-dd1bb.firebaseapp.com",
  projectId: "chiti-dd1bb",
  storageBucket: "chiti-dd1bb.firebasestorage.app",
  messagingSenderId: "621083678655",
  appId: "1:621083678655:web:b20d3cd86119ca9cc3b30a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, onAuthStateChanged };
