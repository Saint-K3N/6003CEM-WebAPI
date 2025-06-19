// Weather JavaScript

async function handleWeatherSearch(e) {
    e.preventDefault();
    const city = document.getElementById('weatherCity').value;
    const country = document.getElementById('weatherCountry').value;

    showLoading();
    try {
        const endpoint = country ? `/weather/${city}/${country}` : `/weather/${city}`;
        const weather = await apiRequest(endpoint);
        displayWeather(weather);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayWeather(weather) {
    const resultDiv = document.getElementById('weatherResult');
    const iconClass = getWeatherIcon(weather.icon);
    
    resultDiv.innerHTML = `
        <div class="weather-card">
            <div class="weather-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="weather-info">
                <h3>${weather.city}, ${weather.country}</h3>
                <p>${weather.description}</p>
                <p><strong>Humidity:</strong> ${weather.humidity}%</p>
                <p><strong>Wind Speed:</strong> ${weather.windSpeed} m/s</p>
                ${weather.cached ? '<p><small>Cached data</small></p>' : ''}
            </div>
            <div class="weather-temp">
                ${weather.temperature}°C
            </div>
        </div>
    `;
    resultDiv.style.display = 'block';
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-clouds',
        '04n': 'fas fa-clouds',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    return iconMap[iconCode] || 'fas fa-cloud';
}

// Make functions globally available
window.handleWeatherSearch = handleWeatherSearch;
