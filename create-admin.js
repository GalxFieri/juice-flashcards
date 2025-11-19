// Script to create a master admin account in Firestore
// Run with: node create-admin.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration (same as in index.html)
const firebaseConfig = {
  apiKey: "AIzaSyDcB2BvZ5sQ6OkO6L5mK8N7P9Q0R1S2T3U",
  authDomain: "juice-flashcards-app.firebaseapp.com",
  projectId: "juice-flashcards-app",
  storageBucket: "juice-flashcards-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

async function createAdminAccount() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const adminRef = doc(db, 'users', 'admin');
    await setDoc(adminRef, {
      username: 'admin',
      pin: '0000',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    console.log('✅ Master admin account created successfully!');
    console.log('Username: admin');
    console.log('PIN: 0000');
    console.log('\nYou can now login with these credentials and create additional admin accounts.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
}

createAdminAccount();
