const validations = {
    "arabic": /^[أ-ي ]+$/, // Arabic letters & spaces
    "numbers": /^[0-9]+$/ // Numbers only
}
export function validateInput(type, string) {
    if(!validations[type]) return false; // Invalid type

    return validations[type].test(string);
}

export function randomStr(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    
    let result = '';    
    let counter = 0;

    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter++;
    }

    return result;
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}