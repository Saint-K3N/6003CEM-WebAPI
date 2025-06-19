const mongoose = require('mongoose');

const countryCacheSchema = new mongoose.Schema({
    name: {
        common: String,
        official: String
    },
    code: String,
    capital: [String],
    region: String,
    subregion: String,
    population: Number,
    area: Number,
    flag: String,
    currencies: mongoose.Schema.Types.Mixed,
    languages: mongoose.Schema.Types.Mixed,
    timezones: [String],
    coordinates: {
        lat: Number,
        lng: Number
    },
    cachedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
});

countryCacheSchema.index({ code: 1, expiresAt: 1 });

module.exports = mongoose.models.CountryCache || mongoose.model('CountryCache', countryCacheSchema);
