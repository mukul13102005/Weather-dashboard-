const apiKey = '1009b764db797c5d21f78cb095644e14'; // OpenWeatherMap API key
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const cityInput = document.getElementById('cityInput');
const recentSearchesList = document.getElementById('recentSearches');

// Initialize with default city
window.addEventListener('DOMContentLoaded', () => {
    getWeatherData('Delhi');
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
});

// Search by city name
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        addToRecentSearches(city);
        cityInput.value = '';
    }
});

// Search by current location
locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                alert('Location access denied. Please enable location services or search by city name.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

// Get weather by city name
async function getWeatherData(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=hi`
        );
        
        if (!response.ok) {
            throw new Error('शहर नहीं मिला। कृपया सही नाम लिखें।');
        }
        
        const data = await response.json();
        displayCurrentWeather(data);
        getForecast(data.coord.lat, data.coord.lon);
    } catch (error) {
        alert(error.message);
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=hi`
        );
        
        const data = await response.json();
        displayCurrentWeather(data);
        getForecast(lat, lon);
        addToRecentSearches(data.name);
    } catch (error) {
        alert('मौसम डेटा प्राप्त करने में त्रुटि: ' + error.message);
    }
}

// Get 5-day forecast
async function getForecast(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=hi`
        );
        
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

// Display current weather
function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weatherDesc').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `नमी: ${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `हवा: ${data.wind.speed} km/h`;
    document.getElementById('feelsLike').textContent = `अनुभव: ${Math.round(data.main.feels_like)}°C`;
    
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weatherIcon').innerHTML = `<img src="${iconUrl}" alt="${data.weather[0].main}" class="animate__animated animate__fadeIn">`;
    
    // Change background based on weather
    changeBackground(data.weather[0].main);
}

// Display 5-day forecast
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    // We get data for every 3 hours, so we take one reading per day (at 12:00 PM)
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    dailyForecasts.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('hi-IN', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item animate__animated animate__fadeInUp';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].main}">
            <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
            <div class="forecast-desc">${day.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    document.getElementById('dateTime').textContent = now.toLocaleDateString('hi-IN', options);
}

// Add to recent searches
function addToRecentSearches(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    
    // Remove if already exists
    recentSearches = recentSearches.filter(item => item !== city);
    
    // Add to beginning
    recentSearches.unshift(city);
    
    // Keep only last 5 searches
    if (recentSearches.length > 5) {
        recentSearches.pop();
    }
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    updateRecentSearchesList();
}

// Update recent searches list
function updateRecentSearchesList() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    recentSearchesList.innerHTML = '';
    
    recentSearches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => {
            getWeatherData(city);
        });
        recentSearchesList.appendChild(li);
    });
}

// Change background based on weather
function changeBackground(weatherCondition) {
    const mainContent = document.querySelector('.main-content');
    
    // Remove all weather classes
    mainContent.classList.remove(
        'sunny-bg', 'cloudy-bg', 'rainy-bg', 
        'snowy-bg', 'thunderstorm-bg', 'night-bg'
    );
    
    // Add appropriate class
    switch(weatherCondition.toLowerCase()) {
        case 'clear':
            const hours = new Date().getHours();
            if (hours > 18 || hours < 6) {
                mainContent.classList.add('night-bg');
            } else {
                mainContent.classList.add('sunny-bg');
            }
            break;
        case 'clouds':
            mainContent.classList.add('cloudy-bg');
            break;
        case 'rain':
        case 'drizzle':
            mainContent.classList.add('rainy-bg');
            break;
        case 'snow':
            mainContent.classList.add('snowy-bg');
            break;
        case 'thunderstorm':
            mainContent.classList.add('thunderstorm-bg');
            break;
        default:
            // Default background
    }
}