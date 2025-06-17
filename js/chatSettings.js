import { icons } from "./icons.js";
import { loadPage, getChatId } from "./router.js";
import { db, auth } from "./firebaseConfig.js";
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    setDoc,
    getDoc,
    orderBy,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function renderChatSettingsPage(app, otherUser) {
    app.innerHTML = `
    <div class="header">
      <div class="icons" id="back-btn" style="cursor:pointer;">${icons.back}</div>
      <div class="chat-title">Chat Settings</div>
    </div>

    <div class="settings-list">
      <div class="setting-item">
        <span>View Profile</span>
        <button class="arrow-btn">${icons.back}</button>
      </div>

      <div class="setting-item">
        <span>Mute Notifications</span>
        <label class="switch">
          <input type="checkbox" id="mute-toggle">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <span>Block User</span>
        <button class="danger-btn" id="block-btn">Block</button>
      </div>

      <div class="setting-item">
        <span><button class="icons">${icons.delete}</button> Delete Chat</span>
        <button class="danger-btn" id="delete-btn">Delete</button>
      </div>

      <div class="setting-item">
        <input type="text" placeholder="Developer Command" id="devCommand">
        <button id="command">Command</button>
      </div>
    </div>
  `;


    const uid = auth.currentUser?.uid;
    const chatId = getChatId(uid, otherUser.uid);
    console.log(chatId);
    
    const messagesRef = collection(db, "messages", chatId, "chat");
    const mainMessageDocRef = doc(db, "messages", chatId);


    document.getElementById("command").addEventListener('click', async () => {
        const devCommand = document.getElementById("devCommand");
        const commandText = devCommand.value.trim();
        devCommand.value = ""; // clear input

        if (commandText === 'live_mode_on') {
            console.log('Command compiled');

            const msgSnap = await getDoc(doc(db, 'messages', chatId));
            if (!msgSnap.exists()) {
                console.log('Chat not found');
                return;
            }

            const msgData = msgSnap.data();
            const isSender = uid === msgData.sender;
            const isReceiver = uid === msgData.receiver;
        
            if (isSender) {
                updateDoc(doc(db, 'messages', chatId),{
                    receiverLiveMode: true,
                    liveMsg:{
                        sender: msgData.receiver,
                        text: '',
                        updatedAt: serverTimestamp()
                    }
                })
            } else if (isReceiver) {
                updateDoc(doc(db, 'messages', chatId),{
                    senderLiveMode: true,
                    liveMsg:{
                        sender: msgData.sender,
                        text: '',
                        updatedAt: serverTimestamp()
                    }
                })
            } else {
                console.log('User is not part of this chat.');
                return;
            }

            console.log('Live mode enabled');
        } else {
            console.log('Invalid command');
        }
    });

    document.getElementById("back-btn").onclick = () => loadPage("chat", otherUser.uid);
    document.getElementById("block-btn").onclick = () => {
        alert(`User ${otherUser.displayName} has been blocked `);
    };
    document.getElementById("delete-btn").onclick = () => {
        alert(`Chat with ${otherUser.displayName} deleted `);
    };
}
