// Validation middleware for different routes

const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];
    
    // Username validation
    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (username && username.length > 30) {
        errors.push('Username must be less than 30 characters');
    }
    
    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Please provide a valid email address');
    }
    
    // Password validation
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            messages: errors
        });
    }
    
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
    }
    
    if (!password) {
        errors.push('Password is required');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            messages: errors
        });
    }
    
    next();
};

const validateTravelPlan = (req, res, next) => {
    const { planName, cities, startDate, endDate } = req.body;
    const errors = [];
    
    // Plan name validation
    if (!planName || planName.trim().length === 0) {
        errors.push('Plan name is required');
    }
    
    if (planName && planName.length > 100) {
        errors.push('Plan name must be less than 100 characters');
    }
    
    // Cities validation
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
        errors.push('At least one city is required');
    }
    
    if (cities && cities.length > 10) {
        errors.push('Maximum 10 cities allowed per plan');
    }
    
    // Date validation
    if (!startDate) {
        errors.push('Start date is required');
    }
    
    if (!endDate) {
        errors.push('End date is required');
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            errors.push('End date must be after start date');
        }
        
        if (start < new Date()) {
            errors.push('Start date cannot be in the past');
        }
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            messages: errors
        });
    }
    
    next();
};

const validateCityName = (req, res, next) => {
    const { city } = req.params;
    
    if (!city || city.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid city name',
            message: 'City name is required'
        });
    }
    
    if (city.length > 50) {
        return res.status(400).json({
            error: 'Invalid city name',
            message: 'City name is too long'
        });
    }
    
    next();
};

const validateCurrencyCode = (req, res, next) => {
    const { from, to } = req.params;
    const currencyRegex = /^[A-Z]{3}$/;
    
    if (!from || !currencyRegex.test(from.toUpperCase())) {
        return res.status(400).json({
            error: 'Invalid currency code',
            message: 'Source currency must be a valid 3-letter code (e.g., USD)'
        });
    }
    
    if (!to || !currencyRegex.test(to.toUpperCase())) {
        return res.status(400).json({
            error: 'Invalid currency code',
            message: 'Target currency must be a valid 3-letter code (e.g., EUR)'
        });
    }
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateTravelPlan,
    validateCityName,
    validateCurrencyCode
};
