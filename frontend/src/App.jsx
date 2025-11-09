import { useState } from "react";
import { createJob } from "./services/api";
import Footer from "./components/Footer";
import MapView from "./components/LeafletMap";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa"; // icons for div

export default function App() {
  const [job, setJob] = useState(null);
  const [locations, setLocations] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
const routeColors = [
  "red", "blue", "green", "purple", "orange", "teal", "pink", "indigo", "yellow", "cyan",
  "lime", "rose", "amber", "violet", "fuchsia", "emerald", "sky", "gray", "stone", "slate"
];
  const [vehicleCapacity, setVehicleCapacity] = useState(8); // default is 8

  const handleRunVRP = async () => {
    if (locations.length < 2) {
      alert("Add at least one depot and one customer.");
      return;
    }

    const payload = {
      locations,
      demands,
      vehicleCapacity,
      numVehicles: 1,
    };

    setLoading(true);
    try {
      const result = await createJob(payload);
      setJob(result.job);
    } catch (err) {
      console.error("VRP request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetNodes = ()=>{
    if(locations.length===0){
      alert("No locations to reset.");
      return;
    }
    if(window.confirm("Are you sure you want to reset all locations?")){
      setLocations([]);
      setDemands([]);
      setJob(null);
      setVehicleCapacity(8); //default
    }
    return
  }
  

  return (
    <div className="flex h-screen">
      <aside className="w-64 p-4 bg-gray-100 flex flex-col justify-between">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-blue-600 mb-1 text-center">
            Cargo<span className="text-gray-800">Route</span>
          </h1>
          <p className="text-xs text-gray-500 text-center mb-6">
            Optimizing Every Mile
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Capacity
            </label>
            <input
              type="number"
              min="1"
              value={vehicleCapacity}
              onChange={(e) =>
                setVehicleCapacity(parseInt(e.target.value) || 1)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleRunVRP}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            {loading ? "Generating..." : "Generate Delivery Plan"}
          </button>
          <button onClick={resetNodes}
          className="bg-red-500 mt-2 w-full py-1 text-white rounded hover:bg-red-600 transition duration-200" >
            Reset
          </button>

          {job && (
            <div className="mt-6 p-4 bg-white rounded shadow text-sm space-y-2">
              <h2 className="font-semibold text-blue-600 text-center text-base border-b pb-2">
                Optimization Result
              </h2>
              <p className="flex justify-between">
                <span className="font-medium text-gray-600">
                  Total Distance ~
                </span>
                <span className="font-semibold text-gray-800">
                  {(job.result.totalCost * 111/0.621).toFixed(3)} miles
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-600">Customers:</span>
                <span className="font-semibold text-gray-800">
                  {locations.length - 1}
                </span>
              </p>
              
              <div className="mt-3 space-y-2">
                <h3 className="font-medium text-gray-700">Routes:</h3>
                <ul className="space-y-1 text-gray-600">
                  {job.result.bestRoute.map((route, i) => {
                    const color = routeColors[i % routeColors.length]; // cycle if more than 4
                    return (
                      <li key={i} className="flex items-center space-x-2">
                        {/* Colored dot */}
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        ></span>
                        {/* Route text */}
                        <span>
                          <strong className="text-gray-800">
                            Route {i + 1}:
                          </strong>{" "}
                          {route.join(" → ")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer/>
      </aside>

      <main className="flex-1 p-4">
        <MapView
          locations={locations}
          setLocations={setLocations}
          demands={demands}
          setDemands={setDemands}
          vehicleCapacity={vehicleCapacity}
          job={job}
        />
      </main>
    </div>
  );
}
