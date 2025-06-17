import { onAuthStateChanged, auth, db } from './firebaseConfig.js';
import { loadPage } from './router.js';
import {
  doc,
  setDoc,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await updateDoc(doc(db, "users", user.uid), {
      isOnline: true,
    });

    window.addEventListener("beforeunload", async () => {
      await updateDoc(doc(db, "users", user.uid), {
        isOnline: false,
      });
      await setDoc(doc(db, "users", user.uid), {
        lastSeen: serverTimestamp()
      });
    });

    loadPage('chats');
  } else {
    loadPage('login');
  }
});
