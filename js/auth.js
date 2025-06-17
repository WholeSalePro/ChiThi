import { loadPage } from "./router.js";
import { auth, db } from "./firebaseConfig.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function renderLoginPage(app) {
  app.innerHTML = `
    <div class="auth-container">
      <h1 class="app-title">ChiThi</h1>
      <div class="tab-switch">
        <span id="login-tab" class="active">Log In</span>
        <span id="register-tab">Register</span>
        <div class="tab-underline"></div>
      </div>
      <div class="auth-forms">
        <form id="login-form" class="active-form">
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Log In</button>
        </form>
        <form id="register-form">
          <input type="text" placeholder="User Name" required />
          <input type="email" placeholder="Email" required />
          <input type="tel" placeholder="Phone Number" required />
          <input type="date" placeholder="Date of Birth" required />
          <input type="password" placeholder="Password" required />
          <input type="password" placeholder="Confirm Password" required />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  `;

  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const underline = document.querySelector(".tab-underline");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Switch Tabs
  loginTab.onclick = () => switchTab("login");
  registerTab.onclick = () => switchTab("register");

  function switchTab(type) {
    if (type === "login") {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginForm.classList.add("active-form");
      registerForm.classList.remove("active-form");
      underline.style.left = "0%";
    } else {
      loginTab.classList.remove("active");
      registerTab.classList.add("active");
      loginForm.classList.remove("active-form");
      registerForm.classList.add("active-form");
      underline.style.left = "50%";
    }
  }

  // Login Function
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = loginForm.children[0].value;
    const password = loginForm.children[1].value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loadPage("chats");
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  };

  // Register Function
  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = registerForm.children[0].value;
    const email = registerForm.children[1].value;
    const phone = registerForm.children[2].value;
    const dob = registerForm.children[3].value;
    const password = registerForm.children[4].value;
    const confirm = registerForm.children[5].value;

    if (password !== confirm) return alert("Passwords do not match");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, 'users', user.uid),{
        uid: user.uid,
        displayName: username,
        email,
        phone,
        dob,
        password,
        fnds: 0,
      });
      // Save extra user info to Firestore (not implemented yet)
      console.log("User registered:", user.uid, username, phone, dob);
      loadPage("chats");
    } catch (err) {
      alert("Registration Failed: " + err.message);
    }
  };
}
