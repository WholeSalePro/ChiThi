import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth } from "./firebaseConfig.js";
import { loadPage } from "./router.js";
import { icons } from "./icons.js";

export async function renderChatsPage(app) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userDoc = await getDoc(doc(db, "users", uid));
  const user = userDoc.data();

  app.innerHTML = `
    <div class="header">
      <h2 class="logo">ChiThi</h2>
      <div class="header-right">
        <span id="profile-btn" class="username">${user.displayName}</span>
        <button class="icons" id="settings-btn">${icons.settings}</button>
      </div>
    </div>

    <div id="chat-list" class="chat-list">
      <p class="loading">Loading chats...</p>
    </div>

    <div class="footer" style="display: none;">
      <div class="icons footer-btn active">${icons.chat}</div>
      <div class="icons footer-btn">${icons.blog}</div>
      <div class="icons footer-btn">${icons.publish}</div>
    </div>

    <div class="search-btn" id="search-btn">
      ${icons.search}
    </div>
  `;

  const chatList = document.getElementById("chat-list");
  const loadedChats = new Set(); // Prevent duplicate rendering

  function handleSnapshot(snapshot) {
    snapshot.docChanges().forEach(async (change) => {
      const data = change.doc.data();
      const otherId = data.sender === uid ? data.receiver : data.sender;

      // Skip if already rendered
      if (loadedChats.has(otherId)) return;

      const otherUserSnap = await getDoc(doc(db, "users", otherId));
      const otherUser = otherUserSnap.exists() ? otherUserSnap.data() : { displayName: "Unknown" };

      const lastMsg = data.lastMsg || "";
      const lastMsgTime = data.lastMsgTime
        ? new Date(data.lastMsgTime.seconds * 1000).toLocaleTimeString()
        : "";

      const unread = data.lastMsgQty || 0;

      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.id = `chat-${otherId}`;
      chatItem.innerHTML = `
        <div class="chat-left">
          <div class="chat-name">${otherUser.displayName}</div>
          <div class="chat-preview">${lastMsg.slice(0, 30)}${lastMsg.length > 30 ? "..." : ""}</div>
        </div>
        <div class="chat-right">
          <div class="chat-time">${lastMsgTime}</div>
          ${unread > 0 ? `<div class="chat-unread">${unread}</div>` : ""}
        </div>
      `;

      chatItem.onclick = () => loadPage("chat", otherId);
      chatList.appendChild(chatItem);
      loadedChats.add(otherId);

      document.querySelector(".loading").textContent = "";
    });
  }

  const q1 = query(collection(db, "messages"), where("sender", "==", uid));
  const q2 = query(collection(db, "messages"), where("receiver", "==", uid));
  onSnapshot(q1, handleSnapshot);
  onSnapshot(q2, handleSnapshot);

  // Navigation buttons
  document.getElementById("search-btn").onclick = () => loadPage("search");
  document.getElementById("settings-btn").onclick = () => loadPage("settings");
  document.getElementById("profile-btn").onclick = () => loadPage("profile", uid);
}
