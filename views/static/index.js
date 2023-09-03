// Create WebSocket connection.
const socket = new WebSocket("ws://localhost:3000/echo");

// Connection opened
socket.addEventListener("open", function(event) {
    socket.send("Hello Server!");
});

// Listen for messages
socket.addEventListener("message", (event) => {
console.log("Message from server ", event.data);
});

console.log("Test");
