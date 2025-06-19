const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const vrpRoutes = require('./routes/vrpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api', vrpRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("DB error:", err));


// Routes
app.get("/", (req, res) => {
  res.send("VRP Optimizer Backend is Running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
