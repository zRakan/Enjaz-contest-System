const contestantDiv = document.createElement('div');
      contestantDiv.classList.add('animate__animated');
      contestantDiv.setAttribute('id', 'students_contestant');

let leaderboardContainer;
let id;

/*
    <div class="animate__animated" id="students_contestant">
        <h3 id="rank">Pos</h3>
        <h4>Name</h4>
        <h3>Points</h3>
    </div>
*/

function createContestant(name, points, pos) {
    const contestant = contestantDiv.cloneNode();

    // Create pos element
    const posEl = document.createElement('h3');
          posEl.setAttribute('id', 'rank');
          posEl.innerHTML = pos;

    // Create name element
    const nameEl = document.createElement('h4');
          nameEl.innerHTML = name;

    // Create points element
    const pointsEl = document.createElement('h3');
          pointsEl.innerHTML = points;

    // Appending to contestant container
    contestant.appendChild(posEl);
    contestant.appendChild(nameEl);
    contestant.appendChild(pointsEl);

    // Appending to leaderboard box
    if(leaderboardContainer)
        leaderboardContainer.appendChild(contestant);
}

const notStarted = document.createElement('p');
      notStarted.setAttribute('id', 'not-started-yet');
      notStarted.innerHTML = "لم تبدأ المسابقة بعد";

document.addEventListener("DOMContentLoaded", function() {
    leaderboardContainer = document.querySelector('#box');

    const socket = io('/leaderboard');

    socket.on('enjaz:leaderboard:getid', function() {
        socket.emit('enjaz:leaderboard:getid'); 
    });

    socket.on('enjaz:leaderboard:updating', function(data) {
        console.log(data);

        const childs = leaderboardContainer.children;

        const Type = data.type;
        const Value = data.value;

        switch(Type) {
            case 'get_id':
                data.id && (id = data.id);
                break;
            case 'state':
                if(Value != 'waiting') {
                    const waitingDiv = document.querySelector('#not-started-yet');
                    waitingDiv && waitingDiv.remove(); // Remove
                } else {
                    console.log(childs);

                    // Remove all contestants
                    for(let i = 1; i < childs.length; i++)
                        childs[i].remove();
    
                    // Append waiting state
                    leaderboardContainer.appendChild(notStarted);
                }
                break;
            case 'leaderboard':
                for(let i = 0; i < Value.length; i++) {
                    const currentElement = childs[i+1];
                    console.log(currentElement);

                    const currentName = Value[i].name;
                    const currentPoints = Value[i].points;
                    const currentId = Value[i].id;

                    // If new contestant (Not overwriting)
                    if(!currentElement) {
                        createContestant(currentName + (currentId == id ? " (أنت)" : ""), currentPoints, i+1);
                        continue;
                    }

                    // Changing info
                    const [pos, points] = currentElement.querySelectorAll('h3');

                    const name = currentElement.querySelector('h4');
                    console.log(name, pos, points);

                    // If position of player has changed
                        // Format the name and remove special characters
                        let formattedName = name.innerHTML;
                            formattedName = formattedName.replace(' (أنت)', '') // Remove 'You' suffix

                        if(formattedName != currentName) {
                            console.log("Overwrite pos");
                        }

                    name.innerHTML = currentName + (currentId == id ? " (أنت)" : "");
                    points.innerHTML = currentPoints;
                    pos.innerHTML = i+1;
                }
                break;
        }
    });
});