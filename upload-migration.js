#!/usr/bin/env node

/**
 * Upload migrated card sets to Firestore
 * Requires: Firebase Admin SDK and service account key
 */

const fs = require('fs');
const path = require('path');

// Try to initialize Firebase Admin SDK
try {
  const admin = require('firebase-admin');

  // Check if service account file exists
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.log(`⚠️  Service account key not found at: ${serviceAccountPath}`);
    console.log(`\n📝 To upload cards to Firestore, you have 2 options:\n`);
    console.log(`Option 1: Use Firebase Console`);
    console.log(`  1. Go to: https://console.firebase.google.com/project/juice-flashcards-app/firestore`);
    console.log(`  2. Click "Add Collection" and create "cardSets"`);
    console.log(`  3. Add document with ID "ejuice" and paste the contents of ejuice-migration.json\n`);

    console.log(`Option 2: Use this script with service account key`);
    console.log(`  1. Download service account key from Firebase Console`);
    console.log(`  2. Save as serviceAccountKey.json in this directory`);
    console.log(`  3. Run: node upload-migration.js\n`);

    process.exit(1);
  }

  // Initialize Firebase Admin
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'juice-flashcards-app'
  });

  const db = admin.firestore();

  // Read migration file
  const migrationPath = path.join(__dirname, 'ejuice-migration.json');
  const migrationData = JSON.parse(fs.readFileSync(migrationPath, 'utf-8'));

  // Upload to Firestore
  console.log('Uploading eJuice card set to Firestore...');
  console.log(`Set ID: ${migrationData.setId}`);
  console.log(`Cards: ${migrationData.setData.cardCount}`);

  db.collection('cardSets')
    .doc(migrationData.setId)
    .set(migrationData.setData)
    .then(() => {
      console.log(`\n✅ Successfully uploaded card set "${migrationData.setId}" to Firestore!`);
      console.log(`Total cards: ${migrationData.setData.cardCount}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error uploading to Firestore:', error);
      process.exit(1);
    });

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log(`⚠️  Firebase Admin SDK not installed`);
    console.log(`\nTo use this script, install Firebase Admin SDK:`);
    console.log(`  npm install firebase-admin\n`);
  }
  console.log(`\n📝 For manual upload instructions, see above.\n`);
  process.exit(1);
}
