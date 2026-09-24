import mongoose from 'mongoose';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusflow');
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
