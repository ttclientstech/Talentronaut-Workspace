#!/usr/bin/env node

/**
 * Fix Arom's Admin Role
 * This script makes Arom an Admin in the PrimeLink organization
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const organizationSchema = new mongoose.Schema({}, { strict: false, collection: 'organizations' });

async function fixAromRole() {
  console.log('🔧 Fixing Arom\'s Admin Role in PrimeLink\n');
  console.log('================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', userSchema);
    const Organization = mongoose.model('Organization', organizationSchema);

    // Find Arom
    const arom = await User.findOne({ email: 'aromclubin@gmail.com' });

    if (!arom) {
      console.log('❌ Arom not found in database');
      return;
    }

    console.log(`👤 Found user: ${arom.name} (${arom.email})`);
    console.log(`   Current User Role: ${arom.role}`);
    console.log(`   Current organizationId: ${arom.organizationId}`);
    console.log(`   Current currentOrganizationId: ${arom.currentOrganizationId}\n`);

    // Find PrimeLink organization
    const primelink = await Organization.findOne({ name: 'PrimeLink' });

    if (!primelink) {
      console.log('❌ PrimeLink organization not found');
      return;
    }

    console.log(`🏢 Found organization: ${primelink.name} (${primelink._id})\n`);

    // Find Arom's membership in the organization
    const memberIndex = primelink.members.findIndex(
      m => m.userId.toString() === arom._id.toString()
    );

    if (memberIndex === -1) {
      console.log('❌ Arom is not a member of PrimeLink');
      return;
    }

    const currentOrgRole = primelink.members[memberIndex].role;
    console.log(`   Arom's current role in PrimeLink: ${currentOrgRole}\n`);

    if (currentOrgRole === 'Admin') {
      console.log('✅ Arom is already an Admin in the organization!');
      console.log('   The issue might be with the JWT token.');
      console.log('   → Tell Arom to LOG OUT and LOG IN again to refresh their token\n');
      return;
    }

    // Update Arom's role in the organization
    console.log('🔧 Updating Arom to Admin in PrimeLink organization...');
    primelink.members[memberIndex].role = 'Admin';
    await primelink.save();
    console.log('✅ Updated organization membership to Admin\n');

    // Update Arom's user record
    console.log('🔧 Updating Arom\'s user record...');
    arom.role = 'Admin';

    // Update organizations array if it exists
    if (arom.organizations && Array.isArray(arom.organizations)) {
      const orgIndex = arom.organizations.findIndex(
        o => o.organizationId.toString() === primelink._id.toString()
      );

      if (orgIndex !== -1) {
        arom.organizations[orgIndex].role = 'Admin';
        console.log('✅ Updated organizations array role to Admin');
      }
    }

    await arom.save();
    console.log('✅ Updated user record\n');

    console.log('================================================');
    console.log('✅ FIX COMPLETE!');
    console.log('');
    console.log('IMPORTANT: Tell Arom to:');
    console.log('1. LOG OUT from the application');
    console.log('2. LOG IN again');
    console.log('3. This will refresh their JWT token with Admin role');
    console.log('4. After login, they should see pending requests');
    console.log('================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the fix
fixAromRole().catch(console.error);
