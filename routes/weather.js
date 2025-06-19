const express = require('express');
const axios = require('axios');
const { WeatherCache } = require('../models');
const { validateCityName } = require('../middleware/validation');

const router = express.Router();

// Get current weather for a city with MongoDB caching
router.get('/:city/:country?', validateCityName, async (req, res) => {
    try {
        const { city, country } = req.params;
        const cityName = city.trim();
        const countryCode = country ? country.trim() : '';

        // Check cache first
        const cachedWeather = await WeatherCache.findOne({
            city: { $regex: new RegExp(`^${cityName}$`, 'i') },
            country: countryCode ? { $regex: new RegExp(`^${countryCode}$`, 'i') } : { $exists: true },
            expiresAt: { $gt: new Date() }
        });

        if (cachedWeather && cachedWeather.currentWeather) {
            return res.json({
                city: cachedWeather.city,
                country: cachedWeather.country,
                temperature: cachedWeather.currentWeather.temperature,
                description: cachedWeather.currentWeather.description,
                humidity: cachedWeather.currentWeather.humidity,
                windSpeed: cachedWeather.currentWeather.windSpeed,
                icon: cachedWeather.currentWeather.icon,
                cached: true,
                lastUpdated: cachedWeather.cachedAt
            });
        }

        // Check for API key
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'API key not configured',
                message: 'OpenWeatherMap API key is missing. Please add OPENWEATHER_API_KEY to your .env file.',
                setup: 'Get your free API key from: https://openweathermap.org/api'
            });
        }

        // Fetch from OpenWeatherMap API
        const query = countryCode ? `${cityName},${countryCode}` : cityName;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;
        
        console.log(`Fetching weather for: ${query}`);
        const weatherResponse = await axios.get(weatherUrl, {
            timeout: 10000
        });

        const weatherData = weatherResponse.data;

        const currentWeather = {
            temperature: Math.round(weatherData.main.temp),
            feelsLike: Math.round(weatherData.main.feels_like),
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            windSpeed: weatherData.wind.speed,
            windDirection: weatherData.wind.deg,
            description: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            visibility: weatherData.visibility
        };

        // Cache for 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        
        await WeatherCache.findOneAndUpdate(
            {
                city: { $regex: new RegExp(`^${cityName}$`, 'i') },
                country: { $regex: new RegExp(`^${weatherData.sys.country}$`, 'i') }
            },
            {
                city: weatherData.name,
                country: weatherData.sys.country,
                coordinates: {
                    lat: weatherData.coord.lat,
                    lon: weatherData.coord.lon
                },
                currentWeather,
                cachedAt: new Date(),
                expiresAt
            },
            { upsert: true, new: true }
        );

        res.json({
            city: weatherData.name,
            country: weatherData.sys.country,
            temperature: currentWeather.temperature,
            description: currentWeather.description,
            humidity: currentWeather.humidity,
            windSpeed: currentWeather.windSpeed,
            icon: currentWeather.icon,
            cached: false,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('Weather fetch error:', error.message);

        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                error: 'City not found',
                message: 'The specified city could not be found. Please check the city name and try again.'
            });
        }

        if (error.response && error.response.status === 401) {
            return res.status(500).json({
                error: 'Invalid API key',
                message: 'OpenWeatherMap API key is invalid. Please check your OPENWEATHER_API_KEY in .env file.',
                setup: 'Get your free API key from: https://openweathermap.org/api'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch weather data',
            message: error.message
        });
    }
});

module.exports = router;