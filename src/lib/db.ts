import mongoose from "mongoose";

const mongodbUri = process.env.MONGODB_URI as string;

if (!mongodbUri) {
  throw new Error("MONGODB_URI is not configured.");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = cache;
}

export async function connectDatabase() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongodbUri);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
