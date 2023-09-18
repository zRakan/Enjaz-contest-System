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
        notificationElement.style.left = '-50%';

        setTimeout(function() {
            notificationElement.style.left = '-200%';

            setTimeout(function() {
                notificationElement.remove();
            }, 500)
        }, 2000)
    }, 5);
}


let isConnected = false;
let containerInput;
let contestantContainer;
let currentState;
let dynamicElement;
function changeGameState(state, data) {
    currentState = state;

    switch(state) {
        case 'not-started':
            isConnected = false;

            if(dynamicElement) { // Check if element is existed
                dynamicElement.remove(); // Remove current element
                dynamicElement = null;
            }

            // Bring back input
            containerInput.classList.remove('hidden');

            break;
        case "waiting":
            if(dynamicElement) { // Check if element is existed
                dynamicElement.remove(); // Remove current element
                dynamicElement = null;
            }
        
            dynamicElement = document.createElement('p');
        
            let dot = 1;
            const waitingInterval = setInterval(function() {
                if(currentState != 'waiting') {
                    clearInterval(waitingInterval); // Destroy interval
                    return
                }

                if(dot > 3) dot = 1;
                dynamicElement.innerHTML = `قيد الإنتظار${'.'.repeat(dot)}`;
                dot++;
            }, 500);

            contestantContainer.appendChild(dynamicElement);
            break;
        case 'starting':
            if(!dynamicElement) {
                dynamicElement = document.createElement('p');
                contestantContainer.appendChild(dynamicElement);
            }

            console.log("Starting...");   

            let startingTime;

            if(!data || !data.current_timer) {
                startingTime = new Date();
                startingTime.setSeconds(startingTime.getSeconds() + 10);
            } else startingTime = new Date(data.current_timer);

            const startingInterval = setInterval(function() {
                const remainingSeconds = ((startingTime - new Date()) / 1000) | 0; // Using bitwise to truncate decimal points more performant than 'Math'
                console.log("remaining", remainingSeconds);

                if(currentState != 'starting' || remainingSeconds <= 0) {
                    clearInterval(startingInterval)
                    return;
                };

                dynamicElement.innerHTML = `بقي ${((startingTime - new Date()) / 1000) | 0} وتبدأ الجولة`
            }, 500);

            break;
        case 'started':
            if(dynamicElement) { // Check if element is existed
                dynamicElement.remove(); // Remove current element
                dynamicElement = null;
            }

            break;
        case 'not-joined':
            // Hide inputs
            //document.querySelectorAll('.contestant-container > :not(p)').forEach(e => e.remove());
            containerInput.classList.add('hidden');

            dynamicElement = document.createElement('p');
            dynamicElement.innerHTML = 'لا يمكنك التسجيل، بدأت الجولة، سيتم تحويلك إلى صفحة المصتدرين...';

            contestantContainer.appendChild(dynamicElement);

            setTimeout(function() {
                location.href = '/leaderboard';
            }, 3000)

            break;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Notification
    notificationContainer = document.querySelector(".notification-container");

    const socket = io('/gameplay');


    contestantContainer = document.querySelector('.contestant-container');
    const connectedUsers = document.querySelector('.contestant-container > p');


    // Start game container
        containerInput = document.querySelector('#start-game');
        const connectedButton = document.querySelector('#contestant-submit');
        const nameInput = document.querySelector('#contestant-name');
        const sIdInput = document.querySelector('#contestant-id');

    let cooldownActions = false;

    connectedButton.addEventListener('click', function() {
        if(cooldownActions) return showNotification("يجب عليك الإنتظار...", 'warning');        
        if(isConnected) return;



        const nameVal = nameInput.value;
        const sIdVal = sIdInput.value;

        // If input(s) is empty
        if(!nameVal) return showNotification("يجب عليك كتابة اسمك", "failed");
        if(!(/^[أ-ي ]+$/).test(nameVal)) return showNotification("سرّك في نيويورك اكتب اسمك بالعربي", "failed"); // Name validation


        if(!sIdVal) return showNotification("يجب عليك كتابة رقمك الجامعي", "failed");
        if(!(/^[0-9]+$/).test(sIdVal)) return showNotification("الرقم الجامعي يتكون من ارقام فقط", "failed");
        if(sIdVal.length != 9) return showNotification("الرقم الجامعي يجب ان يكون مكوّن من 9 خانات", "failed");

        socket.emit("enjaz:new-contestant", { name: nameVal, sid: sIdVal })
        showNotification("يتم انتظار القبول...", "warning");

        // Cooldown
        cooldownActions = true;
        setTimeout(function() {
            cooldownActions = false;
        }, 5000);
    });

    // Client is connected successfully
    socket.on('enjaz:joined', function(data) {
        console.log(data);
        isConnected = true;

        // Remove all
        //document.querySelectorAll('.contestant-container > :not(p)').forEach(e => e.remove());
        containerInput.classList.add('hidden');

        let additionalData = {};

        if(data.current_timer) additionalData['current_timer'] = data.current_timer;

        changeGameState(data.game_state, additionalData);

        if(data.first_time) // Joined first time (Excluded re-join[refresh])
            showNotification("تم القبول", "success");
    });

    socket.on('enjaz:updating', function(data) {
        console.log(data);

        switch(data.type) {
            case 'connected_users':
                connectedUsers.innerHTML = `عدد المشاركين: ${data.connected_users}`;
                break;
            
            case 'game_state':
                changeGameState(data.current_state);
                break;
        }
    });


    socket.on('disconnect', function() {
        console.log("Disconnect")
    });
});