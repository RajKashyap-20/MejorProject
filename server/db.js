import mongoose from "mongoose";

const cache = globalThis.__acadlinkMongoose ?? {
  connection: null,
  promise: null,
};

globalThis.__acadlinkMongoose = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error("MONGODB_URI is not configured.");
    error.code = "MONGODB_URI_MISSING";
    throw error;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    }).then((connection) => connection).catch((error) => {
      cache.promise = null;
      throw error;
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
