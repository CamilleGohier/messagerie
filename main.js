const firebaseConfig = {
    apiKey: "AIzaSyDZYe9qxMzMEb4iU1XCjRX4bH0f9vJu37w",
    authDomain: "tchat-kami.firebaseapp.com",
    databaseURL: "https://tchat-kami-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tchat-kami",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const message = document.getElementById("msg");
const footer = document.querySelector(".footer");

message.addEventListener("keydown", function(e) {
    if (e.key == "Enter") {
        send();
    }
})

function ajusteMargin() {
    document.querySelector(".container").style.marginBottom = footer.offsetHeight + "px";
}

ajusteMargin();
window.addEventListener("resize", ajusteMargin);

function send(){
    const user = document.getElementById("user").value;
    const msg = message.value;

    if (!user || !msg) return;

    db.ref('messages').push({user, msg});
    message.value = "";
}

db.ref('messages').on('value', list => {
    const tchat = document.getElementById("tchat");
    tchat.innerHTML = "";
    
    list.forEach(result => {
        const m = result.val();
        tchat.innerHTML += `<div><strong>${m.user}</strong>: ${m.msg}</div>`;
    });

    tchat.scrollTop = tchat.scrollHeight;
});