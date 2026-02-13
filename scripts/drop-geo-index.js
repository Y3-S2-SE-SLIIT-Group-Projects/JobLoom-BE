/**
 * Drop Geospatial Index
 * Run this script to drop the 2dsphere index until Mapbox integration is complete
 *
 * Usage: node scripts/drop-geo-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobloom';

async function dropGeoIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('jobs');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach((index) => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the geospatial index if it exists
    try {
      await collection.dropIndex('location.coordinates_2dsphere');
      console.log('\n✅ Successfully dropped geospatial index: location.coordinates_2dsphere');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('\n✅ Geospatial index not found (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Show remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('\nRemaining indexes:');
    remainingIndexes.forEach((index) => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Done! You can now create jobs without coordinates.');
    console.log('📝 When Mapbox integration is complete, uncomment the index in job.model.js');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

dropGeoIndex();
