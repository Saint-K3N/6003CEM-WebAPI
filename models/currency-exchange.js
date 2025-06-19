const mongoose = require('mongoose');

const currencyExchangeSchema = new mongoose.Schema({
    baseCurrency: {
        type: String,
        required: true,
        uppercase: true
    },
    rates: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 60 * 1000)
    }
});

currencyExchangeSchema.index({ baseCurrency: 1, expiresAt: 1 });

module.exports = mongoose.models.CurrencyExchange || mongoose.model('CurrencyExchange', currencyExchangeSchema);
