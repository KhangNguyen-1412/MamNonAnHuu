const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("==========================================================");
  console.error("ERROR: 'service-account.json' not found in the project root!");
  console.error("==========================================================");
  console.error("Please follow these steps to download it:");
  console.error("1. Open the Firebase Console: https://console.firebase.google.com/");
  console.error("2. Go to Project Settings (gear icon next to Project Overview) -> Service accounts.");
  console.error("3. Click 'Generate new private key', then click 'Generate key' in the popup.");
  console.error("4. Save the downloaded JSON file as 'service-account.json' in your project directory:");
  console.error("   c:\\Users\\nhpk1\\Documents\\Code\\THPT An Hữu\\service-account.json");
  console.error("5. Re-run this script: node verify_user.cjs");
  console.error("==========================================================");
  process.exit(1);
}

// Dynamically check/require firebase-admin
let initializeApp, cert, getAuth;
try {
  const admin = require('firebase-admin');
  initializeApp = admin.initializeApp;
  cert = admin.cert;
  getAuth = require('firebase-admin/auth').getAuth;
} catch (e) {
  console.error("==========================================================");
  console.error("ERROR: 'firebase-admin' package is not installed!");
  console.error("==========================================================");
  console.error("Please install it by running the following command:");
  console.error("  npm install firebase-admin --save-dev");
  console.error("==========================================================");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize firebase admin with the service account
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const email = 'khangnhp@admin.thptah.edu.vn';

console.log(`Locating user with email: ${email}...`);

auth.getUserByEmail(email)
  .then((userRecord) => {
    console.log(`Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
    console.log(`Updating emailVerified status to true...`);
    return auth.updateUser(userRecord.uid, {
      emailVerified: true
    });
  })
  .then((updatedUser) => {
    console.log(`SUCCESS: User ${updatedUser.email} has been successfully verified!`);
    console.log(`Email Verified Status: ${updatedUser.emailVerified}`);
    console.log("You can now delete the 'service-account.json' file for security.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR: Failed to verify user:");
    console.error(error);
    process.exit(1);
  });
