import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { loadPage } from "./router.js";
import { icons } from "./icons.js";

export async function renderProfilePage(app) {
  const user = auth.currentUser;
  if (!user) {
    app.innerHTML = `<p>Please login first.</p>`;
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);
  const userData = userDocSnap.exists() ? userDocSnap.data() : {};

  app.innerHTML = `
    <div class="header">
      <h2>Profile</h2>
      <button class="icons" id="back-btn">${icons.back}</button>
    </div>

    <div class="profile-container">
      <form id="profile-form">
        <label>
          Display Name:
          <input type="text" id="displayName" value="${userData.displayName || ""}" />
        </label>

        <label>
          Email:
          <input type="email" id="email" value="${user.email || ""}" disabled />
        </label>

        <button type="submit">Save Profile</button>
      </form>
    </div>
  `;

  document.getElementById("back-btn").onclick = () => loadPage("chats");

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const displayName = document.getElementById("displayName").value.trim();

    if (!displayName) {
      alert("Display Name cannot be empty");
      return;
    }

    try {
      await updateDoc(userDocRef, { displayName });
      alert("Profile updated successfully");
    } catch (error) {
      alert("Failed to update profile: " + error.message);
    }
  });
}
