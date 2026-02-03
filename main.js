console.log("main.js chargé")

const firebaseConfig = {
    apiKey: "AIzaSyDZYe9qxMzMEb4iU1XCjRX4bH0f9vJu37w",
    authDomain: "tchat-kami.firebaseapp.com",
    databaseURL: "https://tchat-kami-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tchat-kami",
};

firebase.initializeApp(firebaseConfig);
const bdd = firebase.database();

// DOM
const container = document.getElementById("container");
const usersList = document.getElementById("usersList");

const tchat = document.getElementById("tchat");
const typingText = document.getElementById("typingText");

const footer = document.querySelector(".footer");
const colorPicker = document.getElementById("colorPicker");
const pseudo = document.getElementById("pseudo");
const message = document.getElementById("msg");
const emotesBtn = document.getElementById("emotesBtn");
const emotesPicker = document.getElementById("emotesPicker");

// Local Storage
let lastPseudo = localStorage.getItem("lastPseudo") || "";
let lastColor = localStorage.getItem("lastColor") || "";

let userId = localStorage.getItem("userId");

if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
}

// Routes
const onlineRef = bdd.ref("online/" + userId);
const usersRef = bdd.ref("users/" + userId);
const typingRef = bdd.ref("typing/" + userId);
const messagesRef = bdd.ref("messages/");

onlineRef.set({
    pseudo: lastPseudo || "Anonyme",
    color: lastColor || "#000000"
});
onlineRef.onDisconnect().remove();

usersRef.once('value').then(r => {
    const user = r.val();

    if (!user) {
        return;
    }

    pseudo.value = user.pseudo || "";
    colorPicker.value = user.color || "#000000";
    colorPicker.style.backgroundColor = colorPicker.value;

    lastPseudo = user.pseudo || "";
    lastColor = user.color || "#000000";

    localStorage.setItem("lastPseudo", lastPseudo);
    localStorage.setItem("lastColor", lastColor);
});

pseudo.addEventListener("change", () => {
    onlineRef.update({
        pseudo: pseudo.value
    })
})

colorPicker.addEventListener("input", function(e) {
    colorPicker.style.backgroundColor = e.target.value;
})

colorPicker.addEventListener("change", function(e) {
    colorPicker.style.backgroundColor = e.target.value;
    // Ajouter dans le futur le changement de la couleur texte du pseudo dans l'input
})

function ajusteMargin() {
    container.style.marginBottom = footer.offsetHeight + "px";
}

ajusteMargin();
window.addEventListener("resize", ajusteMargin);

let users = {};

bdd.ref("users").on('value', r => {
    users = r.val() || {};

    document.querySelectorAll("#tchat div[data-userid]").forEach(e => {
        const uuid = e.dataset.userId;
        const user = users[uuid];

        if (!user) {
            return;
        }

        const msgTchat = e.querySelector('strong');
        msgTchat.style.color = user.color;
    })
})

let typingTimeout;

message.addEventListener("input", () => {
    typingRef.set({
        pseudo: pseudo.value || "Anonyme",
        typing: true
    });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        typingRef.remove();
    }, 3000);

    message.value = parseEmotes(message.value)
})

bdd.ref("typing").on("value", r => {
    const typings = r.val() || {};

    delete typings[userId];

    const typingUsers = [];
    for (let u in typings) {
        typingUsers.push(typings[u]);
    }

    if (typingUsers.length == 0) {
        typingText.textContent = "";
        return;
    }

    if (typingUsers.length == 1) {
        typingText.textContent = typingUsers[0].pseudo + " écrit...";
    }
    else {
        typingText.textContent = typingUsers.length + " personnes écrivent...";
    }
})

bdd.ref("online").on("value", r => {
    const onlineUsers = r.val() || {};
    usersList.innerHTML = "";

     for (let u in onlineUsers) {
        const user = onlineUsers[u];

        usersList.innerHTML += `
            <div style="color:${user.color || "#000000"}">
                ${user.pseudo || "Anonyme"}
            </div>
        `
     }
})

message.addEventListener("keydown", function(e) {
    if (e.key == "Enter") {
        send();
    }
})

function send() {
    let msg = message.value;
    const color = colorPicker.value;

    if (!pseudo.value || !msg) return;

    msg = parseEmotes(msg);

    onlineRef.set({
        pseudo: pseudo.value,
        color: color
    });

    if (pseudo.value != lastPseudo || color != lastColor) {
        usersRef.set({
            pseudo: pseudo.value,
            color: color
        });

        lastPseudo = pseudo.value;
        lastColor = color;

        localStorage.setItem("lastPseudo", pseudo.value);
        localStorage.setItem("lastColor", color);
    };

    messagesRef.push({
        userId: userId,
        pseudo: pseudo.value,
        msg: msg
    });

    message.value = "";
    typingRef.remove();
}

messagesRef.on('value', list => {
    tchat.innerHTML = "";

    list.forEach(r => {
        const m = r.val();

        const pseudoUser = m.pseudo || "Anonyme";

        const user = users[m.userId];
        const colorUser = user?.color || "#000000";

        tchat.innerHTML += `
        <div data-userid="${m.userId}">
            <strong style="color:${colorUser}">${pseudoUser}</strong>: ${m.msg}
        </div>`;
    });

    const bottom = document.createElement("div");
    bottom.id = "bottom";
    tchat.appendChild(bottom);
    bottom.scrollIntoView();
});

function parseEmotes(text) {
    const map = {
        ":)": "😊",
        ":D": "😄",
        ":(": "☹️",
        "<3": "❤️",
        ";)": "😉"
    }

    for (const key in map) {
        text = text.replaceAll(key, map[key]);
    }

    return text;
}

emotesBtn.addEventListener("click", () => {
    emotesPicker.classList.toggle("hidden");
})

emotesPicker.addEventListener("click", e => {
    if (e.target.classList.contains("emotes")) {
        message.value += e.target.textContent;
        message.focus();
    }
})