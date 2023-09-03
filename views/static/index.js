/*
    Helper function
*/

function formatTime(date) {
    let minutes = Math.floor((date % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((date % (1000 * 60)) / 1000);
    
    return [minutes, seconds];
}


// Create WebSocket connection.
let socket = new WebSocket("ws://localhost:3000/echo");

// Connection opened
socket.addEventListener("open", function(event) {
    console.log("Connected");
});

// Listen for messages
let currentInterval;

const contestant = document.querySelector("#contestant");
const timer = document.querySelector("#timer");
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    switch(data.type) {
        case "starting": // Starting
            const currentTime = new Date();
            contestant.innerHTML = data.contestant; // Set name

            currentInterval = setInterval(function() {
                console.log("Counting...");
                const [minutes, seconds] = formatTime(new Date() - currentTime);
                if(minutes == 2) {
                    console.log("Time-up");
                    clearInterval(currentInterval);
                    return;
                }

                timer.innerHTML = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            }, 500); // 500ms update

            break;

        case "finished": // Finished
            clearInterval(currentInterval); // Clear interval
            break;
    }

});

socket.addEventListener("close", function(event) {
    console.log("Test111");
});

console.log("Test");
