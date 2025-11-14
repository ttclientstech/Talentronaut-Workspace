#!/usr/bin/env node

/**
 * Debug Organization Join Requests
 * This script helps diagnose why join requests aren't showing for all admins
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
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
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Define minimal schemas for querying
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const organizationSchema = new mongoose.Schema({}, { strict: false, collection: 'organizations' });
const memberRequestSchema = new mongoose.Schema({}, { strict: false, collection: 'memberrequests' });

async function debugRequests() {
  console.log('🔍 Debugging Organization Join Requests\n');
  console.log('================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', userSchema);
    const Organization = mongoose.model('Organization', organizationSchema);
    const MemberRequest = mongoose.model('MemberRequest', memberRequestSchema);

    // Get all organizations
    const orgs = await Organization.find().lean();
    console.log(`📊 Found ${orgs.length} organizations\n`);

    for (const org of orgs) {
      console.log(`\n🏢 Organization: ${org.name}`);
      console.log(`   ID: ${org._id}`);
      console.log(`   Invite Code: ${org.inviteCode || org.code || 'N/A'}`);
      console.log(`   Admin ID: ${org.adminId}`);

      // Get all admins for this org
      const admins = await User.find({
        $or: [
          { organizationId: org._id, role: 'Admin' },
          { currentOrganizationId: org._id, role: 'Admin' },
          { 'organizations.organizationId': org._id, 'organizations.role': 'Admin' }
        ]
      }).lean();

      console.log(`\n   👥 Admins (${admins.length}):`);
      for (const admin of admins) {
        console.log(`      - ${admin.name} (${admin.email})`);
        console.log(`        User ID: ${admin._id}`);
        console.log(`        organizationId: ${admin.organizationId || 'NOT SET'}`);
        console.log(`        currentOrganizationId: ${admin.currentOrganizationId || 'NOT SET'}`);
        console.log(`        organizations array: ${admin.organizations ? admin.organizations.length : 0} orgs`);

        // Check what this admin would see with current API logic
        const userOrgId = admin.currentOrganizationId || admin.organizationId;
        console.log(`        → API would use org ID: ${userOrgId}`);
        console.log(`        → Matches org? ${String(userOrgId) === String(org._id) ? '✅ YES' : '❌ NO'}`);
        console.log('');
      }

      // Get pending requests for this org
      const requests = await MemberRequest.find({
        organizationId: org._id,
        status: 'pending'
      }).populate('userId', 'name email').lean();

      console.log(`\n   📬 Pending Join Requests (${requests.length}):`);
      if (requests.length > 0) {
        for (const req of requests) {
          const user = req.userId;
          console.log(`      - ${user.name} (${user.email})`);
          console.log(`        Request ID: ${req._id}`);
          console.log(`        Status: ${req.status}`);
          console.log(`        Organization ID: ${req.organizationId}`);
          console.log(`        Requested At: ${req.requestedAt}`);
          console.log('');
        }
      } else {
        console.log('      (No pending requests)');
      }

      console.log('\n   ================================================');
    }

    console.log('\n\n🔍 DIAGNOSIS:\n');

    // Find potential issues
    const usersWithMismatch = await User.find({
      $and: [
        { organizationId: { $exists: true } },
        { currentOrganizationId: { $exists: true } }
      ]
    }).lean();

    for (const user of usersWithMismatch) {
      if (String(user.organizationId) !== String(user.currentOrganizationId)) {
        console.log(`⚠️  User ${user.name} (${user.email}) has mismatched org IDs:`);
        console.log(`   organizationId: ${user.organizationId}`);
        console.log(`   currentOrganizationId: ${user.currentOrganizationId}`);
        console.log('');
      }
    }

    console.log('\n✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the diagnostic
debugRequests().catch(console.error);
