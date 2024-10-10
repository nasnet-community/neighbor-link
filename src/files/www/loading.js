function loading(show,message,errorStyle) {
    
    document.getElementById('overlay').style.display = show ? 'flex' : 'none';
    var message_element = document.getElementById('overlay_message');

    if(errorStyle)
    {
        message_element.classList.add("text-danger")
        message_element.classList.remove("text-light")
    }
    else{
        message_element.classList.remove("text-danger")
        message_element.classList.add("text-light")
    }
    if (message){
        message_element.textContent = message;
    }else{
        message_element.textContent = "Loading ...";
    }
}


function removeSubstring ( mainStr , substringToRemove ){
    var mainString = mainStr
    // Check if the mainString ends with the substringToRemove
    if (mainString.endsWith(substringToRemove)) {
        // Get the length of the substringToRemove
        let substringLength = substringToRemove.length;
        // Remove the substring from the end of the mainString using slice()
        mainString = mainString.slice(0, -substringLength);
    }
    
    return mainString
}

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ref') && urlParams.get('ref') === 'dashboard') {
        const previousButtonText = document.getElementById('back-btn-text');
        previousButtonText.textContent = 'Back to Dashboard';
        const previousButtonhref = document.getElementById('back-btn-href');
        previousButtonhref.href = 'dashboard.html';
    }
})

function addCustomAlert(title, message, visibilityTime) {
    const alertContainer = document.getElementById('alertContainer');

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show';
    alertDiv.role = 'alert';

    // Title on its own line
    const strongText = document.createElement('strong');
    strongText.innerText = title;
    strongText.style.display = 'block'; // Make title a block element to appear on a new line

    // Message on its own line
    const alertMessage = document.createElement('span');
    alertMessage.innerText = message;
    alertMessage.style.display = 'block'; // Make message a block element to appear on a new line
    alertMessage.style.marginTop = '5px'; // Optional: Adds some spacing between title and message

    // Container for close button and countdown text
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'flex-end'; // Aligns items to the right

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');

    const countdownSpan = document.createElement('span');
    countdownSpan.style.fontSize = '0.8em'; // Smaller font size for the countdown
    countdownSpan.style.marginTop = '5px'; // Adds a little space between button and countdown
    let countdown = Math.floor((visibilityTime || 20000) / 1000); // Convert visibility time to seconds
    countdownSpan.innerText = `(${countdown})`;

    buttonContainer.appendChild(closeButton);
    buttonContainer.appendChild(countdownSpan);

    alertDiv.appendChild(strongText); // Append title
    alertDiv.appendChild(alertMessage); // Append message
    alertDiv.appendChild(buttonContainer); // Add the button container to the alert

    alertContainer.appendChild(alertDiv);

    // Update the countdown every second
    const interval = setInterval(() => {
        countdown--;
        countdownSpan.innerText = `( ${countdown} )`;

        if (countdown <= 0) {
            clearInterval(interval); // Stop the interval when countdown is 0
        }
    }, 1000);

    // Remove the alert after the specified visibility time
    setTimeout(() => {
        alertDiv.classList.remove('show'); // Hides the alert
        alertDiv.classList.add('fade'); // Optional: adds fade-out effect
        setTimeout(() => alertDiv.remove(), 500); // Removes it after fade out
    }, visibilityTime || 20000);
}
