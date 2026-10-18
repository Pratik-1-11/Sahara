const express = require("express");
const router = express.Router();

// Example: Return mock user posts with Cloudinary avatars
router.get("/posts", (req, res) => {
  res.json([
    {
      id: "1",
      user: {
        name: "Jane Smith",
        avatar:
          "https://res.cloudinary.com/dwq87pglw/image/upload/v1710000000/Social%20Page/Profile_pics/jane_smith.jpg",
        role: "Emergency Preparedness Expert",
      },
      content:
        "Just completed our community emergency drill. Remember: Have your go-bag ready with essentials! 🚨",
      timestamp: "2m ago",
      comments: 8,
    },
    {
      id: "2",
      user: {
        name: "Sarah Connor",
        avatar:
          "https://res.cloudinary.com/dwq87pglw/image/upload/v1710000000/Social%20Page/Profile_pics/sarah_connor.jpg",
        role: "Neighborhood Watch Lead",
      },
      content:
        "Organizing a community first-aid training this Saturday. Who's joining? 🏥",
      timestamp: "35m ago",
      comments: 5,
    },
    {
      id: "3",
      user: {
        name: "Community Alert",
        avatar:
          "https://res.cloudinary.com/dwq87pglw/image/upload/v1710000000/Social%20Page/Profile_pics/community_alert.jpg",
        role: "Official Account",
      },
      content:
        "Weather update: Severe thunderstorm warning in effect until 8 PM. Secure outdoor objects! ⚡",
      timestamp: "1h ago",
      comments: 12,
    },
  ]);
});

module.exports = router;
