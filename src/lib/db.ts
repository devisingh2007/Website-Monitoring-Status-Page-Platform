import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Add MONGODB_URI in .env.local");
}

// global me cache, taaki hot reload me connection dobara na bane
let cached = (global as any).mongoose; // bar bar db ko connect karna na pade devlopment esay 
//                                      //? .mongoose bas verible ka name hai jisme ham global me rakh rhe hai 

if (!cached) {
  cached = (global as any).mongoose = { connection: null, promise: null };  // agra global me n mile to ek nya null vala bnana
}

async function connectDB() {
  if (cached.connection) return cached.connection;   // pehle se connected hai to wahi de dega 

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    cached.connection = await cached.promise;
  } catch (error) {
    cached.promise = null;   // fail hua to next try me dobara koshish ho
    throw error;
  }

  return cached.connection;
}

export default connectDB;