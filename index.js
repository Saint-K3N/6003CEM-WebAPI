const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection and models
const { connectDB } = require('./connect');

// Import routes
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const currencyRoutes = require('./routes/currency');
const travelPlanRoutes = require('./routes/travelPlans');
const countriesRoutes = require('./routes/countries');
const attractionsRoutes = require('./routes/attractions');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment variable checks
function checkEnvironmentVariables() {
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
    const optionalVars = ['OPENWEATHER_API_KEY', 'FOURSQUARE_API_KEY'];
    
    console.log('\n🔍 Checking environment variables...');
    
    let missingRequired = [];
    let missingOptional = [];
    
    // Check required variables
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missingRequired.push(varName);
        } else {
            console.log(`✅ ${varName}: Configured`);
        }
    });
    
    // Check optional variables
    optionalVars.forEach(varName => {
        if (!process.env[varName]) {
            missingOptional.push(varName);
        } else {
            console.log(`✅ ${varName}: Configured`);
        }
    });
    
    if (missingRequired.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missingRequired.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.log('\n📝 Please copy .env.example to .env and fill in the required values');
        process.exit(1);
    }
    
    if (missingOptional.length > 0) {
        console.warn('\n⚠️  Missing optional environment variables:');
        missingOptional.forEach(varName => {
            console.warn(`   - ${varName} (app will use mock data)`);
        });
        console.log('\n💡 Add these API keys to .env for full functionality');
    }
    
    console.log('✅ Environment check complete\n');
}

// Check environment before starting
checkEnvironmentVariables();

// Connect to database
connectDB();

// Security middleware - COMPLETELY DISABLE CSP for development
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000', 'http://localhost:5173'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes - Define these BEFORE static files
app.use('/api/auth', authRoutes);
app.use('/api/travel-plans', travelPlanRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/attractions', attractionsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/currency', currencyRoutes);

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Travel Companion API',
        version: '2.0.0',
        description: 'A comprehensive travel companion API with country data, attractions, weather, and currency conversion',
        status: 'active',
        environment: {
            node_env: process.env.NODE_ENV || 'development',
            mongodb: process.env.MONGODB_URI ? 'configured' : 'missing',
            jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing',
            openweather_api: process.env.OPENWEATHER_API_KEY ? 'configured' : 'missing (using mock data)',
            foursquare_api: process.env.FOURSQUARE_API_KEY ? 'configured' : 'missing (using mock data)',
            exchange_api: 'free API (no key required)'
        },
        endpoints: {
            authentication: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Login user with email',
                'POST /api/auth/login-username': 'Login user with username',
                'GET /api/auth/profile': 'Get user profile (requires auth)',
                'PUT /api/auth/profile': 'Update user profile (requires auth)'
            },
            travelPlans: {
                'GET /api/travel-plans': 'Get user travel plans (requires auth)',
                'POST /api/travel-plans': 'Create new travel plan (requires auth)',
                'GET /api/travel-plans/:id': 'Get specific travel plan (requires auth)',
                'PUT /api/travel-plans/:id': 'Update travel plan (requires auth)',
                'DELETE /api/travel-plans/:id': 'Delete travel plan (requires auth)',
                'POST /api/travel-plans/:id/attractions': 'Add attraction to plan (requires auth)',
                'DELETE /api/travel-plans/:id/attractions/:attractionId': 'Remove attraction from plan (requires auth)'
            },
            countries: {
                'GET /api/countries': 'Get all countries from REST Countries API',
                'GET /api/countries/:code': 'Get specific country details'
            },
            attractions: {
                'GET /api/attractions/:country/:city?': 'Get attractions for country/city from Foursquare API',
                'GET /api/attractions/details/:attractionId': 'Get detailed attraction information'
            },
            weather: {
                'GET /api/weather/:city/:country?': 'Get current weather for a city'
            },
            currency: {
                'POST /api/currency/convert': 'Convert amount between currencies'
            }
        },
        features: [
            'User authentication with JWT',
            'Travel plan management with country selection',
            'Real-time attraction data from Foursquare API',
            'Country information from REST Countries API',
            'Real-time weather data with caching',
            'Currency conversion with free APIs',
            'MongoDB data persistence with caching',
            'Rate limiting and security',
            'Graceful fallback to mock data when APIs unavailable'
        ],
        apis_used: [
            'Foursquare Places API (attractions)',
            'REST Countries API (country data)',
            'OpenWeatherMap API (weather)',
            'Open Exchange Rates API (currency - no key required)'
        ],
        setup_instructions: {
            environment_file: 'Copy .env.example to .env and configure your API keys',
            required_keys: ['MONGODB_URI', 'JWT_SECRET'],
            optional_keys: ['OPENWEATHER_API_KEY', 'FOURSQUARE_API_KEY'],
            api_key_sources: {
                mongodb: 'https://cloud.mongodb.com/',
                openweather: 'https://openweathermap.org/api',
                foursquare: 'https://developer.foursquare.com/'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Serve static files and frontend
app.use(express.static(path.join(__dirname)));

// Serve frontend at root - This should be AFTER API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.MONGODB_URI ? 'MongoDB Atlas Configured' : 'MongoDB URI Missing',
        apis: {
            weather: process.env.OPENWEATHER_API_KEY ? 'OpenWeather API Ready' : 'Mock Weather Data',
            attractions: process.env.FOURSQUARE_API_KEY ? 'Foursquare API Ready' : 'Mock Attraction Data',
            currency: 'Free Exchange Rate API Ready',
            countries: 'REST Countries API Ready'
        },
        features: ['Weather API', 'Currency API', 'User Auth', 'Travel Plans', 'Countries API', 'Attractions API']
    });
});

// 404 handler
app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            error: 'Route not found',
            message: 'The requested endpoint does not exist',
            availableEndpoints: '/api/auth, /api/travel-plans, /api/countries, /api/attractions, /api/weather, /api/currency',
            documentation: '/api'
        });
    } else {
        // For non-API routes, serve the main HTML file (SPA behavior)
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            messages: errors
        });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            error: 'Duplicate Error',
            message: `${field} already exists`
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Please provide a valid authentication token'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Travel Companion API running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'NOT CONFIGURED'}`);
    console.log(`🎯 Frontend: http://localhost:${PORT}`);
    
    if (!process.env.OPENWEATHER_API_KEY || !process.env.FOURSQUARE_API_KEY) {
        console.log(`\n📋 Setup Instructions:`);
        console.log(`   1. Copy .env.example to .env`);
        console.log(`   2. Get OpenWeather API key: https://openweathermap.org/api`);
        console.log(`   3. Get Foursquare API key: https://developer.foursquare.com/`);
        console.log(`   4. Add API keys to your .env file`);
        console.log(`   5. Restart the server`);
        console.log(`\n💡 App will work with mock data until API keys are configured`);
    }
});

module.exports = app;