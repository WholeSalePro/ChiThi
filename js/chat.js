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

import { loadPage, getChatId } from "./router.js";
import { icons } from "./icons.js";

export async function renderChatPage(app, otherUserId) {
  const otherUserSnap = await getDoc(doc(db, 'users', otherUserId));
  if (!otherUserSnap.exists()) {
    app.innerHTML = `<p>User not found.</p>`;
    return;
  }
  const otherUser = otherUserSnap.data();

  app.innerHTML = `
    <div class="header">
      <div class="icons" id="back-btn" style="cursor:pointer;">${icons.back}</div>
      <div class="header-right">
      <div id="typing-indicator" class="typing-indicator" style="font-style: italic; color: gray; padding-left: 10px; height: 20px;"></div>
        <div style="display:inline-flex;flex-direction: column;">
          <div class="chat-title">${otherUser.displayName}</div>
          <div id="statusDiv" class="typing-indicator" style="font-style: italic;font-size: 12px; color: gray; padding-left: 10px; height: 20px;"></div>
        </div>
        <button class="icons" id="chatSettings">${icons.settings}</button>
      </div>
    </div>

    <div id="messages" class="messages"></div>
    
    <div class="live-msg-glow" id="live-msg"></div>

    <div id="reply-preview" class="reply-preview hid">
      <div id="reply-text" class="reply-text"></div>
      <button id="cancel-reply" class="icons cancel-reply">${icons.close}</button>
    </div>

    <div class="chat-input-bar">
      <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off" />
      <button class="icons" id="send-btn">${icons.send}</button>
    </div>
  `;

  document.getElementById("chatSettings").onclick = () => loadPage("chatSettings", otherUser);

  const uid = auth.currentUser?.uid;
  if (!uid) {
    app.innerHTML = `<p>Please login first.</p>`;
    return;
  }

  const chatId = getChatId(uid, otherUserId);
  const messagesRef = collection(db, "messages", chatId, "chat");
  const mainMessageDocRef = doc(db, "messages", chatId);

  const messagesDiv = document.getElementById("messages");
  const input = document.getElementById("message-input");
  const typingIndicator = document.getElementById("typing-indicator");
  const statusDiv = document.getElementById("statusDiv");
  const liveMsgDiv = document.getElementById("live-msg");

  let replyTo = null;
  const replyPreview = document.getElementById("reply-preview");
  const replyText = document.getElementById("reply-text");
  const cancelReplyBtn = document.getElementById("cancel-reply");

  cancelReplyBtn.onclick = () => {
    replyTo = null;
    replyPreview.classList.add("hid");
    replyText.textContent = '';

    document.querySelectorAll(".swipe-reply").forEach(el => el.classList.remove("swipe-reply"));
  };

  onSnapshot(doc(db, "users", otherUserId), (snap) => {
    const data = snap.data();
    if (!data) return;

    if (data.isOnline) {
      statusDiv.textContent = "Online";
    } else {
      const lastSeen = data.lastSeen?.toDate();
      if (lastSeen) {
        statusDiv.textContent = `Last seen at ${lastSeen.toLocaleTimeString()}`;
      } else {
        statusDiv.textContent = "Offline";
      }
    }
  });


  // Listen to messages
  onSnapshot(query(messagesRef, orderBy("time", "asc")), (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();

      const messageWrapper = document.createElement("div");
      messageWrapper.className = "message-wrapper " + (msg.sender === uid ? "sent" : "received");

      // If this message is a reply to another
      if (msg.replyTo && msg.replyTo.text) {
        const replyDiv = document.createElement("div");
        replyDiv.className = "reply-to";
        replyDiv.textContent = msg.replyTo.text;
        messageWrapper.appendChild(replyDiv);
      }

      // Main message bubble
      const textDiv = document.createElement("div");
      textDiv.className = "message";
      textDiv.textContent = msg.text;

      textDiv.style.cursor = "pointer";
      textDiv.style.transition = "transform 0.25s ease, background 0.2s ease";

      // Swipe/Touch handlers
      let touchStartX = 0;

      textDiv.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0].screenX;
      });

      textDiv.addEventListener("touchmove", e => {
        const currentX = e.changedTouches[0].screenX;
        const delta = currentX - touchStartX;
        if (delta > 0 && delta < 100) {
          textDiv.style.transform = `translateX(${delta}px)`;
        }
      });

      textDiv.addEventListener("touchend", e => {
        const swipeDistance = e.changedTouches[0].screenX - touchStartX;
        if (swipeDistance > 60) {
          // 🧹 Remove previous highlights
          document.querySelectorAll(".swipe-reply").forEach(el => el.classList.remove("swipe-reply"));

          textDiv.classList.add("swipe-reply");
          replyTo = { text: msg.text };
          replyText.textContent = `Replying to: ${msg.text}`;
          replyPreview.classList.remove("hid");
        }
        textDiv.style.transform = "translateX(0)";
      });

      // Desktop click-to-reply
      textDiv.addEventListener("dblclick", () => {
        // 🧹 Remove previous highlights
        document.querySelectorAll(".swipe-reply").forEach(el => el.classList.remove("swipe-reply"));

        textDiv.classList.add("swipe-reply");
        replyTo = { text: msg.text };
        replyText.textContent = `Replying to: ${msg.text}`;
        replyPreview.classList.remove("hid");

        setTimeout(() => textDiv.classList.remove("swipe-reply"), 250);
      });


      messageWrapper.appendChild(textDiv);
      messagesDiv.appendChild(messageWrapper);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });


  // Listen to main document for live mode and live messages
  onSnapshot(mainMessageDocRef, (docSnap) => {
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const { sender, receiver, senderLiveMode = false, receiverLiveMode = false, senderTyping = false, receiverTyping = false, liveMsg = null } = data;
    const isSender = uid === sender;
    const isReceiver = uid === receiver;

    const canSeeTyping = (isSender && receiverTyping) || (isReceiver && senderTyping);
    const shouldShowLive = liveMsg && liveMsg.sender !== uid && liveMsg.text.trim().length > 0;

    typingIndicator.textContent = (canSeeTyping)
      ? `Typing...`
      : "";

    if (shouldShowLive) {
      if (data.liveMsg.text != '') {
        liveMsgDiv.classList.remove("hid");
        liveMsgDiv.innerHTML = liveMsg.text;
      } else {
        liveMsgDiv.classList.add("hid");
      }
    } else {
      liveMsgDiv.classList.add("hid");
    }
  });

  // Handle input typing
  input.addEventListener("input", async (e) => {
    const text = e.target.value;
    const mainDocSnap = await getDoc(mainMessageDocRef);
    if (!mainDocSnap.exists()) return;

    const data = mainDocSnap.data();
    const { sender, receiver, senderLiveMode = false, receiverLiveMode = false } = data;
    const isSender = uid === sender;
    const isReceiver = uid === receiver;

    const myLiveModeOn = (isSender && senderLiveMode) || (isReceiver && receiverLiveMode);

    // ✅ Update liveMsg if live mode is active
    if (myLiveModeOn) {
      await updateDoc(mainMessageDocRef, {
        liveMsg: {
          text,
          sender: uid,
          updatedAt: serverTimestamp()
        }
      });
    }

    // ✅ Update typing status separately
    if (text.length > 0) {
      await updateDoc(mainMessageDocRef, {
        ...(isSender ? { senderTyping: true } : { receiverTyping: true })
      });
    } else {
      await updateDoc(mainMessageDocRef, {
        ...(isSender ? { senderTyping: false } : { receiverTyping: false })
      });
    }
  });


  // Handle message send
  document.getElementById("send-btn").onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    await addDoc(messagesRef, {
      text,
      sender: uid,
      receiver: otherUserId,
      time: serverTimestamp(),
      ...(replyTo && { replyTo })
    });

    await updateDoc(mainMessageDocRef, {
      ...(isSender ? { senderTyping: false } : { receiverTyping: false }),
      // your message sending fields...
    });


    await updateLastMessage(uid, otherUserId, text);

    const mainDocSnap = await getDoc(mainMessageDocRef);
    if (mainDocSnap.data().liveMsg.sender == uid) {
      await updateDoc(mainMessageDocRef, {
        liveMsg: {
          text: '',
          sender: uid,
          updatedAt: serverTimestamp()
        }
      });
    }

    replyTo = null;
    replyPreview.classList.add("hid");
    replyText.textContent = '';
  };

  document.getElementById("back-btn").onclick = () => loadPage("chats");
}

async function updateLastMessage(uid, otherId, text) {
  const chatDoc = doc(db, "messages", getChatId(uid, otherId));
  await setDoc(chatDoc, {
    sender: uid,
    receiver: otherId,
    lastMsg: text,
    lastMsgTime: serverTimestamp(),
    lastMsgQty: 1
  }, { merge: true });
}
