/* Helper functions */
function shuffle(arr) {
    const randomizer = Math.random();

    // Shuffling by swaping via randomizer
    if(randomizer >= 0.5) {
        const temp = arr[0];
        arr[0] = arr[1];
        arr[1] = temp;
    }
}

let handlers = {};
function setEventHandler(element, id, evName, func) {
    console.log(handlers);
    
    if(handlers[id])
        element.removeEventListener(evName, handlers[id], true); // Remove old handler

    handlers[id] = func;
    element.addEventListener(evName, func, true);
}

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


let isConnected = false;
let isAnswered = false;

let containerInput;
let contestantContainer;
let currentState;
let dynamicElement;
let questionElement;
let cooldownText;

let startingTime;
const formatter = new Intl.RelativeTimeFormat('ar');

function getGameTimer() { return startingTime; }

function setGameTimer(timer) {
    if(cooldownText) cooldownText.remove(); // Remove old element

    // Cooldown
    if(!timer) {
        startingTime = new Date();
        startingTime.setSeconds(startingTime.getSeconds() + 10);
    } else startingTime = new Date(timer);

    cooldownText = document.createElement('p');
    cooldownText.setAttribute("id", "time");

    const cooldownInterval = setInterval(function() {
        const remainingSeconds = ((getGameTimer() - new Date()) / 1000) | 0; // Using bitwise to truncate decimal points more performant than 'Math'
        console.log("remaining ques", remainingSeconds);

        if(currentState != 'started') {
            clearInterval(cooldownInterval)
            return;
        };

        cooldownText.innerHTML = `${formatter.format(remainingSeconds, 'second')} وينتهي السؤال`
    }, 500);

    contestantContainer.appendChild(cooldownText);
}

function createQuestion(title, options, timer) {
    questionElement = document.createElement('div');
    questionElement.setAttribute('id', 'question-container');

    // Creating question title
    const questionTitle = document.createElement('p');
    questionTitle.innerHTML = title;
    questionElement.appendChild(questionTitle);

    // Creating options
    for(let option of options) {
        const btn = document.createElement('button');
        btn.innerHTML = option;

        questionElement.appendChild(btn);
    }

    contestantContainer.appendChild(questionElement);

    // Cooldown
    setGameTimer(timer);
}

function changeGameState(state, data) {
    currentState = state;

    if(state != 'started' && questionElement) {
        questionElement.remove();
        questionElement = null;

        // Cooldown removal
        cooldownText.remove();
        cooldownText = null;
    }

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

                dynamicElement.innerHTML = `${formatter.format(remainingSeconds, 'second')} وتبدأ الجولة`
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
        showNotification("يتم انتظار القبول...");
        containerInput.classList.add('hidden'); // Hide inputs until is reject


        // Cooldown
        cooldownActions = true;
        setTimeout(function() {
            cooldownActions = false;
        }, 5000);
    });

    // Client is waiting
    socket.on('enjaz:waiting', function() {
        containerInput.classList.add('hidden'); // Hide inputs until is reject
    });

    // Client is rejected
    socket.on('enjaz:rejected', function() {
        showNotification('تم رفض تسجيلك', 'failed');
        containerInput.classList.remove('hidden');
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
                if(data.redirect_leaderboard) { // Redirect to leaderboard
                    console.log("Redirected");
                    location.href = '/leaderboard';
                    return;
                }

                changeGameState(data.current_state);
                break;
        }
    });

    socket.on('enjaz:question', function(data) {
        const ignoreQuestion = data.title ? false: true; // Don't create question if it's answered
        console.log('Question state', ignoreQuestion);

        isAnswered = false;

        console.log('New question', data);

        // Shuffle options [Not worth it to shuffle it in backend]
        !ignoreQuestion && shuffle(data.options);

        if(!questionElement && !ignoreQuestion)
            createQuestion(data.title, data.options, data.current_timer);
        else startingTime = new Date(data.current_timer); // Update time only if question created

        if(!ignoreQuestion) {
            questionElement.classList.remove('hidden');
            const elements = questionElement.children;
            elements[0].innerHTML = data.title; // Set question title

            for(let option in data.options) {
                option = parseInt(option);
                const el = elements[option+1];

                el.innerHTML = data.options[option];
                setEventHandler(el, option, 'click', function() {
                    if(isAnswered) return showNotification('الرجاء الإنتظار', 'warning');
                    isAnswered = true;
                
                    questionElement.classList.add('hidden');
                    
                
                    showNotification('تم إرسال اجابتك')
                    socket.emit('enjaz:answer', { id: data.id, answer: el.innerHTML }, function(resp) {
                        if(resp.good)
                            showNotification('جوابك صحيح', 'success');
                        else showNotification('جوابك خاطئ', 'failed');
                    });
                });

                console.log(el.innerHTML);
            }
            elements[1].innerHTML = data.options[0]; // Set first option
            elements[2].innerHTML = data.options[1]; // Set second option
        } else
            setGameTimer(data.current_timer);
    });


    socket.on('disconnect', function() {
        console.log("Disconnect")
    });
});