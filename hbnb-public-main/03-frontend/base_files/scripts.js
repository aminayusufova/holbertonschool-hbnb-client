document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const placesList = document.getElementById('places-list');
    const countryFilter = document.getElementById('country-filter');
    const logoutLink = document.getElementById('logout-link');

    const token = checkAuthentication();

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await loginUser(email, password);
            } catch (error) {
                if (errorMessage) {
                    errorMessage.textContent = "Login error: " + error.message;
                    errorMessage.style.display = 'block';
                }
            }
        });
    }

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

    if (placesList) {
        if (token) {
            fetchPlaces(token);
        } else {
            displayMessage('Please log in to view places.');
        }
    }

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

    if (countryFilter) {
        setupCountryFilter();
    }
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

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

function displayMessage(message) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = 'red';
        messageElement.style.display = 'block';
    }
}

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
            window.location.href = 'index.html';
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

function logoutUser() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.reload();
}

async function fetchPlaces(token) {
    try {
        const response = await fetch('http://127.0.0.1:5000/places', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places);
        } else {
            console.error('Failed to fetch places');
            displayMessage('Failed to fetch places');
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Failed to fetch places: ' + error.message);
    }
}

function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    if (placesList) {
        placesList.innerHTML = '';

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

        populateCountryFilter(countries);
    }
}

function populateCountryFilter(countries) {
    const countryFilter = document.getElementById('country-filter');
    if (countryFilter) {
        countryFilter.innerHTML = '<option value="">All Countries</option>';

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }
}

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

function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const placeId = params.get('place_id');
    console.log('Place ID:', placeId);
    return placeId;
}

async function fetchPlaceDetails(token, placeId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/places/${placeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const place = await response.json();
            console.log('Place details:', place);
            displayPlaceDetails(place);
        } else {
            console.error('Failed to fetch place details');
            displayMessage('Failed to fetch place details');
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Failed to fetch place details: ' + error.message);
    }
}

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
            document.getElementById('message').style.display = 'none';
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
