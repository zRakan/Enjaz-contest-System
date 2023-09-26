/*
    Notification system
*/
/* Notification System */
let notificationContainer;

/**
    * @summary This function will create notification (toast notification)
    * @param {String} message The message of notification (toast)
    * @param {String} status The status of notification ["success", "failed", "warning"] 
*/
function showNotification(message, status) {
    let notificationElement = document.createElement('div');
        notificationElement.setAttribute('id', 'notification-message');
        notificationElement.classList.add(status);

    if(status == 'success')
        notificationElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"> <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/> <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/> </svg>
        <span>${message}</span>`
    else if(status == 'failed')
        notificationElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square-fill" viewBox="0 0 16 16"> <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3.354 4.646L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 1 1 .708-.708z"/> </svg> 
        <span>${message}</span>`
    else {
        notificationElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-octagon"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> 
        <span>${message}</span>`
    }
    

    notificationContainer.appendChild(notificationElement);
    setTimeout(function() {
        notificationElement.style.left = '0%';

        setTimeout(function() {
            notificationElement.style.left = '-150%';

            setTimeout(function() {
                notificationElement.remove();
            }, 500)
        }, 2000)
    }, 5);
}


/*
    <li id="information">
        <ul><button>عدم القبول</button></ul>
        <ul><button>قبول</button></ul>
        <ul>4002221</ul>
        <ul id="name_contestant">عبدالله محمد التمامي</ul>
    </li>
*/

let contestantDiv = document.querySelector('#Contestants');

const informationDiv = document.createElement('li');
      informationDiv.setAttribute('id', 'information');

for(let word of ["عدم القبول", "قبول"]) {
    const ul = document.createElement('ul');
    const btn = document.createElement('button');
          btn.innerHTML = word;

    ul.appendChild(btn);
    informationDiv.appendChild(ul);
}

function createContestant(id, name, studentId) {
    const contestantInformation = informationDiv.cloneNode(true);
    const children = contestantInformation.children;

    // Event handler for reject/accept button
    children[0].addEventListener('click', async function() {
        let resp = await fetch('reject', {
            method: "POST",

            body: JSON.stringify({
                'ID': id,
            }),

            headers: {
                'Content-Type':'application/json'
            }
        });

        if(resp.status == 200) {        
            resp = await resp.json();        
            console.log(resp);
            
            contestantInformation.remove(); // Remove information div
            showNotification(resp.status == 'success' ? 'تم رفض اللاعب' : 'حدث خطأ', resp.status);
        } else showNotification('حدث خطأ', 'failed');
    });

    children[1].addEventListener('click', async function() {
        console.log("Accept", id);
        let resp = await fetch('accept', {
            method: "POST",

            body: JSON.stringify({
                'ID': id,
            }),

            headers: {
                'Content-Type':'application/json'
            }
        });

        if(resp.status == 200) {        
            resp = await resp.json();        
            console.log(resp);

            contestantInformation.remove(); // Remove information div
            showNotification(resp.status == 'success' ? 'تم قبول اللاعب' : 'حدث خطأ', resp.status);
        } else showNotification('حدث خطأ', 'failed');
    });

    // Add student number
    const sIdUL = document.createElement('ul');
    sIdUL.innerHTML = studentId;

    // Add name
    const nameUL = document.createElement('ul');
          nameUL.setAttribute('id', 'name_contestant')
          nameUL.innerHTML = name;

    // Append student number & name
    contestantInformation.appendChild(sIdUL);
    contestantInformation.appendChild(nameUL);

    // Append to contestantDiv
    contestantDiv.appendChild(contestantInformation);
}

const apiKey = location.pathname.substring(location.pathname.indexOf('/', 1)+1, location.pathname.length-1);
document.addEventListener('DOMContentLoaded', function() {
    notificationContainer = document.querySelector('.notification-container');
    
    /* Static button [Start, Reset] */
    
    // Start button
    const startBtn = document.querySelector('#start-container > button');
    const questionInput = document.querySelector('#start-container > input');

    startBtn.addEventListener('click', async function() {
        const inputVal = parseInt(questionInput.value);
        if(!(/^[0-9]+$/).test(inputVal)) return showNotification("الرقم الجامعي يتكون من ارقام فقط", "failed");

        let resp = await fetch(`/start/${inputVal}`, {
            method: "POST",

            headers: {
                'api_key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if(resp.status == 200) {
            resp = await resp.json();
            
            if(resp.status == 'success') showNotification('تم تشغيل الجولة', 'success');
            else showNotification(resp.message, 'failed');

        } else showNotification('حدث خطأ', 'failed');
    });

    // Reset button
    const resetBtn = document.querySelector('#reset-btn');
    resetBtn.addEventListener('click', async function() {
        let resp = await fetch(`/reset`, {
            method: "POST",

            headers: {
                'api_key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if(resp.status == 200) {
            resp = await resp.json();
            
            if(resp.status == 'success') showNotification('تم تصفير الجولة', 'success');
            else showNotification(resp.message, 'failed');

        } else showNotification('حدث خطأ', 'failed');
    });

    // Websocket
    const socket = io('/requestContestants', {
        auth: {
            api: apiKey
        }
    });

    // New contestant event
    socket.on('enjaz:contestant:new', function(data) {
        console.log(data);
    
        for(let player of data.players) {
            createContestant(player.id, player.name, player.studentId);
        }
    });
});