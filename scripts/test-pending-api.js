#!/usr/bin/env node

/**
 * Test Pending Requests API
 * This script directly queries the database to see what should be returned
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
const memberRequestSchema = new mongoose.Schema({}, { strict: false, collection: 'memberrequests' });

async function testPendingAPI() {
  console.log('🧪 Testing Pending Requests API Logic\n');
  console.log('================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', userSchema);
    const Organization = mongoose.model('Organization', organizationSchema);
    const MemberRequest = mongoose.model('MemberRequest', memberRequestSchema);

    // Get all users
    const allUsers = await User.find().select('name email role organizationId currentOrganizationId').lean();

    console.log('👥 ALL USERS IN DATABASE:\n');
    for (const user of allUsers) {
      console.log(`   ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}`);
      console.log(`      organizationId: ${user.organizationId || 'NOT SET'}`);
      console.log(`      currentOrganizationId: ${user.currentOrganizationId || 'NOT SET'}`);

      // Simulate API logic
      const userOrgId = user.currentOrganizationId || user.organizationId;
      console.log(`      → API would use: ${userOrgId || 'NONE'}`);

      if (userOrgId && (user.role === 'Admin' || user.role === 'Lead')) {
        console.log(`      → This user CAN view pending requests`);

        // Query pending requests like the API does
        const pendingRequests = await MemberRequest.find({
          organizationId: userOrgId,
          status: 'pending'
        }).lean();

        console.log(`      → Would see ${pendingRequests.length} pending request(s):`);
        for (const req of pendingRequests) {
          const reqUser = await User.findById(req.userId).select('name email').lean();
          console.log(`         - ${reqUser?.name} (${reqUser?.email}) - Requested: ${req.requestedAt}`);
        }
      } else {
        console.log(`      → Cannot view requests (not Admin/Lead or no org)`);
      }
      console.log('');
    }

    // Show all organizations
    console.log('\n🏢 ALL ORGANIZATIONS:\n');
    const allOrgs = await Organization.find().lean();
    for (const org of allOrgs) {
      console.log(`   ${org.name} (ID: ${org._id})`);
      console.log(`      Invite Code: ${org.inviteCode || org.code}`);
      console.log(`      Admin ID: ${org.adminId}`);
      console.log(`      Members: ${org.members ? org.members.length : 0}`);

      if (org.members) {
        for (const member of org.members) {
          const memberUser = await User.findById(member.userId).select('name email').lean();
          console.log(`         - ${memberUser?.name} (${member.role}) - Status: ${member.status || 'active'}`);
        }
      }
      console.log('');
    }

    // Show all pending requests
    console.log('\n📬 ALL PENDING REQUESTS:\n');
    const allRequests = await MemberRequest.find({ status: 'pending' }).lean();

    if (allRequests.length === 0) {
      console.log('   ❌ NO PENDING REQUESTS FOUND IN DATABASE!\n');
      console.log('   This means:');
      console.log('   1. The request was never created');
      console.log('   2. The request was already approved/rejected');
      console.log('   3. The request is in a different collection\n');
    } else {
      for (const req of allRequests) {
        const reqUser = await User.findById(req.userId).select('name email').lean();
        console.log(`   Request ID: ${req._id}`);
        console.log(`      User: ${reqUser?.name} (${reqUser?.email})`);
        console.log(`      Organization ID: ${req.organizationId}`);
        console.log(`      Status: ${req.status}`);
        console.log(`      Requested At: ${req.requestedAt}`);
        console.log('');

        // Find which admins should see this
        const org = await Organization.findById(req.organizationId).lean();
        if (org) {
          console.log(`      → Requesting to join: ${org.name}`);

          // Find all admins who should see this
          const adminsWhoCanSee = await User.find({
            $or: [
              { organizationId: req.organizationId, role: { $in: ['Admin', 'Lead'] } },
              { currentOrganizationId: req.organizationId, role: { $in: ['Admin', 'Lead'] } }
            ]
          }).select('name email').lean();

          console.log(`      → Should be visible to ${adminsWhoCanSee.length} admin(s):`);
          for (const admin of adminsWhoCanSee) {
            console.log(`         - ${admin.name} (${admin.email})`);
          }
        }
        console.log('\n   ================================================\n');
      }
    }

    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the test
testPendingAPI().catch(console.error);
