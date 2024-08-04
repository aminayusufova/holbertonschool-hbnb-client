document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const placesList = document.getElementById('places-list');
    const countryFilter = document.getElementById('country-filter');
    const logoutLink = document.getElementById('logout-link');

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

    const token = checkAuthentication();

    if (countryFilter) {
        setupCountryFilter();
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
        fetchPlaces(token);
    }

    if (document.body.classList.contains('place-page')) {
        const placeId = getPlaceIdFromURL();
        if (placeId) {
            fetchPlaceDetails(token, placeId);
        } else {
            console.error('Place ID is undefined or null');
        }
    }
});

async function loginUser(email, password) {
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
        throw new Error(error.message || 'Unknown error');
    }
}

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
        }
    } catch (error) {
        console.error('Error:', error);
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
                <h2>${place.name}</h2>
                <img src='${place.images[0]}' alt='${place.name}'></img>
                <p><strong>Description:</strong> ${place.description}</p>
                <p><strong>Location:</strong> ${place.location}</p>
                <p><strong>Country:</strong> ${place.country_name}</p>
                <p><strong>id:</strong> ${place.id}</p>
                
                <a href="place.html?place_id=${place.id}">View Details</a>
            `;
            placeDiv.dataset.country = place.country_name;

            placesList.appendChild(placeDiv);
            countries.add(place.country_name);
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
    console.log('Place ID:', placeId);  // Debug log
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
            console.log('Place details:', place);  // Debug log
            displayPlaceDetails(place);
        } else {
            console.error('Failed to fetch place details');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayPlaceDetails(place) {
    const placeDetails = document.getElementById('place-details');
    if (!placeDetails) {
        console.error('Place details element not found');
        return;
    }

    if (!place || !place.images || place.images.length === 0) {
        console.error('Invalid place data:', place);
        return;
    }

    placeDetails.innerHTML = `
        <h2>${place.name}</h2>
        <img src='${place.images[0]}' alt='${place.name}'></img>
        <p><strong>Description:</strong> ${place.description}</p>
        <p><strong>Location:</strong> ${place.location}</p>
        <p><strong>Country:</strong> ${place.country_name}</p>
        <h3>Reviews</h3>
        <ul>
            ${place.reviews.map(review => `<li>${review.comment}</li>`).join('')}
        </ul>
        <a href="add_review.html?place_id=${place.id}" id="add-review-link">Add Review</a>
    `;
}

async function submitReview(token, placeId, reviewText) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ review: reviewText })
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
            window.location.href = 'thank_you.html'; // Redirect to thank you page
        }, 2000); // Delay for showing the success message
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

function logoutUser() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = 'index.html';
}
