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
    process.exit(1);
}

async function fix() {
    try {
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        const users = db.collection('users');
        const orgs = db.collection('organizations');

        // Find PrimeLink
        const primeLink = await orgs.findOne({ name: { $regex: /PrimeLink/i } });
        if (!primeLink) {
            console.error("PrimeLink not found");
            return;
        }
        console.log(`Found Target Org: ${primeLink.name} (${primeLink._id})`);

        // Find User
        const email = "omdahale01@gmail.com";
        const user = await users.findOne({ email });

        if (!user) {
            console.error(`User ${email} not found`);
            return;
        }

        console.log(`User currently in: ${user.organizationName} (${user.organizationId})`);

        // Update
        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    organizationId: primeLink._id,
                    organizationName: primeLink.name,
                    currentOrganizationId: primeLink._id
                }
            }
        );

        console.log(`Updated user ${email} to ${primeLink.name}`);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fix();
