const mongoose = require('mongoose');

const travelPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planName: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
        maxlength: 100
    },
    country: {
        name: { type: String, required: true },
        code: { type: String, required: true },
        capital: String,
        region: String,
        flag: String
    },
    description: {
        type: String,
        maxlength: 500
    },
    selectedAttractions: [{
        attractionId: String,
        name: String,
        category: String,
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        rating: Number,
        priceLevel: Number,
        photoUrl: String,
        website: String,
        phone: String,
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String,
        visitDate: Date,
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        }
    }],
    startDate: Date,
    endDate: Date,
    budget: {
        amount: Number,
        currency: { type: String, default: 'USD' }
    },
    travelers: {
        type: Number,
        default: 1,
        min: 1
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    notes: String,
    status: {
        type: String,
        enum: ['planning', 'confirmed', 'completed', 'cancelled'],
        default: 'planning'
    }
}, {
    timestamps: true
});

travelPlanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.TravelPlan || mongoose.model('TravelPlan', travelPlanSchema);
