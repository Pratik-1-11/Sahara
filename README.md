# 🌍 Sahara: Real-Time Disaster Management Platform

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)

**Sahara** is a comprehensive, civic-tech mobile application and web-based admin dashboard designed to enhance public awareness, preparedness, and response during natural disasters in Nepal. 

Built to address the critical fragmentation in disaster communication tools, Sahara unifies real-time alerts, SOS geolocation, community feeds, and educational resources into a single, highly scalable platform.



---

## 🚀 Core Features

### 📱 Mobile Application (Citizen-Facing)
*   **Real-Time Disaster Map:** Live geolocation tracking using Google Maps API, highlighting danger zones, safe zones, and nearby emergency shelters.
*   **Emergency SOS:** A one-tap SOS button that transmits the user's GPS coordinates and disaster type (Earthquake, Flood, Fire, Landslide) directly to the admin dashboard.
*   **Live Alerts & Push Notifications:** Automated push notifications powered by Firebase Cloud Messaging (FCM) for immediate hazard warnings.
*   **Preparedness Quizzes:** Interactive educational modules to test and improve user knowledge on disaster safety.
*   **Community Feed:** A moderated social feed for citizens to report on-ground updates, infrastructure damage, and relief distribution efforts.

### 💻 Admin Panel (Government/Responder-Facing)
*   **Dashboard Overview:** Real-time metrics on active alerts, affected locations, registered users, and high-priority SOS signals.
*   **Alert Management:** Create, update, and delete disaster alerts with specific severity levels (High, Medium, Low) and status tags.
*   **Role-Based Access Control (RBAC):** Secure authentication ensuring only authorized government officials can broadcast alerts or view sensitive SOS data.

---

## 🛠️ Technology Stack & Architecture

*   **Frontend (Mobile):** React Native (Cross-platform iOS & Android)
*   **Frontend (Web Admin):** React.js, Leaflet.js (for lightweight web mapping)
*   **Backend & Database:** Firebase (Authentication, Firestore/Realtime DB, Cloud Functions)
*   **Third-Party APIs:** 
    *   **USGS API:** Real-time global earthquake data ingestion.
    *   **DHM (Nepal):** Web scraping for localized flood warning data.
    *   **OpenWeather API:** Live meteorological updates.
*   **Mapping:** Google Maps API

---

## 📐 System Design & Documentation (SDLC)

The system was built using the **Agile Methodology** (sprints, rapid prototyping, continuous feedback). The architecture is highly documented to ensure scalability and maintainability:

*   **System Modeling:** Complete **Use Case Diagrams** detailing User vs. Admin interactions.
*   **Database Architecture:** Robust **Entity-Relationship (ER) Diagrams** ensuring efficient NoSQL data structuring.
*   **Data Flow:** Comprehensive **Level 0 and Level 1 Data Flow Diagrams (DFDs)** mapping how external API data moves through the system to the end-user.
*   **Testing Strategy:** Implemented Unit Testing, Integration Testing, UAT, and Security/Performance testing to ensure resilience under high server load.

---

## 🔒 Security & Data Handling

Because the system handles emergency SOS data and confidential user locations:
*   **Authentication:** Secure login/registration via Firebase Auth.
*   **Authorization:** Strict Firebase Security Rules to prevent unauthorized data access.
*   **Confidentiality:** Admin routes are protected, and users can only read/write their own data.

---

## ⚙️ Local Setup & Installation

### Prerequisites
*   Node.js (v16+)
*   React Native CLI or Expo CLI
*   Firebase Account

### Steps
1. **Clone the repository:**

2. Install dependencies:

bash
npm install

3.Environment Variables Setup:

Create a .env file in the root directory.

Add your Firebase configuration keys and API keys (Google Maps, OpenWeather).
4. Run the application:

bash
npm start
 Future Enhancements
Offline-First Architecture: Implement offline caching with SMS/USSD fallback for remote, low-connectivity areas.

AI Risk Analysis: Employ machine learning to forecast floods and landslides based on historical monsoon and river data.

Multilingual Support: Full Nepali and local dialect integration.
.




   ```bash
   git clone https://github.com/Pratik-1-11/Sahara.git
   cd Sahara
