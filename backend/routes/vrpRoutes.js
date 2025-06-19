const express = require('express');
const router = express.Router();
const { solveVRPHandler } = require('../controllers/vrpController');

router.post('/solve-vrp', solveVRPHandler);

module.exports = router;
