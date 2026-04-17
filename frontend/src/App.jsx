import { useState, useEffect } from "react";
import { createJob, pingHealth } from "./services/api";
import Footer from "./components/Footer";
import MapView from "./components/LeafletMap";
import LandingPage from "./components/LandingPage";
import ReportModal from "./components/ReportModal";
import { FaBars, FaXmark } from "react-icons/fa6";

export const VEHICLE_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#65a30d",
];

export default function App() {
  const [job, setJob] = useState(null);
  const [locations, setLocations] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicleCapacity, setVehicleCapacity] = useState(8);
  const [numVehicles, setNumVehicles] = useState(2);
  const [maxShiftHours, setMaxShiftHours] = useState(8);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(40);
  const [isStarted, setIsStarted] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportMinimized, setReportMinimized] = useState(false);

  // Delivery state lifted up so ReportModal can trigger it
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Server health state (for Render free-tier cold start)
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'ready' | 'error'

  useEffect(() => {
    if (!isStarted) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;
    const tryPing = async () => {
      if (cancelled) return;
      const ok = await pingHealth();
      if (cancelled) return;
      if (ok) {
        setServerStatus('ready');
        setTimeout(() => setServerStatus('hidden'), 3000); // auto-dismiss after 3s
      } else {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) setServerStatus('error');
        else setTimeout(tryPing, 3000);
      }
    };
    tryPing();
    return () => { cancelled = true; };
  }, [isStarted]);

  const handleRunVRP = async () => {
    if (locations.length < 2 || !locations[0]) {
      alert("Please set a depot and at least one customer first.");
      return;
    }
    const payload = {
      locations: locations.filter(Boolean),
      demands,
      vehicleCapacity,
      numVehicles,
      maxShiftHours,
      reloadTimeHours: 0.5,
      avgSpeedKmh,
    };
    setLoading(true);
    setDeliveryStarted(false);
    try {
      const result = await createJob(payload);
      console.log("Raw API result:", result);

      // Merge raw assignment (reliable) into job.result (may have Mongoose serialization issues)
      const mergedJob = {
        ...result.job,
        locations: payload.locations,         // keep filtered locations for map
        result: {
          ...result.job?.result,
          ...(result.assignment || {}),        // raw assignment wins for vehicles/trips
        },
      };
      console.log("Merged job vehicles:", mergedJob.result?.vehicles);
      setJob(mergedJob);
      setReportMinimized(false); // Open the report immediately on generation
      setShowReport(true);
    } catch (err) {
      console.error("VRP request failed:", err);
      alert("Failed to generate delivery plan. Check backend.");
    } finally {
      setLoading(false);
    }
  };


  const resetNodes = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setLocations([]);
    setDemands([]);
    setJob(null);
    setVehicleCapacity(8);
    setNumVehicles(2);
    setMaxShiftHours(8);
    setAvgSpeedKmh(40);
    setDeliveryStarted(false);
    setConfirmReset(false);
  };

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row relative">
      {/* Mobile Header (Hidden on LG+) */}
      <header className="lg:hidden bg-white border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between z-[11000]">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black uppercase tracking-tight text-blue-600 leading-none">
            Cargo<span className="text-gray-800">Route</span>
          </h1>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 border-2 border-black hover:bg-gray-100 transition-none"
        >
          <FaBars size={20} className="text-black" />
        </button>
      </header>

      {/* Sidebar Backdrop Overlay (Mobile only) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[11001] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (Drawer on Mobile, Sidebar on Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[11002] w-64 p-4 bg-white border-r-2 border-gray-200 
        flex flex-col justify-between transform transition-transform duration-300 lg:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col gap-3">
          {/* Branding & Close Button (Mobile Only) */}
          <div className="mb-1 border-b-2 border-gray-100 pb-2 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-blue-600">
                Cargo<span className="text-gray-800">Route</span>
              </h1>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                Optimizing Every Mile
              </p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 border-2 border-black hover:bg-gray-100 transition-none"
            >
              <FaXmark size={18} />
            </button>
          </div>

          {/* Fleet Config */}
          <div className="space-y-2 p-3 bg-gray-50 border-2 border-gray-200">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fleet Config</p>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase tracking-wider">Vehicle Capacity</label>
              <input type="number" min="1" value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase tracking-wider">Number of Vehicles</label>
              <input type="number" min="1" value={numVehicles}
                onChange={(e) => setNumVehicles(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase tracking-wider">Max Shift (hours)</label>
              <input type="number" min="1" max="24" step="0.5" value={maxShiftHours}
                onChange={(e) => setMaxShiftHours(parseFloat(e.target.value) || 8)}
                className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase tracking-wider">Avg Speed (km/h)</label>
              <input type="number" min="5" max="150" value={avgSpeedKmh}
                onChange={(e) => setAvgSpeedKmh(parseInt(e.target.value) || 40)}
                className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-white font-mono"
              />
            </div>
          </div>

          <button onClick={handleRunVRP} disabled={loading}
            className={`w-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-white border-2 transition-none ${loading ? "bg-blue-400 border-blue-400 cursor-not-allowed" : "bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700"
              }`}
          >
            {loading ? "Optimizing..." : "Generate Plan"}
          </button>

          {job && (
            <button
              onClick={() => {
                if (showReport) {
                  setReportMinimized(!reportMinimized);
                } else {
                  setShowReport(true);
                  setReportMinimized(false);
                }
              }}
              className="w-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border-2 border-blue-200 transition-none hover:bg-blue-100 hover:border-blue-400"
            >
              View Report
            </button>
          )}

          {/* Delivery status pill */}
          {deliveryStarted && (
            <div className="flex items-center gap-2 bg-green-100 border-2 border-green-500 text-green-800 px-3 py-1.5 uppercase text-xs font-bold tracking-widest justify-center">
              <span className="w-2 h-2 bg-green-600 animate-pulse"></span>
              <span>Delivering</span>
            </div>
          )}

          {/* Reset */}
          <button onClick={resetNodes}
            className={`w-full py-1.5 text-sm font-bold uppercase tracking-wider text-white border-2 transition-none ${confirmReset
                ? "bg-red-800 border-red-800 animate-pulse"
                : "bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600"
              }`}
          >
            {confirmReset ? "Confirm Reset" : "Reset System"}
          </button>
        </div>

        <Footer />
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative">
        <MapView
          locations={locations}
          setLocations={setLocations}
          demands={demands}
          setDemands={setDemands}
          vehicleCapacity={vehicleCapacity}
          job={job}
          vehicleColors={VEHICLE_COLORS}
          deliveryStarted={deliveryStarted}
          setDeliveryStarted={setDeliveryStarted}
        />
      </main>

      {/* Server health toast */}
      {serverStatus !== 'hidden' && serverStatus !== 'checking' || serverStatus === 'checking' ? (
        serverStatus === 'checking' ? (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2 bg-amber-50 border border-black text-amber-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2 shadow-[4px_4px_0px_#000] rounded-none">
            <span className="w-2 h-2 bg-amber-500 animate-pulse"></span>
            Warming up server — please wait...
          </div>
        ) : serverStatus === 'ready' ? (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2 bg-green-50 border border-black text-green-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2 shadow-[4px_4px_0px_#000] rounded-none">
            <span className="w-2 h-2 bg-green-500"></span>
            Server ready
          </div>
        ) : serverStatus === 'error' ? (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2 bg-red-50 border border-black text-red-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2 shadow-[4px_4px_0px_#000] rounded-none">
            <span className="w-2 h-2 bg-red-500"></span>
            Server offline — plan generation may fail
          </div>
        ) : null
      ) : null}

      {/* Report Overlay (Floating card/modal if showReport is true) */}
      {showReport && job && (
        <ReportModal
          job={job}
          onClose={() => setShowReport(false)}
          onStartDelivery={() => {
            setDeliveryStarted(true);
          }}
          onStopDelivery={() => setDeliveryStarted(false)}
          deliveryStarted={deliveryStarted}
          maxShiftHours={maxShiftHours}
          numVehicles={numVehicles}
          isMinimized={reportMinimized}
          setIsMinimized={setReportMinimized}
        />
      )}
    </div>
  );
}
