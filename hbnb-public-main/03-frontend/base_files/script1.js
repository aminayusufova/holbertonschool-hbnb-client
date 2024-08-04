document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const token = getCookie('token');
            const placeId = getPlaceIdFromURL();
            const reviewText = document.getElementById('review-text').value;
            const rating = document.getElementById('rating').value;

            if (token && placeId) {
                await submitReview(token, placeId, reviewText, rating);
            } else {
                showMessage('Missing authentication or place ID', 'error');
            }
        });
    }
});

async function submitReview(token, placeId, reviewText, rating) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ review: reviewText, rating })
        });

        handleResponse(response);
    } catch (error) {
        showMessage('Failed to submit review. Please try again later.', 'error');
        console.error('Error:', error);
    }
}

function handleResponse(response) {
    if (response.ok) {
        showMessage('Review submitted successfully!', 'success');
        document.getElementById('review-form').reset();
        setTimeout(() => {
            window.location.href = 'thank_you.html';
        }, 2000);
    } else {
        showMessage('Failed to submit review', 'error');
    }
}

function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = type === 'success' ? 'green' : 'red';
        messageElement.style.display = 'block';
    } else {
        console.error('Message element not found.');
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('place_id');
}
