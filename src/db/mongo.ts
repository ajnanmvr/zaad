import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

// Use a global cache to survive Next.js HMR in dev
declare global {
    // eslint-disable-next-line no-var
    var _mongooseCache: MongooseCache | undefined;
}

const globalCache: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = globalCache;

const ensureModelsLoaded = () => {
    try {
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

    // If already connected, return immediately
    if (globalCache.conn && mongoose.connection.readyState === 1) {
        return globalCache.conn;
    }

    // If a connection is in progress, await it
    if (mongoose.connection.readyState === 2 && globalCache.promise) {
        globalCache.conn = await globalCache.promise;
        ensureModelsLoaded();
        return globalCache.conn;
    }

    // Start a new connection if needed
    if (!globalCache.promise) {
        const opts = { bufferCommands: false } as const;
        globalCache.promise = mongoose.connect(MONGO_URI, opts);
    }

    try {
        globalCache.conn = await globalCache.promise;
        ensureModelsLoaded();
    } catch (e) {
        globalCache.promise = null;
        throw e;
    }

    return globalCache.conn;
}

export default connect;
