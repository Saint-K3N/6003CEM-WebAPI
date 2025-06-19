const mongoose = require('mongoose');

const attractionsCacheSchema = new mongoose.Schema({
    country: String,
    city: String,
    searchQuery: String,
    attractions: [{
        fsq_id: String,
        name: String,
        categories: [{
            id: Number,
            name: String,
            icon: {
                prefix: String,
                suffix: String
            }
        }],
        location: {
            address: String,
            locality: String,
            region: String,
            country: String,
            postcode: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        distance: Number,
        rating: Number,
        price: Number,
        website: String,
        tel: String,
        email: String,
        photos: [{
            prefix: String,
            suffix: String,
            width: Number,
            height: Number
        }],
        description: String,
        hours: mongoose.Schema.Types.Mixed,
        tips: [String]
    }],
    cachedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
});

attractionsCacheSchema.index({ country: 1, city: 1, expiresAt: 1 });

module.exports = mongoose.models.AttractionsCache || mongoose.model('AttractionsCache', attractionsCacheSchema);
