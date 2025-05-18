const socket = io();
const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const nameInput = document.getElementById("name-input");
const notificationSound = document.getElementById("notification-sound");
const themeToggleCheckbox = document.getElementById("theme-toggle");
const replyPreview = document.getElementById("reply-preview");
const replyText = document.getElementById("reply-text");

let currentUser = nameInput.value || "Anonim";
let replyingTo = null;

function updateCurrentUser() {
  currentUser = nameInput.value.trim() || "Anonim";
}

function formatTime(time) {
  const date = new Date(time);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function playNotificationSound() {
  try {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {
      document.addEventListener("click", () => notificationSound.play(), { once: true });
    });
  } catch (e) {
    console.error("Error playing sound:", e);
  }
}

socket.on("chatMessage", (data) => {
  const { message, replyTo, createdAt } = data;
  const isCurrentUser = message.startsWith(currentUser + ":");

  const wrapper = document.createElement("div");
  wrapper.className = "d-flex flex-column " + (isCurrentUser ? "align-items-end" : "align-items-start");

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + (isCurrentUser ? "bubble-mine text-dark" : "bubble-theirs text-dark");
  bubble.textContent = message;

  if (replyTo) {
    const reply = document.createElement("div");
    reply.innerHTML = `<small><em>${replyTo}</em></small>`;
    reply.className = "text-muted mb-1";
    bubble.prepend(reply);
  }

  const time = document.createElement("div");
  time.className = "text-end small text-muted mt-1";
  time.textContent = formatTime(createdAt);
  bubble.appendChild(time);

  bubble.addEventListener("click", () => {
    replyingTo = message;
    replyText.textContent = message;
    replyPreview.style.display = "block";
  });

  wrapper.appendChild(bubble);
  messageContainer.appendChild(wrapper);
  messageContainer.scrollTop = messageContainer.scrollHeight;

  if (!isCurrentUser) playNotificationSound();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    const sender = nameInput.value.trim() || "Anonim";
    socket.emit("chatMessage", {
      message: `${sender}: ${message}`,
      replyTo: replyingTo
    });
    messageInput.value = "";
    replyingTo = null;
    replyPreview.style.display = "none";
  }
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keyup", (e) => e.key === "Enter" && sendMessage());

function applyTheme(dark) {
  const body = document.body;

  if (dark) {
    body.classList.add("dark-mode");
    document.getElementById("input-panel").classList.add("bg-dark", "border-top");
    document.getElementById("message-container").classList.add("bg-dark");
    document.getElementById("input-panel").classList.remove("bg-white");
    document.getElementById("message-container").classList.remove("bg-body-tertiary");
    localStorage.setItem("theme", "dark");
    themeToggleCheckbox.checked = true;
  } else {
    body.classList.remove("dark-mode");
    document.getElementById("input-panel").classList.add("bg-white");
    document.getElementById("message-container").classList.add("bg-body-tertiary");
    document.getElementById("input-panel").classList.remove("bg-dark");
    document.getElementById("message-container").classList.remove("bg-dark");
    localStorage.setItem("theme", "light");
    themeToggleCheckbox.checked = false;
  }

  // Adjust icon inside toggle size
  const style = document.createElement('style');
  style.textContent = `
    .slider::before {
      background-size: 20px 20px !important;
      background-repeat: no-repeat;
      background-position: center;
    }
  `;
  document.head.appendChild(style);
}

const isDark = localStorage.getItem("theme") === "dark";
applyTheme(isDark);
themeToggleCheckbox.addEventListener("change", () => {
  const isDarkNow = themeToggleCheckbox.checked;
  applyTheme(isDarkNow);
});

updateCurrentUser();
