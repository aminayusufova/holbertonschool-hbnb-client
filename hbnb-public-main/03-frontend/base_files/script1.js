// Ensure that the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        // Add an event listener for the form submission
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission behavior

            // Retrieve the authentication token and place ID from URL
            const token = getCookie('token');
            const placeId = getPlaceIdFromURL();
            const reviewText = document.getElementById('review-text').value;
            const rating = document.getElementById('rating').value;

            // Check if both token and place ID are available
            if (token && placeId) {
                // Submit the review to the server
                await submitReview(token, placeId, reviewText, rating);
            } else {
                // Display an error message if token or place ID is missing
                showMessage('Missing authentication or place ID', 'error');
            }
        });
    }
});

// Function to submit a review to the server
async function submitReview(token, placeId, reviewText, rating) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the token in the request header
            },
            body: JSON.stringify({ review: reviewText, rating }) // Send review and rating as JSON
        });

        // Handle the response from the server
        handleResponse(response);
    } catch (error) {
        // Display an error message if the request fails
        showMessage('Failed to submit review. Please try again later.', 'error');
        console.error('Error:', error); // Log the error to the console
    }
}

// Function to handle the response from the server
function handleResponse(response) {
    if (response.ok) {
        // Display a success message and redirect to the thank you page
        showMessage('Review submitted successfully!', 'success');
        document.getElementById('review-form').reset(); // Reset the form fields
        setTimeout(() => {
            window.location.href = 'thank_you.html'; // Redirect to the thank you page after 2 seconds
        }, 2000);
    } else {
        // Display an error message if the response is not OK
        showMessage('Failed to submit review', 'error');
    }
}

// Function to display messages to the user
function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message; // Set the message text
        messageElement.style.color = type === 'success' ? 'green' : 'red'; // Set text color based on message type
        messageElement.style.display = 'block'; // Display the message
    } else {
        console.error('Message element not found.'); // Log an error if the message element is missing
    }
}

// Function to retrieve a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`; // Append a semicolon for easier parsing
    const parts = value.split(`; ${name}=`); // Split the cookie string to find the desired cookie
    if (parts.length === 2) return parts.pop().split(';').shift(); // Extract and return the cookie value
    return null; // Return null if the cookie is not found
}

// Function to get the place ID from the URL parameters
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search); // Parse the URL parameters
    return params.get('place_id'); // Retrieve the place ID parameter
}
