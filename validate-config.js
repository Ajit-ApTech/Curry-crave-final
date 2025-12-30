#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Validating MongoDB Configuration...\n');

const validateMongoURI = () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ MONGO_URI is not set in .env file\n');
        console.log('📝 Quick fix:');
        console.log('   1. Make sure you have a .env file');
        console.log('   2. Add this line to your .env:');
        console.log('      MONGO_URI=your-connection-string-here\n');
        return false;
    }

    console.log('✅ MONGO_URI is set\n');
    console.log('🔍 Analyzing connection string...\n');

    // Check if it's Atlas or local
    if (uri.includes('mongodb+srv://')) {
        console.log('📡 Type: MongoDB Atlas (Cloud)');

        // Extract components
        const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
        if (match) {
            const [, username, password, cluster, database] = match;
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${'*'.repeat(Math.min(password.length, 20))}`);
            console.log(`   Cluster: ${cluster}`);
            console.log(`   Database: ${database || 'default'}\n`);

            // Check for common issues
            if (password.includes('<') || password.includes('>')) {
                console.warn('⚠️  Warning: Password contains < or >');
                console.log('   Make sure to replace <password> with your actual password!\n');
                return false;
            }

            // Check for special characters
            const specialChars = ['@', '#', '$', '%', '&', '+', '=', '/', '\\', ' '];
            const hasSpecialChars = specialChars.some(char => password.includes(char));

            if (hasSpecialChars && !password.match(/%[0-9A-F]{2}/)) {
                console.warn('⚠️  Warning: Password may need URL encoding');
                console.log('   Special characters should be URL encoded:');
                console.log('   @ → %40, # → %23, $ → %24, etc.\n');
            }
        }
    } else if (uri.includes('mongodb://localhost') || uri.includes('mongodb://127.0.0.1')) {
        console.log('💻 Type: Local MongoDB');
        const dbName = uri.split('/').pop().split('?')[0];
        console.log(`   Database: ${dbName || 'default'}\n`);

        console.log('📝 Make sure MongoDB is running locally:');
        console.log('   brew services start mongodb-community\n');
    } else {
        console.warn('⚠️  Unusual connection string format');
        console.log('   Expected: mongodb+srv://... (Atlas) or mongodb://localhost:27017/... (Local)\n');
    }

    // Check other required env variables
    console.log('🔍 Checking other environment variables...\n');

    const requiredVars = ['PORT', 'JWT_SECRET', 'NODE_ENV'];
    const missingVars = [];

    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName} is set`);
        } else {
            console.log(`⚠️  ${varName} is not set (optional but recommended)`);
            missingVars.push(varName);
        }
    });

    console.log('\n✨ Configuration check complete!\n');

    if (missingVars.length === 0) {
        console.log('🎉 All required variables are set!');
        console.log('   Next step: Run "npm run test-db" to test the connection\n');
    } else {
        console.log('💡 Tip: Check .env.example for all recommended variables\n');
    }

    return true;
};

validateMongoURI();
