document.addEventListener("DOMContentLoaded", function() {
    const socket = io();

    const connectedButton = document.querySelector('#contestant-submit');
    const connectedUsers = document.querySelector('.contestant-container > p');

    let isConnected = false;
    connectedButton.addEventListener('click', function() {
        if(isConnected) return;

        socket.emit("enjaz:new-contestant")

        isConnected = true;
    });

    socket.on('enjaz:updating', function(data) {
        console.log(data);
        connectedUsers.innerHTML = `عدد المتصلين: ${data.connectedUsers}`;
    });
});