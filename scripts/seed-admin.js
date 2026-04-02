import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../src/modules/users/user.model.js';

// Improve reliability for MongoDB SRV lookups on networks with unstable default DNS.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return undefined;
}

function getMongoUri() {
  const fromArg = getArgValue('--uri');
  return fromArg || process.env.MONGODB_URI;
}

async function run() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.error('MONGODB_URI is missing. Set it in .env or pass --uri "<mongo-uri>"');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@jobloom.com',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+94770000000',
      location: {
        village: 'Colombo Central',
        district: 'Colombo',
        province: 'Western',
      },
      isVerified: true,
      isActive: true,
    };

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log(`Admin user with email ${adminData.email} already exists.`);
      // Update role to admin just in case
      existing.role = 'admin';
      await existing.save();
      console.log('Ensure role is set to admin.');
    } else {
      const admin = new User(adminData);
      await admin.save();
      console.log(`Admin user created: ${adminData.email} / ${adminData.password}`);
    }
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
