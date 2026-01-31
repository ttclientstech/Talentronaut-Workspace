const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function resetAndSeed() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(mongoUri);
        console.log("Connected.");

        const db = mongoose.connection.db;

        // 1. Drop Collections
        const collections = await db.listCollections().toArray();
        for (const collection of collections) {
            await db.collection(collection.name).drop();
            console.log(`Dropped collection: ${collection.name}`);
        }

        // 2. Create Admin User (Without Organization)
        const users = db.collection('users');
        const hashedPassword = await bcrypt.hash("password123", 10);

        const adminUser = await users.insertOne({
            name: "Admin User",
            email: "admin@example.com",
            password: hashedPassword,
            role: "Admin",
            // organizationId removed
            // organizationName removed
            // currentOrganizationId removed
            accessCode: "ADMIN123",
            createdAt: new Date(),
            updatedAt: new Date(),
            skills: []
        });
        const userId = adminUser.insertedId;
        console.log(`Created Admin: admin@example.com (${userId})`);

        console.log("Reset and Seed Complete.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetAndSeed();
