const section = new URLSearchParams(location.search).get("section");

const delay = ms => new Promise(res => setTimeout(res, ms)); // Helper function
addEventListener("load", async function() {
    console.log(section);

    const submitBtn = document.querySelector("#submit-CTF");
    const inputCTF = document.querySelector("#input-CTF");

    let working = false;
    submitBtn.addEventListener("click", async function(event) {
        if(working) return;
        working = true;

        const keyCTF = inputCTF.value;
        inputCTF.value = ''; // Clear

        await fetch(`/stop/${section}`, { method: "POST" }); // Stop the timer
        await delay(2000);
        await fetch(`/CTF/${section}`, { 
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                CTF_KEY: keyCTF
            })
        });

        working = false;
    });
});