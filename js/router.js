import { renderLoginPage } from './auth.js';
import { renderChatsPage } from './chats.js';
import { renderChatPage } from './chat.js';
import { renderSearchPage } from './search.js';
import { renderProfilePage } from './profile.js';
import { renderSettingsPage } from './settings.js';
import { renderChatSettingsPage } from './chatSettings.js';

const app = document.getElementById("app");

const pages = {
  login: renderLoginPage,
  chats: renderChatsPage,
  chat: renderChatPage,
  search: renderSearchPage,
  profile: renderProfilePage,
  chatSettings: renderChatSettingsPage,
  settings: renderSettingsPage
};

export function loadPage(pageName, params = {}) {
  app.innerHTML = ""; // Clear existing content
  pages[pageName](app, params);
}

export function getChatId(uid1, uid2) {
  return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}