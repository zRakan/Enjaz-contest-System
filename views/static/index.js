document.addEventListener("DOMContentLoaded", function() {
    const socket = io();

    const connectedButton = document.querySelector('#contestant-submit');
    const connectedUsers = document.querySelector('.contestant-container > p');
    const nameInput = document.querySelector('#contestant-name');

    let isConnected = false;
    connectedButton.addEventListener('click', function() {
        if(!nameInput.value) return;

        //if(isConnected) return;

        socket.emit("enjaz:new-contestant", { name: nameInput.input })

        isConnected = true;
    });

    socket.on('enjaz:updating', function(data) {
        console.log(data);
        connectedUsers.innerHTML = `عدد المشاركين: ${data.connectedUsers}`;
    });
});