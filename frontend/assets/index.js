const socket = io();
const messageWrapper = document.getElementById("message-wrapper");
const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const nameInput = document.getElementById("name-input");
const notificationSound = document.getElementById("notification-sound");
const replyPreview = document.getElementById("reply-preview");
const replyText = document.getElementById("reply-text");
const themeButton = document.querySelector('.switch-theme button');

let currentUser = nameInput.value || "Anonim";
let replyingTo = null;

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  if (themeButton) themeButton.classList.add('active');
}

if (themeButton) {
  themeButton.addEventListener('click', function(e) {
    e.stopPropagation();
    const isDark = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode');
    this.classList.toggle('active');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

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
  } catch (e) {}
}

function scrollToBottom() {
  messageWrapper.scrollTo({
    top: messageWrapper.scrollHeight,
    behavior: 'smooth'
  });
}

socket.on("chatMessage", (data) => {
  const { message, replyTo, createdAt } = data;
  const hasSender = message.includes(':');
  const isCurrentUser = hasSender && message.startsWith(currentUser + ":");

  const wrapper = document.createElement("div");
  wrapper.className = "d-flex flex-column " + (isCurrentUser ? "align-items-end" : "align-items-start");

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + (isCurrentUser ? "bubble-mine" : "bubble-theirs");

  let displayedText = hasSender ? message.split(":").slice(1).join(":").trim() : message;
  if (displayedText.length > 250) {
    const shortText = displayedText.slice(0, 250) + "...";
    const bubbleShort = document.createElement("span");
    bubbleShort.className = "bubble-short";
    bubbleShort.textContent = shortText;

    const bubbleFull = document.createElement("span");
    bubbleFull.className = "bubble-full";
    bubbleFull.textContent = displayedText;

    const btnMore = document.createElement("button");
    btnMore.className = "btn-more";
    btnMore.textContent = "Selengkapnya";
    btnMore.onclick = function(e) {
      e.stopPropagation();
      bubble.classList.toggle("bubble-expanded");
      btnMore.textContent = bubble.classList.contains("bubble-expanded") ? "Sembunyikan" : "Selengkapnya";
    };

    bubble.appendChild(bubbleShort);
    bubble.appendChild(bubbleFull);
    bubble.appendChild(btnMore);
  } else {
    bubble.textContent = displayedText;
  }

  if (replyTo) {
    let preview = replyTo;
    if (preview.length > 40) {
      preview = preview.slice(0, 40) + "...";
    }
    const replyDiv = document.createElement("div");
    replyDiv.className = "text-muted mb-1";
    replyDiv.innerHTML = `<small><em>Membalas: ${preview}</em></small>`;
    bubble.prepend(replyDiv);
  }

  const time = document.createElement("div");
  time.className = "chat-bubble-time";
  time.textContent = formatTime(createdAt);
  bubble.appendChild(time);

  bubble.addEventListener("click", () => {
    replyingTo = message;
    let preview = message;
    if (preview.length > 40) {
      preview = preview.slice(0, 40) + "...";
    }
    replyText.textContent = preview;
    replyPreview.style.display = "block";
  });

  wrapper.appendChild(bubble);
  messageContainer.appendChild(wrapper);

  scrollToBottom();
  if (!isCurrentUser && hasSender) playNotificationSound();
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
    scrollToBottom();
  }
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keyup", (e) => e.key === "Enter" && sendMessage());

updateCurrentUser();

document.addEventListener("DOMContentLoaded", function() {
  const closeReply = document.getElementById("close-reply");
  if (closeReply) {
    closeReply.addEventListener("click", function() {
      replyingTo = null;
      replyPreview.style.display = "none";
      replyText.textContent = "";
    });
  }
});
