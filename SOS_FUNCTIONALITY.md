# SOS Functionality Implementation

## Overview

The SOS functionality has been implemented with the following features:

1. **10-second countdown** before triggering SOS
2. **Firestore integration** to store SOS events
3. **Automatic emergency number redirection** based on disaster type
4. **Location tracking** and address resolution
5. **User authentication integration**

## Components

### 1. SOSCountdown Component (`components/SOSCountdown.tsx`)

- Handles the 10-second countdown with visual feedback
- Integrates with location services to get user coordinates
- Creates SOS events in Firestore
- Provides cancel functionality during countdown

### 2. SOSService (`firebase/sosService.js`)

- Manages Firestore operations for SOS events
- Maps disaster types to emergency contacts
- Handles emergency calls and SMS functionality
- Provides contact information based on `assignedTo` field

### 3. Updated SOS Page (`app/(tabs)/sos.tsx`)

- Integrates disaster type selection
- Shows countdown screen when SOS is triggered
- Maintains existing contact functionality

## Firestore Collection Structure

### sosEvents Collection

```json
{
  "Message": "string",           // Emergency message with location
  "additionalInfo": "string",    // Additional context
  "assignedTo": "string",        // Emergency service type (police, ambulance, fire, etc.)
  "isVerified": "string",        // Verification status ("true"/"false")
  "location": {
    "lat": number,               // Latitude
    "lng": number                // Longitude
  },
  "severity": "string",          // Emergency severity level
  "status": "string",            // Event status (pending, active, resolved)
  "timestamp": "timestamp",      // Server timestamp
  "type": "string",              // Disaster type (earthquake, flood, fire, landslide)
  "userId": "string",            // User ID from authentication
  "userName": "string",          // User's display name or email
  "userPhone": "string"          // User's phone number
}
```

## Disaster Type Mapping

| Disaster Type | assignedTo     | Emergency Contact        |
| ------------- | -------------- | ------------------------ |
| Earthquake    | earthquake     | Emergency Services (100) |
| Flood         | flood          | Emergency Services (100) |
| Fire          | fire_emergency | Fire Department (101)    |
| Landslide     | landslide      | Emergency Services (100) |

## Emergency Contact Mapping

| assignedTo      | Contact Name       | Number | Icon     |
| --------------- | ------------------ | ------ | -------- |
| police          | Police             | 100    | shield   |
| ambulance       | Ambulance          | 102    | medical  |
| fire            | Fire Department    | 101    | flame    |
| mountain_rescue | Mountain Rescue    | 103    | location |
| earthquake      | Emergency Services | 100    | shield   |
| flood           | Emergency Services | 100    | shield   |
| fire_emergency  | Fire Department    | 101    | flame    |
| landslide       | Emergency Services | 100    | shield   |

## User Flow

1. **User selects disaster type** from the emergency grid
2. **Confirmation dialog** appears asking to trigger SOS
3. **10-second countdown** begins with visual feedback
4. **Location permission** is requested if not granted
5. **SOS event is created** in Firestore with all required data
6. **Success alert** shows with options to call or send SMS
7. **Emergency contact** is automatically selected based on disaster type

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sosEvents/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow delete: if false; // Only admins should delete SOS events
    }
  }
}
```

## Dependencies

- `firebase` (v11.10.0) - Already installed
- `expo-location` - For location services
- `@expo/vector-icons` - For icons
- `expo-linear-gradient` - For gradient backgrounds

## Testing

To test the SOS functionality:

1. Navigate to the SOS tab
2. Select a disaster type (Earthquake, Flood, Fire, or Landslide)
3. Confirm the SOS trigger
4. Watch the 10-second countdown
5. Verify the SOS event is created in Firestore
6. Test the emergency call/SMS functionality

## Error Handling

- Location permission denied: Shows alert with manual contact options
- Network errors: Falls back to manual emergency contact methods
- Firestore errors: Logs error and shows manual contact options

## Future Enhancements

1. **Real-time updates** for SOS event status
2. **Push notifications** to emergency responders
3. **Voice activation** for SOS triggering
4. **Offline support** with local storage
5. **Emergency contact customization** by users
6. **SOS history** for users to view past emergencies
