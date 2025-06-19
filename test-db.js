const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        
        // Test a simple operation
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);
        
        console.log('Database connection is working!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

testConnection();