// Destinations Management JavaScript

async function loadDestinations() {
    if (!authToken) return;

    try {
        const destinations = await apiRequest('/destinations');
        displayDestinations(destinations);
        updateDestinationCount(destinations.length);
    } catch (error) {
        console.error('Failed to load destinations:', error);
    }
}

function displayDestinations(destinations) {
    const container = document.getElementById('destinationsList');
    
    if (destinations.length === 0) {
        container.innerHTML = `
            <div class="destination-card">
                <div class="card-icon">
                    <i class="fas fa-map"></i>
                </div>
                <h3>No destinations yet</h3>
                <p>Add your first travel destination to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = destinations.map(dest => `
        <div class="destination-card">
            <div class="destination-actions">
                <button class="btn btn-danger" onclick="removeDestination('${dest._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="card-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <h3>${dest.name}</h3>
            <p>${dest.country}</p>
            <p><small>Lat: ${dest.latitude}, Lng: ${dest.longitude}</small></p>
            <button class="btn btn-outline" onclick="getDestinationWeather('${dest.name}', '${dest.country}')">
                <i class="fas fa-cloud-sun"></i> Check Weather
            </button>
        </div>
    `).join('');
}

async function handleAddDestination(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('destName').value,
        country: document.getElementById('destCountry').value,
        latitude: parseFloat(document.getElementById('destLat').value),
        longitude: parseFloat(document.getElementById('destLng').value)
    };

    showLoading();
    try {
        await apiRequest('/destinations', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showToast('Destination added successfully!', 'success');
        closeModal('addDestinationModal');
        loadDestinations();
        document.getElementById('addDestinationForm').reset();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function removeDestination(id) {
    if (!confirm('Are you sure you want to remove this destination?')) return;

    showLoading();
    try {
        await apiRequest(`/destinations/${id}`, {
            method: 'DELETE'
        });

        showToast('Destination removed successfully!', 'success');
        loadDestinations();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function getDestinationWeather(city, country) {
    document.getElementById('weatherCity').value = city;
    document.getElementById('weatherCountry').value = country;
    switchTab('weather');
    setTimeout(() => {
        document.getElementById('weatherForm').dispatchEvent(new Event('submit'));
    }, 100);
}

// Make functions globally available
window.loadDestinations = loadDestinations;
window.removeDestination = removeDestination;
window.getDestinationWeather = getDestinationWeather;