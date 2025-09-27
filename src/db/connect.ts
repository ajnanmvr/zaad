import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const cached: { connection?: typeof mongoose; promise?: Promise<typeof mongoose> } = {};

// Function to ensure models are properly loaded
const ensureModelsLoaded = () => {
    try {
        // Import models to ensure they're compiled
        require('../models/companies');
        require('../models/employees');
        require('../models/records');
        require('../models/users');
    } catch (error) {
        console.warn('Warning: Could not preload models:', error);
    }
};

async function connect() {
    if (!MONGO_URI) {
        throw new Error('Please define the MONGO_URI environment variable inside .env.local');
    }
    if (cached.connection) {
        return cached.connection;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };
        cached.promise = mongoose.connect(MONGO_URI, opts);
    }
    try {
        cached.connection = await cached.promise;
        // Ensure models are loaded after connection
        ensureModelsLoaded();
    } catch (e) {
        cached.promise = undefined;
        throw e;
    }
    return cached.connection;
}
export default connect;
