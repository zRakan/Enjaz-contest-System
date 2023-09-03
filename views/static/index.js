/*
    Helper function
*/

function formatTime(date) {
    let minutes = Math.floor((date % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((date % (1000 * 60)) / 1000);
    
    return [minutes, seconds];
}

const usersList = document.querySelector("#top-users");
function addUserToLeaderboard(data) {
    const [minutes, seconds] = formatTime(data.winAt);
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;;

    usersList.innerHTML += `<div id="user">
        <p>#${data.pos} ${data.contestant}</p>
        <p>(<span id="user-time">${formattedTime}</span>)</p>
    </div>`
}


addEventListener("load", async function() {
    // Variables
    let winners = []; // List of winners
    let resp = await fetch("http://localhost:3000/winners");
        resp = await resp.json();
        winners = resp.data;


    // Sort winners
    winners.sort(function(a, b) { return a.winAt - b.winAt });

    for(let i in winners)
        addUserToLeaderboard({
            pos: parseInt(i)+1,
            contestant: winners[i].contestant,
            winAt: winners[i].winAt
        });

    // Create WebSocket connection.
    let socket = new WebSocket("ws://localhost:3000/controller");

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
                if(currentInterval) clearInterval(currentInterval);

                const currentTime = new Date();
                contestant.innerHTML = data.contestant; // Set name

                currentInterval = setInterval(function() {
                    console.log("Counting...");
                    const [minutes, seconds] = formatTime(new Date() - currentTime);
                    if(minutes == 2) {
                        console.log("Time-up");
                        timer.innerHTML = 'انتهى الوقت !'

                        setTimeout(function() {
                            timer.innerHTML = 'في انتظار النتائج...'
                        }, 1500);

                        clearInterval(currentInterval);
                        return;
                    }

                    timer.innerHTML = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
                }, 500); // 500ms update

                break;

            case "stop":
                clearInterval(currentInterval); // Clear interval
                timer.innerHTML = 'في انتظار النتائج...'
                break;
            case "finished": // Finished [Winner, loser]
                clearInterval(currentInterval); // Clear interval

                timer.style.color = data.winner ? "green" : "red";
                timer.innerHTML = data.winner ? "إجابة صحيحة" : "إجابة خاطئة";

                data.winner && winners.push({
                    contestant: contestant.innerHTML,
                    winAt: data.diff
                });

                // Leaderboard update
                // Sort winners
                winners.sort(function(a, b) { return a.winAt - b.winAt });
                usersList.innerHTML = ""; // Reset leaderboard

                for(let i in winners)
                    addUserToLeaderboard({
                        pos: parseInt(i)+1,
                        contestant: winners[i].contestant,
                        winAt: winners[i].winAt
                    });


                // Reset Text
                setTimeout(function() {
                    timer.style.color = "#144f43";
                    contestant.innerHTML = 'في انتظار منافس...';
                    timer.innerHTML = '00:00';
                }, 3000);
                

                break;
        }

    });

    socket.addEventListener("close", function(event) {
        console.log(event);
    });
});