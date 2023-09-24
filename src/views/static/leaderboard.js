const contestantDiv = document.createElement('div');
      contestantDiv.classList.add('animate__animated');
      contestantDiv.setAttribute('id', 'students_contestant');

let leaderboardContainer;

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

document.addEventListener("DOMContentLoaded", function() {
    leaderboardContainer = document.querySelector('#box');

    const socket = io('/leaderboard');


    socket.on('enjaz:leaderboard:updating', function(data) {
        console.log(data);

        const childs = leaderboardContainer.children;

        const Type = data.type;
        const Value = data.value;

        switch(Type) {
            case 'state':
                if(Value != 'waiting'){
                    const waitingDiv = document.querySelector('#not-started-yet');

                    waitingDiv && waitingDiv.remove(); // Remove
                } else {
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

                    const currentName = Value[i].name;
                    const currentPoints = Value[i].points;

                    // If new contestant (Not overwriting)
                    if(!currentElement) {
                        createContestant(currentName, currentPoints, i+1);
                        continue;
                    }

                    // Changing info
                    const [pos, points] = currentElement.querySelectorAll('h3');

                    const name = currentElement.querySelector('h4');

                    // If position of player has changed
                    if(name.innerHTML != currentName) {
                        console.log("Overwrite pos");
                    }

                    name.innerHTML = currentName;
                    points.innerHTML = currentPoints;
                    pos.innerHTML = i+1;
                }
                break;
        }
    });
});