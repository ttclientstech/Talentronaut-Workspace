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

async function check() {
    try {
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();
        const projects = await db.collection('projects').find({}).toArray();
        const orgs = await db.collection('organizations').find({}).toArray();

        console.log(`Total Users: ${users.length}`);
        console.log(`Total Projects: ${projects.length}`);
        console.log(`Total Orgs: ${orgs.length}`);

        // Map orgs
        const orgMap = {};
        orgs.forEach(o => orgMap[o._id.toString()] = o.name);

        // Check project distribution
        const projectCounts = {};
        projects.forEach(p => {
            const oid = p.organizationId ? p.organizationId.toString() : 'null';
            projectCounts[oid] = (projectCounts[oid] || 0) + 1;
        });

        console.log("\nProject Counts by Organization:");
        for (const [oid, count] of Object.entries(projectCounts)) {
            console.log(`- Org ${orgMap[oid] || oid}: ${count} projects`);
        }

        // Check User distribution (active org)
        console.log("\nUser Active Organization:");
        users.slice(0, 5).forEach(u => {
            const oid = u.organizationId ? u.organizationId.toString() : 'null';
            console.log(`- User ${u.email}: Active Org = ${orgMap[oid] || oid}`);
            if (u.organizations) {
                console.log(`  Has memberships in: ${u.organizations.map(o => orgMap[o.organizationId.toString()] || o.organizationId).join(', ')}`);
            }
        });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

check();
