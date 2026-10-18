const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");

// GET /api/cloudinary/images
router.get("/images", async (req, res) => {
  try {
    const folder = "Social Page/Profile_pics"; // Your Cloudinary folder
    const result = await cloudinary.search
      .expression(`folder:"${folder}"`)
      .sort_by("public_id", "desc")
      .max_results(30)
      .execute();

    // Map to just the URLs
    const images = result.resources.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images from Cloudinary" });
  }
});

module.exports = router;
