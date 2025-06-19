const express = require('express');
const axios = require('axios');
const { CurrencyExchange } = require('../models');

const router = express.Router();

// Convert amount between currencies with MongoDB caching
router.post('/convert', async (req, res) => {
    try {
        const { amount, from, to } = req.body;
        
        if (!amount || !from || !to) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Amount, from currency, and to currency are required'
            });
        }
        
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: 'Amount must be a positive number'
            });
        }
        
        const fromCurrency = from.toUpperCase();
        const toCurrency = to.toUpperCase();
        
        // Check cache first
        const cachedRates = await CurrencyExchange.findOne({
            baseCurrency: fromCurrency,
            expiresAt: { $gt: new Date() }
        });

        let exchangeRate;
        let cached = false;
        
        if (cachedRates && cachedRates.rates[toCurrency]) {
            exchangeRate = cachedRates.rates[toCurrency];
            cached = true;
            console.log(`Using cached exchange rate: 1 ${fromCurrency} = ${exchangeRate} ${toCurrency}`);
        } else {
            console.log(`Fetching fresh exchange rates for ${fromCurrency}`);
            
            // Use completely free API from exchangerate-api.com (no key required)
            const exchangeUrl = `https://open.er-api.com/v6/latest/${fromCurrency}`;
            const response = await axios.get(exchangeUrl, {
                timeout: 10000
            });
            
            if (response.data.result !== 'success') {
                return res.status(400).json({
                    error: 'Invalid currency',
                    message: 'One or both currency codes are invalid'
                });
            }
            
            const rates = response.data.rates;
            exchangeRate = rates[toCurrency];
            
            if (!exchangeRate) {
                return res.status(400).json({
                    error: 'Currency not found',
                    message: `Exchange rate for ${toCurrency} not available`
                });
            }
            
            // Cache the rates for 1 hour
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            
            await CurrencyExchange.findOneAndUpdate(
                { baseCurrency: fromCurrency },
                {
                    baseCurrency: fromCurrency,
                    rates: rates,
                    lastUpdated: new Date(),
                    expiresAt
                },
                { upsert: true, new: true }
            );
            
            console.log(`Cached new exchange rates for ${fromCurrency}`);
        }
        
        const convertedAmount = (amount * exchangeRate).toFixed(2);
        
        res.json({
            from: fromCurrency,
            to: toCurrency,
            amount: parseFloat(amount),
            rate: exchangeRate,
            convertedAmount: parseFloat(convertedAmount),
            timestamp: new Date().toISOString(),
            cached
        });
        
    } catch (error) {
        console.error('Currency conversion error:', error.message);
        
        if (error.response && error.response.status === 404) {
            return res.status(400).json({
                error: 'Invalid currency code',
                message: 'One or both currency codes are not supported'
            });
        }
        
        res.status(500).json({
            error: 'Failed to convert currency',
            message: 'Unable to fetch exchange rates at the moment. Please try again later.'
        });
    }
});

module.exports = router;