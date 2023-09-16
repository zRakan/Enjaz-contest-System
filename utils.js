const validations = {
    "arabic": /^[أ-ي ]+$/, // Arabic letters & spaces
    "numbers": /^[0-9]+$/ // Numbers only
}
export function validateInput(type, string) {
    if(!validations[type]) return false; // Invalid type

    return validations[type].test(string);
}