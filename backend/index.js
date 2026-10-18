const express = require("express");
require("dotenv").config();
const uploadRoute = require("./controller/routeUpload");
const userController = require("./controller/userController");
const cloudinaryImages = require("./controller/cloudinaryImages"); // Import the cloudinaryImages router
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Serve a simple HTML form for file upload at the root path
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload Image to Cloudinary</title>
    </head>
    <body>
      <h1>Upload Image to Cloudinary</h1>
      <form action="/api/users/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="image" accept="image/*" required />
        <button type="submit">Upload File</button>
      </form>
    </body>
    </html>
  `);
});

// The route
app.use("/api/users", uploadRoute);
app.use("/api/social", userController);
app.use("/api/cloudinary", cloudinaryImages); // Mount the cloudinaryImages router

// Port connection
app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});
