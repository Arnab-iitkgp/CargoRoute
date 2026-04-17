import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { FcFactory } from "react-icons/fc";
import { FaListUl, FaXmark } from "react-icons/fa6";

import "leaflet/dist/leaflet.css";
import ReactDOMServer from "react-dom/server";

// Depot icon
const depotIcon = new L.DivIcon({
  html: ReactDOMServer.renderToString(
    <FcFactory size={42} color="#eab308" />
  ),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Deferred customer icon (greyed out with clock)
const deferredIcon = new L.DivIcon({
  html: ReactDOMServer.renderToString(
    <div style={{ position: 'relative', opacity: 0.5 }}>
      <img src="https://cdn-icons-png.flaticon.com/512/1670/1670080.png" style={{ width: '32px', height: '32px', filter: 'grayscale(100%)' }} alt="deferred" />
      <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#f97316', color: 'white', fontSize: '12px', padding: '0px 3px', borderRadius: '8px', border: '2px solid white' }}>🕐</div>
    </div>
  ),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Clickable map component
function LocationClicker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Truck marker — colored per vehicle, uses inline SVG for safe renderToString
function TruckMarker({ path, vehicleId, color = "#2563eb", delay = 0, onFinish }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!path || path.length < 2) return;
    let i = 0;
    setPosition(path[0]);
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        if (i >= path.length) { clearInterval(interval); onFinish?.(); return; }
        setPosition(path[i]);
      }, 80);
    }, delay);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
  }, [path, delay]);

  if (!position) return null;

  const truckIcon = new L.DivIcon({
    html: `<div style="position:relative;">
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="24" viewBox="0 0 640 512">
        <path fill="${color}" d="M48 0C21.5 0 0 21.5 0 48V368c0 26.5 21.5 48 48 48H64c0 53 43 96 96 96s96-43 96-96H384c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V288 256 237.3c0-17-6.7-33.3-18.7-45.3L512 114.7c-12-12-28.3-18.7-45.3-18.7H416V48c0-26.5-21.5-48-48-48H48zm0 64H368V256H64V64zM160 464a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm272-48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z"/>
      </svg>
      <div style="position:absolute;top:-10px;right:-8px;background:${color};color:white;font-size:10px;font-weight:bold;padding:1px 5px;border-radius:8px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);white-space:nowrap;">V${vehicleId}</div>
    </div>`,
    className: "",
    iconSize: [34, 24],
    iconAnchor: [17, 12],
  });

  return <Marker position={position} icon={truckIcon} />;
}

export default function LeafletMap({
  locations,
  setLocations,
  demands,
  setDemands,
  vehicleCapacity,
  job,
  vehicleColors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea"],
  deliveryStarted = false,
  setDeliveryStarted,
}) {
  const [vehiclePolylines, setVehiclePolylines] = useState([]);
  const [deliveryDone, setDeliveryDone] = useState(false);
  const [trucksCompleted, setTrucksCompleted] = useState(0);
  const [useCarto, setUseCarto] = useState(false);
  const [stopsListOpen, setStopsListOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const hasCenteredRef = useRef(false);

  // Auto-fetch location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("User location:", latitude, longitude);
          setCoords([latitude, longitude]);
        },
        (err) => {
          console.error("Location access denied or unavailable:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation not supported by this browser.");
    }
  }, []);

  // Manual location fetch triggered by button
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = [pos.coords.latitude, pos.coords.longitude];
          setCoords(newCoords);
          if (mapInstance) {
            mapInstance.flyTo(newCoords, 14, { duration: 1.5 });
          }
        },
        (err) => {
          alert("Location access denied. Please enable it in your browser settings.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  function SetInitialView({ coords, setMapInstance }) {
    const map = useMapEvents({});

    useEffect(() => {
      if (map) setMapInstance(map);
    }, [map, setMapInstance]);

    useEffect(() => {
      if (coords && !hasCenteredRef.current && map) {
        map.flyTo(coords, 14);
        hasCenteredRef.current = true;
      }
    }, [coords, map]);

    return null;
  }


  const handleDemandChange = (index, value) => {
    const newDemand = parseInt(value) || 0;

    if (newDemand > vehicleCapacity) {
      alert(`Demand cannot exceed vehicle capacity of ${vehicleCapacity}`);
      return; // prevent invalid entry
    }

    const updatedDemands = [...demands];
    updatedDemands[index] = newDemand;
    setDemands(updatedDemands);
  };

  const handleTruckDone = () => {
    setTrucksCompleted((prev) => prev + 1);
  };

  useEffect(() => {
    if (deliveryStarted && vehiclePolylines.length > 0 && trucksCompleted === vehiclePolylines.length) {
      setDeliveryStarted?.(false);
      setDeliveryDone(true);
      setTrucksCompleted(0);
    }
  }, [trucksCompleted, deliveryStarted, vehiclePolylines.length]);

  // Reset trucks on new job and handle auto-dismiss for "Delivery Complete"
  useEffect(() => {
    setTrucksCompleted(0);
    setDeliveryDone(false);
  }, [job]);

  useEffect(() => {
    if (deliveryDone) {
      const timer = setTimeout(() => setDeliveryDone(false), 10000); // clear after 10s
      return () => clearTimeout(timer);
    }
  }, [deliveryDone]);

  // Clear routes when locations are emptied (reset)
  useEffect(() => {
    if (locations.length === 0) {
      setVehiclePolylines([]);
    }
  }, [locations]);

  const handleMapClick = (latlng) => {
    if (locations.length > 0 && locations[0] === null) {
      const newLocs = [...locations];
      newLocs[0] = latlng;
      setLocations(newLocs);
    } else {
      setLocations((prev) => [...prev, latlng]);
      setDemands((prev) => [...prev, 1]); // default demand
    }
  };

  const removeLocation = (index) => {
    if (index === 0) {
      if (locations.length === 1) {
        setLocations([]);
        setDemands([]);
      } else {
        const newLocs = [...locations];
        newLocs[0] = null;
        setLocations(newLocs);
      }
    } else {
      const newLocs = locations.filter((_, i) => i !== index);
      const newDemands = demands.filter((_, i) => i !== index);
      setLocations(newLocs);
      setDemands(newDemands);
    }
  };

  const updateDemand = (index, value) => {
    const newDemands = [...demands];
    newDemands[index] = parseInt(value) || 0;
    setDemands(newDemands);
  };

  // Fetch real-road geometry per vehicle — use job.locations as the index source
  // (it matches exactly what was sent to the solver)
  useEffect(() => {
    setVehiclePolylines([]);

    const vehicles = job?.result?.vehicles;
    const jobLocations = job?.locations;   // filtered array from the API call

    if (!vehicles || vehicles.length === 0 || !jobLocations) {
      console.log("⛔ Route fetch skipped:", { vehicles: vehicles?.length, jobLocations: jobLocations?.length });
      return;
    }

    console.log("🗺️ Fetching routes for", vehicles.length, "vehicles");
    console.log("📍 jobLocations:", jobLocations);

    const fetchRoutes = async () => {
      const allVehiclePaths = [];
      let globalTripIndex = 0;

      for (const vehicle of vehicles) {
        let vehicleConcatenatedPath = [];
        let vehicleTrips = [];

        console.log(`🚛 Vehicle ${vehicle.id} trips:`, vehicle.trips);

        for (const trip of vehicle.trips) {
          const currentTripIndex = globalTripIndex++;
          const coords = trip.map((idx) => jobLocations[idx]);
          const invalid = coords.some((pos) => !pos || !Array.isArray(pos) || pos.length !== 2);

          if (invalid) {
            console.warn(`⚠️ Invalid coords in trip for vehicle ${vehicle.id}:`, trip, coords);
            continue;
          }

          const orsPayload = { coordinates: coords.map(([lat, lng]) => [lng, lat]) };
          console.log(`📡 ORS call V${vehicle.id} Trip ${currentTripIndex}:`, orsPayload);

          let geometry;
          try {
            const res = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/directions`,
              orsPayload
            );
            geometry = res.data.features[0].geometry.coordinates.map(
              ([lng, lat]) => [lat, lng]
            );
            console.log(`✅ V${vehicle.id} trip ${currentTripIndex} geometry points:`, geometry.length);
          } catch (err) {
            console.error(`❌ ORS error for vehicle ${vehicle.id} trip ${currentTripIndex}:`, err?.response?.data || err.message);
            // Fallback: straight-line path so the trip is still visible
            geometry = coords;
            console.log(`📐 Fallback straight-line for V${vehicle.id} trip ${currentTripIndex}`);
          }

          vehicleConcatenatedPath = [...vehicleConcatenatedPath, ...geometry];
          vehicleTrips.push({
            tripIndex: currentTripIndex,
            path: geometry
          });
        }

        if (vehicleConcatenatedPath.length > 0) {
          allVehiclePaths.push({
            vehicleId: vehicle.id,
            path: vehicleConcatenatedPath,
            trips: vehicleTrips
          });
        }
      }

      console.log("🏁 All vehicle paths:", allVehiclePaths.map(v => ({ vehicleId: v.vehicleId, points: v.path.length })));
      setVehiclePolylines(allVehiclePaths);
    };

    fetchRoutes();
  }, [job]);

  return (
    <div className="flex h-full relative">
      {/* Mobile Stops Minimized Card (Side-by-side with Report) */}
      {!stopsListOpen && (
        <div 
          onClick={() => setStopsListOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 z-[9998] w-[calc(50%-1.25rem)] bg-white border-2 border-black p-3 cursor-pointer hover:bg-gray-50 flex flex-col shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <div className="font-bold text-black uppercase tracking-wider text-[10px] flex items-center gap-2">
            <FaListUl size={12} className="text-blue-600" />
            <span>Stops</span>
          </div>
          <div className="text-xs text-gray-700 font-mono font-bold mt-1">
            {locations.length} points
          </div>
        </div>
      )}

      {/* Sidebar (Dynamic Bottom Sheet on Mobile, Fixed on Large Screens) */}
      <aside className={`
        fixed z-[10000] bottom-0 left-0 right-0 h-[85dvh] bg-white p-5 flex flex-col transform transition-all duration-300 border-t-4 border-black shadow-[0_-8px_30px_rgba(0,0,0,0.2)] lg:static lg:w-72 lg:bg-gray-50 lg:border-t-0 lg:border-r-2 lg:border-gray-200 lg:translate-y-0 lg:z-auto lg:h-full lg:shadow-none
        ${stopsListOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 lg:opacity-100'}
      `}>
        <div className="lg:hidden flex items-center justify-between mb-4 border-b-2 border-gray-200 pb-2">
           <div>
             <span className="font-bold uppercase tracking-widest text-xs text-blue-600">Stop Management</span>
             <p className="text-[10px] text-gray-400 uppercase mt-0.5">Edit locations & demands</p>
           </div>
           <button onClick={() => setStopsListOpen(false)} className="p-1 border-2 border-black hover:bg-gray-100 transition-none shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
             <FaXmark size={20} />
           </button>
        </div>

        <button
          onClick={() => setUseCarto(!useCarto)}
          className="w-full px-4 py-2 font-bold uppercase tracking-wider text-xs border-2 border-purple-500 text-purple-700 bg-white transition-none hover:bg-purple-600 hover:text-white"
        >
          {useCarto ? " Detailed Map " : " Flat Map "}
        </button>

        <button
          onClick={locateUser}
          className="w-full px-4 py-2 mt-3 font-bold uppercase tracking-wider text-xs border-2 border-blue-500 text-blue-700 bg-white transition-none hover:bg-blue-600 hover:text-white flex items-center justify-center gap-2"
        >
          Locate Me
        </button>

        <h2 className="font-bold mb-3 mt-6 text-gray-800 uppercase tracking-widest border-b-2 border-gray-300 pb-2 text-sm shrink-0">Delivery Stops</h2>

        <div className="flex-1 overflow-y-auto brutalist-scrollbar px-1 min-h-0">
          {vehiclePolylines.length > 0 && deliveryDone && !deliveryStarted && (
            <div className="mb-3 p-3 bg-green-100 border-2 border-green-500 text-green-800 text-xs font-bold uppercase tracking-wider text-center relative flex justify-between items-center pr-8">
              <span className="flex-1 text-center">Delivery Complete</span>
              <button
                onClick={() => setDeliveryDone(false)}
                className="absolute right-2 px-2 py-1 text-green-600 hover:text-green-800"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {locations.length === 0 && (
            <div className="mt-2 border-2 border-gray-200 bg-white text-black">
              <div className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-700">How to get started</p>
              </div>
              <div className="p-4 space-y-5">
  
                {/* Steps */}
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="mt-0.5 text-[10px] font-bold bg-black text-white px-1.5 py-0.5 shrink-0">1</span>
                    <p className="text-xs text-gray-700">Click anywhere on the map to place your <strong>Depot</strong> (warehouse or start point).</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="mt-0.5 text-[10px] font-bold bg-black text-white px-1.5 py-0.5 shrink-0">2</span>
                    <p className="text-xs text-gray-700">Keep clicking to add <strong>customers</strong>. Set how many packages they need using the Demand input.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="mt-0.5 text-[10px] font-bold bg-black text-white px-1.5 py-0.5 shrink-0">3</span>
                    <p className="text-xs text-gray-700">Set your fleet details in the left panel, then hit <strong>Generate Plan</strong>.</p>
                  </div>
                </div>
  
                {/* Settings explained */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">What each setting means</p>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div>
                      <span className="font-bold text-black">Vehicle Capacity - </span>
                      How many packages one truck can deliver per trip before returning to reload.
                    </div>
                    <div>
                      <span className="font-bold text-black">No. of Vehicles - </span>
                      How many trucks are available. If there's too much work, extra deliveries roll over to the next shift.
                    </div>
                    <div>
                      <span className="font-bold text-black">Shift Hours - </span>
                      Max hours each driver can work. The planner fits as many trips as possible within this window.
                    </div>
                    <div>
                      <span className="font-bold text-black">Avg Speed - </span>
                      How fast trucks move on average. This affects how many trips can realistically fit in a shift.
                    </div>
                  </div>
                </div>
  
              </div>
            </div>
          )}
  
          {locations.length > 0 && locations[0] === null && (
            <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-400 text-amber-800 text-xs font-bold uppercase tracking-wider text-center animate-pulse">
              Depot Required
            </div>
          )}
  
          {locations.length > 0 && (
            <div className="space-y-3 mt-2 pb-4">
              {locations[0] && (
                <div className="relative p-3 bg-blue-100 border-2 border-blue-300 border-t-4 border-t-blue-600">
                  <button onClick={() => removeLocation(0)} title="Remove Depot" className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-none">X</button>
                  <strong className="text-blue-900 block mb-1 uppercase text-xs tracking-wider">Depot</strong>
                  <div className="text-[10px] font-mono text-blue-800 bg-white border border-blue-200 inline-block px-1.5 py-0.5">
                    {locations[0][0].toFixed(4)}, {locations[0][1].toFixed(4)}
                  </div>
                </div>
              )}
  
              {locations.slice(1).map((loc, i) => (
                <div key={i} className="relative p-3 bg-white border-2 border-gray-300 border-t-4 border-t-gray-800">
                  <button onClick={() => removeLocation(i + 1)} title="Remove Customer" className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition-none">X</button>
                  <div className="font-bold uppercase tracking-wider text-xs text-gray-800 mb-1">Customer {i + 1}</div>
                  <div className="text-[10px] font-mono text-gray-500 mb-3 bg-gray-100 border border-gray-200 inline-block px-1.5 py-0.5">
                    {loc[0].toFixed(4)}, {loc[1].toFixed(4)}
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-gray-100 pt-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Demand:</label>
                    <input
                      type="number"
                      min="1"
                      value={demands[i + 1] || 0}
                      onChange={(e) => handleDemandChange(i + 1, e.target.value)}
                      className="border-2 border-gray-300 px-2 py-1 w-16 text-xs text-center focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapContainer
          center={coords || [22.5726, 88.3639]} // Kolkata default center
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution={
              useCarto
                ? '© <a href="https://carto.com/">CARTO</a>'
                : '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            }
            url={
              useCarto
                ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

          <LocationClicker onMapClick={handleMapClick} />

          {/* Markers — show deferred customers with grey clock icon */}
          {locations.map((pos, idx) => {
            if (!pos) return null;
            const isDepot = idx === 0;
            const deferredCustomers = job?.result?.deferredCustomers || [];
            const unservableCustomers = job?.result?.unservableCustomers || [];
            const isDeferred = deferredCustomers.includes(idx) || unservableCustomers.includes(idx);

            const customIcon = isDepot
              ? depotIcon
              : isDeferred
                ? deferredIcon
                : new L.DivIcon({
                  html: ReactDOMServer.renderToString(
                    <div style={{ position: 'relative' }}>
                      <img src="https://cdn-icons-png.flaticon.com/512/1670/1670080.png"
                        style={{ width: '32px', height: '32px' }} alt="customer" />
                      <div style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        backgroundColor: '#2563eb', color: 'white', fontSize: '10px',
                        fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px',
                        border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>{idx}</div>
                    </div>
                  ),
                  className: "",
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                });

            return (
              <Marker key={idx} position={pos} icon={customIcon}>
                <Tooltip>
                  {isDepot
                    ? `Depot (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`
                    : isDeferred
                      ? `Customer ${idx} — Next Shift 🕐`
                      : `Customer ${idx} (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`}
                </Tooltip>
              </Marker>
            );
          })}

          {/* Per-trip colored polylines (all trips have different colors) */}
          {vehiclePolylines.flatMap((vp) =>
            vp.trips.map((trip, tIdx) => (
              <Polyline
                key={`v${vp.vehicleId}-t${trip.tripIndex}`}
                positions={trip.path}
                color={vehicleColors[trip.tripIndex % vehicleColors.length]}
                weight={4}
                opacity={0.8}
              />
            ))
          )}

          {/* Animated trucks — one per vehicle, staggered start */}
          {deliveryStarted && vehiclePolylines.map((vp, i) => (
            <TruckMarker
              key={i}
              path={vp.path}
              vehicleId={vp.vehicleId}
              color={vehicleColors[(vp.vehicleId - 1) % vehicleColors.length]}
              delay={i * 1500}
              onFinish={handleTruckDone}
            />
          ))}

          {coords && <SetInitialView coords={coords} setMapInstance={setMapInstance} />}

        </MapContainer>
      </main>
    </div>
  );
}
