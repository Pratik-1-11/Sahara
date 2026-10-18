const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying updated Firestore rules with notification support...');

try {
  // Check if firebase CLI is installed
  execSync('firebase --version', { stdio: 'pipe' });
  
  // Deploy Firestore rules
  console.log('📋 Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  
  console.log('✅ Firestore rules deployed successfully!');
  console.log('');
  console.log('📝 Summary of changes:');
  console.log('   - Added notification_history collection rules');
  console.log('   - Users can read their own notification history');
  console.log('   - System can create/update notification records');
  console.log('   - Notification history cannot be deleted');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('   1. Test push notifications in your app');
  console.log('   2. Check notification history in Firebase Console');
  console.log('   3. Monitor notification delivery rates');
  
} catch (error) {
  console.error('❌ Error deploying Firestore rules:', error.message);
  console.log('');
  console.log('🔧 Manual deployment steps:');
  console.log('   1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('   2. Login to Firebase: firebase login');
  console.log('   3. Deploy rules: firebase deploy --only firestore:rules');
} 