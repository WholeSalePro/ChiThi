import { db, auth } from "./firebaseConfig.js";
import { collection, query, getDocs, setDoc, doc, where, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getChatId, loadPage } from "./router.js";
import { icons } from "./icons.js";

export async function renderSearchPage(app) {
  app.innerHTML = `
    <div class="header">
      <h2>Search Users</h2>
      <button class="icons" id="back-btn">${icons.back}</button>
    </div>

    <div class="search-container">
      <input type="search" id="search-input" placeholder="Search users by name or ID..." autocomplete="off" />
    </div>

    <div id="search-results" class="search-results">
      <p class="loading">Type to search users...</p>
    </div>
  `;

  document.getElementById("back-btn").onclick = () => loadPage("chats");

  const input = document.getElementById("search-input");
  const resultsDiv = document.getElementById("search-results");

  // Fetch all users initially (optional: can optimize for large user base)
  let users = [];
  async function fetchUsers() {
    const q = query(collection(db, "users"), orderBy("displayName"));
    const snapshot = await getDocs(q);
    users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  await fetchUsers();

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();

    if (val === "") {
      resultsDiv.innerHTML = `<p class="loading">Type to search users...</p>`;
      return;
    }

    const filtered = users.filter(user => {
      return (
        user.displayName.toLowerCase().includes(val) ||
        user.id.toLowerCase().includes(val)
      );
    });

    if (filtered.length === 0) {
      resultsDiv.innerHTML = `<p class="empty">No users found.</p>`;
      return;
    }

    resultsDiv.innerHTML = "";

    filtered.forEach(user => {
      const userDiv = document.createElement("div");
      userDiv.className = "user-item";
      userDiv.textContent = user.displayName + " (" + user.id + ")";
      userDiv.onclick = async () => {
        const currentUid = auth.currentUser?.uid;
        if (!currentUid) return;

        // const existingId = [currentUid, user.id].sort().join("_"); // consistent ID
        const existingId = getChatId(currentUid, user.uid); // consistent ID

        const messageDocRef = doc(db, 'messages', existingId);

        await setDoc(messageDocRef, {
          sender: currentUid,
          receiver: user.id,
          senderLiveMode: false,
          receiverLiveMode: false,
          lastMsg: "",
          lastMsgTime: Date.now(),
          lastMsgQty: 0,
          senderTyping: false,
          receiverTyping: false,
          liveMsg:{
            sender: '',
            text: '',
          }
        }, { merge: true });

        loadPage("chat", user.id);
      };

      resultsDiv.appendChild(userDiv);
    });
  });
}
