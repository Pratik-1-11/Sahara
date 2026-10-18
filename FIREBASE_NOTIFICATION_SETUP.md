# Firebase Setup for Push Notifications

## Overview

This guide covers all the Firebase configurations and collections needed for the push notification system to work properly.

## 🔥 Firebase Collections Required

### 1. `users` Collection (Already exists)

**Purpose**: Store user profiles and push tokens

**Document Structure**:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Fields Added for Notifications**:

- `pushToken`: Expo push token for the device
- `updatedAt`: Timestamp of last token update

### 2. `notification_history` Collection (New)

**Purpose**: Track all sent notifications for analytics and debugging

**Document Structure**:

```json
{
  "userId": "user123",
  "type": "emergency",
  "emergencyType": "Earthquake",
  "location": "Downtown Area",
  "title": "Emergency Alert",
  "body": "Earthquake emergency detected in your area...",
  "sentAt": "2024-01-01T00:00:00.000Z",
  "status": "sent",
  "response": "success"
}
```

**Fields**:

- `userId`: ID of the user who received the notification
- `type`: Type of notification (emergency, safety_tip, weather_alert)
- `title`: Notification title
- `body`: Notification body
- `sentAt`: Timestamp when notification was sent
- `status`: Delivery status
- `response`: API response status

## 🔐 Firestore Security Rules

### Updated Rules (Already applied)

```javascript
// User profiles
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Notification History Collection
match /notification_history/{historyId} {
  allow read: if request.auth != null &&
    (resource.data.userId == request.auth.uid || request.auth.token.admin == true);
  allow create, update: if request.auth != null;
  allow delete: if false; // Prevent deletion of notification history
}
```

## 🚀 Deployment Steps

### 1. Deploy Updated Firestore Rules

```bash
# Option 1: Use the provided script
node deploy-notification-rules.js

# Option 2: Manual deployment
firebase deploy --only firestore:rules
```

### 2. Verify Firebase Configuration

Ensure your `firebase/firebaseConfig.js` has the correct project ID:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "fir-saathi-e3c0c.firebaseapp.com",
  projectId: "fir-saathi-e3c0c", // This should match your Expo project
  // ... other config
};
```

### 3. Update Expo Project Configuration

In your `app.json`, ensure the project ID matches:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/Sahara-Logo.jpg",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

## 📊 Firebase Console Setup

### 1. Enable Firestore Database

- Go to Firebase Console → Firestore Database
- Ensure database is created and rules are deployed

### 2. Monitor Collections

- Navigate to Firestore Database → Data
- You should see:
  - `users` collection (existing)
  - `notification_history` collection (will be created automatically)

### 3. Set up Indexes (if needed)

If you plan to query notification history, create composite indexes:

```javascript
// For querying user's notification history
Collection: notification_history;
Fields: userId(Ascending), sentAt(Descending);
```

## 🔧 Testing the Setup

### 1. Test Push Token Storage

```javascript
// This happens automatically when user grants notification permissions
// Check Firestore Console → users collection → user document
// Should see pushToken field populated
```

### 2. Test Notification Sending

```javascript
// Use the test buttons in Notification Settings
// Check notification_history collection for new records
```

### 3. Monitor in Firebase Console

- Go to Firestore Database → Data
- Check `notification_history` collection for new documents
- Verify `users` collection has `pushToken` fields

## 🛠️ Troubleshooting

### Common Issues

1. **Push tokens not saving**

   - Check Firestore rules allow user write access
   - Verify user is authenticated
   - Check console for error messages

2. **Notifications not sending**

   - Verify push token exists in Firestore
   - Check Expo project ID matches Firebase project
   - Ensure device is physical (not simulator)

3. **Permission denied errors**
   - Deploy updated Firestore rules
   - Check user authentication status
   - Verify collection names match exactly

### Debug Steps

1. **Check Firestore Rules**:

   ```bash
   firebase firestore:rules:get
   ```

2. **View Real-time Logs**:

   ```bash
   firebase functions:log
   ```

3. **Test Rules Locally**:
   ```bash
   firebase emulators:start --only firestore
   ```

## 📈 Analytics and Monitoring

### 1. Notification Metrics

Monitor these metrics in Firebase Console:

- Notification delivery rates
- User engagement with notifications
- Most effective notification types

### 2. Custom Analytics

You can create custom analytics by querying `notification_history`:

```javascript
// Example: Get notification stats for a user
const userNotifications = await getDocs(
  query(
    collection(db, "notification_history"),
    where("userId", "==", userId),
    orderBy("sentAt", "desc"),
    limit(10)
  )
);
```

## 🔒 Security Best Practices

1. **Token Security**: Push tokens are sensitive data
2. **User Privacy**: Only store necessary notification data
3. **Access Control**: Users can only read their own notification history
4. **Data Retention**: Consider implementing data retention policies

## 📝 Next Steps

1. **Deploy Firestore Rules**: Run the deployment script
2. **Test Notifications**: Use the test functionality in the app
3. **Monitor Performance**: Check Firebase Console for metrics
4. **Scale Up**: Add more notification types as needed

## 🆘 Support

If you encounter issues:

1. Check Firebase Console for error messages
2. Verify all configuration steps are completed
3. Test on physical devices only
4. Review Firestore rules and permissions
