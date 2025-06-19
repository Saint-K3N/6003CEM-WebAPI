const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    country: String,
    coordinates: {
        lat: Number,
        lon: Number
    },
    currentWeather: {
        temperature: Number,
        feelsLike: Number,
        humidity: Number,
        pressure: Number,
        windSpeed: Number,
        windDirection: Number,
        description: String,
        icon: String,
        visibility: Number
    },
    forecast: [{
        date: Date,
        maxTemp: Number,
        minTemp: Number,
        humidity: Number,
        precipitation: Number,
        windSpeed: Number,
        description: String,
        icon: String
    }],
    cachedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 60 * 1000)
    }
});

weatherCacheSchema.index({ city: 1, expiresAt: 1 });

module.exports = mongoose.models.WeatherCache || mongoose.model('WeatherCache', weatherCacheSchema);
