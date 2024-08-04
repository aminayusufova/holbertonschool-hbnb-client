// Ensure that the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const placesList = document.getElementById('places-list');
    const countryFilter = document.getElementById('country-filter');
    const logoutLink = document.getElementById('logout-link');

    // Check for user authentication and retrieve token
    const token = checkAuthentication();

    // Set up the login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission behavior
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Attempt to log in the user
                await loginUser(email, password);
            } catch (error) {
                // Display error message if login fails
                if (errorMessage) {
                    errorMessage.textContent = "Login error: " + error.message;
                    errorMessage.style.display = 'block';
                }
            }
        });
    }

    // Show or hide logout link based on authentication status
    if (logoutLink) {
        if (token) {
            logoutLink.style.display = 'block';
            logoutLink.addEventListener('click', () => {
                logoutUser();
            });
        } else {
            logoutLink.style.display = 'none';
        }
    }

    // Fetch and display the list of places if user is authenticated
    if (placesList) {
        if (token) {
            fetchPlaces(token);
        } else {
            displayMessage('Please log in to view places.');
        }
    }

    // Fetch and display details for a specific place if on the place page
    if (document.body.classList.contains('place-page')) {
        const placeId = getPlaceIdFromURL();
        if (placeId) {
            if (token) {
                fetchPlaceDetails(token, placeId);
            } else {
                displayMessage('Please log in to view place details.');
            }
        } else {
            console.error('Place ID is undefined or null');
        }
    }

    // Set up country filter functionality
    if (countryFilter) {
        setupCountryFilter();
    }
});

// Function to retrieve a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to check authentication and return the token
function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');

    if (loginLink) {
        if (!token) {
            loginLink.style.display = 'block';
            if (logoutLink) {
                logoutLink.style.display = 'none';
            }
        } else {
            loginLink.style.display = 'none';
            if (logoutLink) {
                logoutLink.style.display = 'block';
            }
        }
    }
    return token;
}

// Function to display a message to the user
function displayMessage(message) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = 'red';
        messageElement.style.display = 'block';
    }
}

// Function to log in the user and store the token in a cookie
async function loginUser(email, password) {
    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            document.cookie = `token=${data.access_token}; path=/`;
            window.location.href = 'index.html'; // Redirect to index page upon successful login
        } else {
            const error = await response.json();
            console.error('Login failed:', error.msg);
            displayMessage('Login failed: ' + error.msg);
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Login failed: ' + error.message);
    }
}

// Function to log out the user by clearing the token cookie
function logoutUser() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.reload(); // Reload the page to reflect logout
}

// Function to fetch the list of places from the API
async function fetchPlaces(token) {
    try {
        const response = await fetch('http://127.0.0.1:5000/places', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the token in the request header
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places); // Display the places on the page
        } else {
            console.error('Failed to fetch places');
            displayMessage('Failed to fetch places');
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Failed to fetch places: ' + error.message);
    }
}

// Function to display the list of places on the page
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    if (placesList) {
        placesList.innerHTML = ''; // Clear any existing content

        const countries = new Set();

        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'place';

            placeDiv.innerHTML = `
                <h2>${place.description}</h2>
                <p><strong>Host:</strong> ${place.host_name || 'No host available'}</p>
                <p><strong>Price per night:</strong> ${place.price_per_night || 'No price available'}</p>
                <p><strong>Country:</strong> ${place.country_name || 'No country available'}</p>
                <p><strong>id:</strong> ${place.id || 'No ID available'}</p>
                <a href="place.html?place_id=${place.id}">View Details</a>
            `;
            placeDiv.dataset.country = place.country_name || 'Unknown';

            placesList.appendChild(placeDiv);
            countries.add(place.country_name || 'Unknown');
        });

        populateCountryFilter(countries); // Populate the country filter options
    }
}

// Function to populate the country filter dropdown
function populateCountryFilter(countries) {
    const countryFilter = document.getElementById('country-filter');
    if (countryFilter) {
        countryFilter.innerHTML = '<option value="">All Countries</option>'; // Default option

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }
}

// Function to set up the country filter functionality
function setupCountryFilter() {
    const countryFilter = document.getElementById('country-filter');
    if (countryFilter) {
        countryFilter.addEventListener('change', (event) => {
            const selectedCountry = event.target.value;
            const places = document.querySelectorAll('#places-list .place');

            places.forEach(place => {
                if (selectedCountry === '' || place.dataset.country === selectedCountry) {
                    place.style.display = 'block';
                } else {
                    place.style.display = 'none';
                }
            });
        });
    }
}

// Function to get the place ID from the URL parameters
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const placeId = params.get('place_id');
    console.log('Place ID:', placeId);
    return placeId;
}

// Function to fetch details for a specific place
async function fetchPlaceDetails(token, placeId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/places/${placeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the token in the request header
            }
        });

        if (response.ok) {
            const place = await response.json();
            console.log('Place details:', place);
            displayPlaceDetails(place); // Display the place details
        } else {
            console.error('Failed to fetch place details');
            displayMessage('Failed to fetch place details');
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Failed to fetch place details: ' + error.message);
    }
}

// Function to display star ratings
function displayStars(rating) {
    const stars = Math.round(rating);
    let starHtml = '';

    for (let i = 0; i < 5; i++) {
        if (i < stars) {
            starHtml += '<span class="star filled">★</span>';
        } else {
            starHtml += '<span class="star">☆</span>';
        }
    }
    return starHtml;
}

// Function to display details for a specific place
function displayPlaceDetails(place) {
    const placeDetails = document.getElementById('place-details');
    if (!placeDetails) {
        console.error('Place details element not found');
        return;
    }

    const imageSrc = (place.images && place.images.length > 0) ? place.images[0] : 'default-image.jpg';

    placeDetails.innerHTML = `
        <h2><strong>Description:</strong> ${place.description || 'No description available'}</h2>
        <p><strong>Location:</strong> ${place.location || 'No location available'}</p>
        <p><strong>Country:</strong> ${place.country_name || 'No country available'}</p>
        <p><strong>Price per night:</strong> ${place.price_per_night || 'Not available'}</p>
        <p><strong>Number of rooms:</strong> ${place.number_of_rooms || 'Not available'}</p>
        <p><strong>Number of bathrooms:</strong> ${place.number_of_bathrooms || 'Not available'}</p>
        <p><strong>Max guests:</strong> ${place.max_guests || 'Not available'}</p>
        <p><strong>Latitude:</strong> ${place.latitude || 'Not available'}</p>
        <p><strong>Longitude:</strong> ${place.longitude || 'Not available'}</p>
        <h3>Reviews</h3>
        <ul>
            ${place.reviews && place.reviews.length > 0 ? 
                place.reviews.map(review => `
                    <li>
                        ${review.comment || 'No comment'} - ${displayStars(review.rating)}
                    </li>
                `).join('') :
                '<li>No reviews yet</li>'
            }
        </ul>
        <a href="add_review.html?place_id=${place.id}" id="add-review-link">Add Review</a>
    `;
}

// Function to submit a review for a place
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

        handleResponse(response); // Handle server response
    } catch (error) {
        showMessage('Failed to submit review. Please try again later.', 'error');
        console.error('Error:', error);
    }
}

// Function to handle the server response after submitting a review
function handleResponse(response) {
    if (response.ok) {
        showMessage('Review submitted successfully!', 'success');
        document.getElementById('review-form').reset(); // Reset the review form
        setTimeout(() => {
            document.getElementById('message').style.display = 'none'; // Hide the message after 2 seconds
        }, 2000);
    } else {
        showMessage('Failed to submit review', 'error');
    }
}

// Function to display messages to the user
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
