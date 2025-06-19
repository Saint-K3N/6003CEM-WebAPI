const mongoose = require('mongoose');
require('dotenv').config();

// Database connection with improved error handling and environment checks
const connectDB = async () => {
    try {
        // Check if MongoDB URI is provided
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in environment variables');
            console.log('📝 Please copy .env.example to .env and fill in your MongoDB connection string');
            console.log('🔗 Get your MongoDB URI from: https://cloud.mongodb.com/');
            process.exit(1);
        }
        
        // Set mongoose options for better connection handling
        mongoose.set('strictQuery', false);
        
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increased timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            retryReads: true
        };

        console.log('🔄 Connecting to MongoDB Atlas...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('📡 Mongoose connected to MongoDB Atlas');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('📴 Mongoose disconnected from MongoDB Atlas');
        });
        
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔚 MongoDB connection closed through app termination');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        
        // Check for common connection issues
        if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
            console.log('\n🔧 Connection Troubleshooting:');
            console.log('1. Check your internet connection');
            console.log('2. Verify MongoDB Atlas cluster is running');
            console.log('3. Check if your IP address is whitelisted in MongoDB Atlas');
            console.log('4. Verify your connection string in .env file');
            console.log('5. Try connecting from MongoDB Compass to test connectivity');
        }
        
        // Don't exit immediately, retry after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(() => {
            connectDB();
        }, 5000);
    }
};

module.exports = { connectDB };