import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { loadPage } from "./router.js";
import { icons } from "./icons.js";

export async function renderSettingsPage(app) {
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
      <h2>Settings</h2>
      <button class="icons" id="back-btn">${icons.back}</button>
    </div>

    <div class="settings-container">
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

      <hr />

      <div class="theme-toggle">
        <label>
          <input type="checkbox" id="theme-switch" />
          Dark Theme
        </label>
      </div>

      <hr />

      <button id="logout-btn" class="logout-btn">Log Out</button>
    </div>
  `;

  document.getElementById("back-btn").onclick = () => loadPage("chats");

  // Set theme switch based on current theme
  const themeSwitch = document.getElementById("theme-switch");
  themeSwitch.checked = localStorage.getItem("theme") === "dark";

  themeSwitch.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });

  // Profile form submission
  const profileForm = document.getElementById("profile-form");
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document.getElementById("displayName").value.trim();

    if (displayName.length === 0) {
      alert("Display Name cannot be empty");
      return;
    }

    try {
      await updateDoc(userDocRef, { displayName });
      alert("Profile updated");
    } catch (error) {
      alert("Error updating profile: " + error.message);
    }
  });

  // Logout button
  document.getElementById("logout-btn").onclick = async () => {
    await signOut(auth);
    loadPage("login");
  };
}
