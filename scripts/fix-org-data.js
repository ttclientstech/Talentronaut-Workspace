#!/usr/bin/env node

/**
 * Fix Organization Data Script
 * This script fixes users who don't have correct currentOrganizationId set
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

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const organizationSchema = new mongoose.Schema({}, { strict: false, collection: 'organizations' });

async function fixOrgData() {
  console.log('🔧 Fixing Organization Data...\n');
  console.log('================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', userSchema);
    const Organization = mongoose.model('Organization', organizationSchema);

    // Get all organizations
    const orgs = await Organization.find().lean();
    console.log(`📊 Found ${orgs.length} organizations\n`);

    let fixedUsers = 0;

    for (const org of orgs) {
      console.log(`\n🏢 Processing Organization: ${org.name} (${org._id})\n`);

      // Get all members from the organization's members array
      const memberUserIds = (org.members || []).map(m => m.userId);

      console.log(`   Found ${memberUserIds.length} members in organization.members array\n`);

      // Check each member's user record
      for (const userId of memberUserIds) {
        const user = await User.findById(userId);

        if (!user) {
          console.log(`   ⚠️  User ${userId} not found in database`);
          continue;
        }

        console.log(`   👤 Checking user: ${user.name} (${user.email})`);
        console.log(`      organizationId: ${user.organizationId || 'NOT SET'}`);
        console.log(`      currentOrganizationId: ${user.currentOrganizationId || 'NOT SET'}`);

        let needsUpdate = false;
        const updates = {};

        // Fix missing currentOrganizationId
        if (!user.currentOrganizationId) {
          updates.currentOrganizationId = org._id;
          needsUpdate = true;
          console.log(`      ✏️  Will set currentOrganizationId to: ${org._id}`);
        }

        // Fix missing organizationId (for backward compatibility)
        if (!user.organizationId) {
          updates.organizationId = org._id;
          needsUpdate = true;
          console.log(`      ✏️  Will set organizationId to: ${org._id}`);
        }

        // Ensure organizations array exists and contains this org
        if (!user.organizations || !Array.isArray(user.organizations)) {
          // Find member info from organization
          const memberInfo = org.members.find(m => m.userId.toString() === userId.toString());
          const role = memberInfo?.role || 'Member';

          updates.organizations = [{
            organizationId: org._id,
            role: role,
            joinedAt: memberInfo?.joinedAt || new Date()
          }];
          needsUpdate = true;
          console.log(`      ✏️  Will create organizations array with role: ${role}`);
        } else {
          // Check if this org is in the array
          const hasOrg = user.organizations.some(o => o.organizationId.toString() === org._id.toString());
          if (!hasOrg) {
            const memberInfo = org.members.find(m => m.userId.toString() === userId.toString());
            const role = memberInfo?.role || 'Member';

            user.organizations.push({
              organizationId: org._id,
              role: role,
              joinedAt: memberInfo?.joinedAt || new Date()
            });
            updates.organizations = user.organizations;
            needsUpdate = true;
            console.log(`      ✏️  Will add org to organizations array with role: ${role}`);
          }
        }

        // Apply updates
        if (needsUpdate) {
          await User.findByIdAndUpdate(userId, updates);
          fixedUsers++;
          console.log(`      ✅ Updated user successfully\n`);
        } else {
          console.log(`      ✓ User data is correct\n`);
        }
      }
    }

    console.log('\n================================================\n');
    console.log(`✅ Fix complete! Updated ${fixedUsers} users\n`);

    // Verify the fixes
    console.log('🔍 Verifying fixes...\n');

    for (const org of orgs) {
      const memberUserIds = (org.members || []).map(m => m.userId);

      for (const userId of memberUserIds) {
        const user = await User.findById(userId).select('name email currentOrganizationId organizationId organizations');

        const userOrgId = user.currentOrganizationId || user.organizationId;
        const isCorrect = userOrgId && userOrgId.toString() === org._id.toString();

        if (!isCorrect) {
          console.log(`   ❌ User ${user.name} still has incorrect org ID!`);
        } else {
          console.log(`   ✅ User ${user.name} has correct org ID`);
        }
      }
    }

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the fix
fixOrgData().catch(console.error);
