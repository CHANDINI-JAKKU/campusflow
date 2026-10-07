import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js SRV resolution for MongoDB Atlas on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if not permitted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusflow', {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed (${err.message}). Attempting local fallback...`);
    try {
      const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/campusflow');
      console.log(`✅ MongoDB local fallback connected: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackErr) {
      console.error(`❌ MongoDB connection failed completely:`, err.message);
      throw err;
    }
  }
};

export default connectDB;
