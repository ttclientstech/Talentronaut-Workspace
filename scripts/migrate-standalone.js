const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let mongoUri = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('MONGODB_URI=')) {
            mongoUri = line.split('=')[1].trim();
            if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
                mongoUri = mongoUri.slice(1, -1);
            }
        }
    }
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!mongoUri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

async function migrate() {
    try {
        console.log("Connecting...");
        await mongoose.connect(mongoUri);
        console.log("Connected.");

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const orgsCollection = db.collection('organizations');

        const users = await usersCollection.find({}).toArray();
        console.log(`Found ${users.length} users.`);
        if (users.length > 0) {
            console.log("Sample User:", JSON.stringify(users[0], null, 2));
        }

        let updatedCount = 0;

        for (const user of users) {
            let needsUpdate = false;
            const updates = {};

            // LOGIC: If missing organizationId, try to pull from organizations array
            if (!user.organizationId) {
                // Check organizations array
                if (user.organizations && Array.isArray(user.organizations) && user.organizations.length > 0) {
                    const targetOrgId = user.organizations[0].organizationId; // This is an ObjectId usually
                    if (targetOrgId) {
                        updates.organizationId = targetOrgId;

                        // Fetch Org Name
                        const org = await orgsCollection.findOne({ _id: targetOrgId });
                        if (org) {
                            updates.organizationName = org.name;
                        }
                        needsUpdate = true;
                    }
                }
                // Check currentOrganizationId fallback
                else if (user.currentOrganizationId) {
                    updates.organizationId = user.currentOrganizationId;
                    const org = await orgsCollection.findOne({ _id: user.currentOrganizationId });
                    if (org) {
                        updates.organizationName = org.name;
                    }
                    needsUpdate = true;
                }
            }
            // If organizationId exists but name is missing
            else if (user.organizationId && !user.organizationName) {
                const org = await orgsCollection.findOne({ _id: user.organizationId });
                if (org) {
                    updates.organizationName = org.name;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                console.log(`Updating user ${user.email} with orgId: ${updates.organizationId}`);
                await usersCollection.updateOne({ _id: user._id }, { $set: updates });
                updatedCount++;
            }
        }

        console.log(`Done. Updated ${updatedCount} users.`);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
