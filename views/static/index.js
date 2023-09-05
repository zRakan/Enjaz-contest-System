/*
    Helper function
*/

function formatTime(date) {
    let minutes = Math.floor((date % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((date % (1000 * 60)) / 1000);
    
    return [minutes, seconds];
}

// Leaderboard(s)
const globalList = document.querySelector("#top-users[data-section='global']");
const maleList = document.querySelector("#top-users[data-section='1']");
const femaleList = document.querySelector("#top-users[data-section='2']");
const leaderboardDiv = [globalList, maleList, femaleList];
const leaderboardTitle = document.querySelector(".leaderboard > h1");
const leaderboardSections = ["الكل", "طلاب", "طالبات"];



function addUserToLeaderboard(el, data) {
    const [minutes, seconds] = formatTime(data.winAt);
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;;

    el.innerHTML += `<div id="user">
        <p>#${data.pos} ${data.contestant}</p>
        <p>(<span id="user-time">${formattedTime}</span>)</p>
    </div>`
}

function updateLeaderboard(winners) {
    // Leaderboard update
    // Sort winners
    winners.sort(function(a, b) { return a.winAt - b.winAt });

    // Reset leaderboard(s)
        globalList.innerHTML = "";
        maleList.innerHTML = "";
        femaleList.innerHTML = "";
    

    // Add to global list
    for(let i in winners) {
        if(i > 4) break;
        
        addUserToLeaderboard(globalList, {
            pos: parseInt(i)+1,
            contestant: winners[i].contestant,
            winAt: winners[i].winAt
        });
    }

    // Add to male list
    let males = 1, females = 1;

    for(let i in winners) {
        if(males > 5 && females > 5) break; // Break loop

        (males <= 5 && winners[i].section == 1) && addUserToLeaderboard(maleList, {
            pos: males++,
            contestant: winners[i].contestant,
            winAt: winners[i].winAt
        });

        (females <= 5 && winners[i].section == 2) && addUserToLeaderboard(femaleList, {
            pos: females++,
            contestant: winners[i].contestant,
            winAt: winners[i].winAt
        });
    }
}

const section = new URLSearchParams(location.search).get("section");

addEventListener("load", async function() {
    // Leaderboard switcher
    document.querySelector('#top-users[data-section="global"').style.display = 'flex'; // Show global leaderboard

    let current = 0; // [0, 1, 2] Global, male, female

    setInterval(function() {
        // Hide old leaderboard
        leaderboardDiv[current].style.display = 'none';

        // Change state
            current++;
            if(current > 2) current = 0;
        
        // Display new leaderboard
        leaderboardDiv[current].style.display = 'flex';

        // Change Title
        leaderboardTitle.innerHTML = `قائمة المتصدرين (${leaderboardSections[current]})`
    }, 5000);


    // Variables
    let winners = []; // List of winners
    let resp = await fetch("/winners");
        resp = await resp.json();
        winners = resp.data;


    /*/ Sort winners
    winners.sort(function(a, b) { return a.winAt - b.winAt });

    for(let i in winners) {
        if(i > 4) break;

        addUserToLeaderboard({
            pos: parseInt(i)+1,
            contestant: winners[i].contestant,
            winAt: winners[i].winAt
        });
    }*/
    updateLeaderboard(winners);

    // Create WebSocket connection.
    let socket = new WebSocket(`${location.protocol == 'https:' ? 'wss' : 'ws'}://${location.host}/controller/${section}`);

    // Connection opened
    socket.addEventListener("open", function(event) {
        console.log("Connected");
    });

    // Listen for messages
    let currentInterval;

    const contestant = document.querySelector("#contestant");
    const timer = document.querySelector("#timer");
    socket.addEventListener("message", async function(event) {
        const data = JSON.parse(event.data);
        console.log(data);

        switch(data.type) {
            case "starting": // Starting
                if(currentInterval) clearInterval(currentInterval);

                const currentTime = new Date();
                contestant.innerHTML = data.contestant; // Set name

                currentInterval = setInterval(async function() {
                    console.log("Counting...");
                    const [minutes, seconds] = formatTime(new Date() - currentTime);
                   
                    /*if(minutes == 2) {
                        console.log("Time-up");
                        timer.innerHTML = 'انتهى الوقت !';

                        await fetch("/stop", { method: "POST" });

                        setTimeout(function() {
                            timer.innerHTML = 'في انتظار النتائج...'
                        }, 1500);

                        clearInterval(currentInterval);
                        return;
                    }*/

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

                updateLeaderboard(winners);

                // Reset Text
                setTimeout(function() {
                    timer.style.color = "#144f43";
                    contestant.innerHTML = 'في انتظار منافس...';
                    timer.innerHTML = '00:00';
                }, 3000);
                

                break;

            case "update":
                updateLeaderboard(data.newWinners);
                winners = data.newWinners;

                break;
        }

    });

    socket.addEventListener("close", function(event) {
        console.log(event);
    });
});