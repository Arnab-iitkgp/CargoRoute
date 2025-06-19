// src/App.jsx
import { useState } from "react";
import { createJob } from "./services/api";
import GridMap from "./components/GridMap";
import MapView from "./components/LeafletMap"; // This is LeafletMap.jsx


const SAMPLE = {
  locations: [
    [0, 0],
    [1, 3],
    [4, 1],
    [2, 5],
    [6, 2],
    [3, 4],
    [5, 6],
  ],
  demands: [0, 2, 4, 2, 3, 2, 2],
  vehicleCapacity: 8,
  numVehicles: 1,
};

export default function App() {
  const [job, setJob] = useState(null);
  const [locations, setLocations] = useState([]); // From map clicks
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const created = await createJob(SAMPLE);
      if (created.job) {
        setJob(created.job);
        console.log("Created job:", created.job);
      } else {
        console.error("Backend response missing job:", created);
      }
    } catch (err) {
      console.error("Error during job creation:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleRunVRP = async () => {
  if (locations.length < 2) {
    alert("Add at least one customer.");
    return;
  }
  const payload = {
    locations,
    demands,
    vehicleCapacity: 8,
    numVehicles: 1,
  };
  console.log(payload)

  try {
    const result = await createJob(payload);
    setJob(result.job); // Now LeafletMap gets updated via props
  } catch (err) {
    console.error("VRP failed", err);
  }
};
  return (
    <div className="flex h-screen">
      <aside className="w-64 p-4 bg-gray-100">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Running GA…" : "Run VRP"}
        </button>
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
        >
          {isGridView ? "Switch to Map" : "Switch to Grid View"}
        </button>
        <button
          onClick={handleRunVRP}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Run VRP for Map
        </button>
        {job && (
          <div className="mt-4">
            <h2 className="font-bold">Result</h2>
            <p>Total Cost: {job.result.totalCost.toFixed(2)}</p>
            <p>Generations: {job.result.generations}</p>
            <ul className="mt-2 space-y-1">
              {job.result.bestRoute.map((route, i) => (
                <li key={i}>
                  <strong>Route {i + 1}:</strong> {route.join(" → ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main className="flex-1 p-4">
        {job ? (
          isGridView ? (
            <GridMap locations={job.locations} routes={job.result.bestRoute} />
          ) : (
            // <MapView locations={job.locations} routes={job.result.bestRoute} />
            <MapView
              locations={locations}
              setLocations={setLocations}
              demands={demands}
              setDemands={setDemands}
              job={job}
            />
          )
        ) : (
          <div className="text-gray-500">Submit to see map</div>
        )}
      </main>
    </div>
  );
}
