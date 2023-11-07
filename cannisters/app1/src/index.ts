import { Canister, query, text, update, Void, float64 } from 'azle';

// This is a global variable that is stored on the heap
let message = '';

export default Canister({
    // Query calls complete quickly because they do not go through consensus
    getMessage: query([], text, () => {
        return message;
    }),
    // Update calls take a few seconds to complete
    // This is because they persist state changes and go through consensus
    setMessage: update([text], text, (newMessage) => {
        message = newMessage; // This change will be persisted
        return "Updated successfully!"
    }),
    getBmi: update([float64, float64], text, (weight, height) => {
        const bmi = weight / (height * height);
        return bmi < 17 ? "Underweight" : (bmi >= 17 && bmi < 23)? "Normal" : (bmi >= 23 && bmi < 27)? "Overweight" : "Obese";
    }
    )

});

