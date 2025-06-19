const { solveVRP } = require("../services/vrpSolver");
const DeliveryJob = require("../models/DeliveryJob");

const solveVRPHandler = async (req, res) => {
  try {
    const inputData = req.body;

    // Solve using GA
    const result = solveVRP(inputData);
    const { bestTrips, distanceMatrix, message,cost } = result;
    // console.log(result);
    // Save to DB
    const newJob = new DeliveryJob({
      ...inputData,
      title: inputData.title || "Untitled Job",
      result: {
        totalCost: cost,
        bestRoute: bestTrips, // wrap flat array in one-element array
        generations:100, // whatever you used (e.g. 100)
      },
    });

    await newJob.save();

    return res.status(200).json({
      message: "VRP solved and saved",
      job: newJob,
    });
  } catch (error) {
    console.error("Error solving VRP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { solveVRPHandler };
