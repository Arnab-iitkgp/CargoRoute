// routes/api.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/directions", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      req.body,
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("ORS Error:", err.response?.data || err.message);
    res.status(500).json({ error: "ORS API failed" });
  }
});

module.exports = router;
