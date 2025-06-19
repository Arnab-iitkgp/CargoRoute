import React, { useState, useEffect } from "react";
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
import { FcShipped, FcFactory } from "react-icons/fc";

import "leaflet/dist/leaflet.css";
import ReactDOMServer from "react-dom/server";
// Icons
const depotIcon = new L.DivIcon({
  html: ReactDOMServer.renderToString(
    <FcFactory size={42} color="#eab308" /> // Golden colored depot
  ),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1670/1670080.png",
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
function TruckMarker({ path, delay = 0, onFinish }) {
  const [position, setPosition] = useState(null);
    delay=Math.min(delay, 1000)  // never more than 1 second
  useEffect(() => {
    if (!path || path.length < 2) return;

    let i = 0;
    setPosition(path[0]);

    const interval = setInterval(() => {
      i++;
      if (i >= path.length) {
        clearInterval(interval);
        onFinish?.(); // notify completion
        return;
      }
      setPosition(path[i]);
    }, 100+delay); // optional delay scaling

    return () => clearInterval(interval);
  }, [path]);

  if (!position) return null;

  // Convert FaTruck icon to a leaflet DivIcon
  const truckIcon = new L.DivIcon({
    html: ReactDOMServer.renderToString(
      <FcShipped size={28} color="#1e40af" /> // trck icon
    ),
    className: "", //
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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
}) {
  const [routePolylines, setRoutePolylines] = useState([]);
  const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [deliveryDone, setDeliveryDone] = useState(false);
  const [trucksCompleted, setTrucksCompleted] = useState(0);
const routeColors = [
  "red", "blue", "green", "purple", "orange", "teal", "pink", "indigo", "yellow", "cyan",
  "lime", "rose", "amber", "violet", "fuchsia", "emerald", "sky", "gray", "stone", "slate"
];
  const [useCarto, setUseCarto] = useState(false);

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
    if (deliveryStarted && trucksCompleted === routePolylines.length) {
      setDeliveryStarted(false);
      setDeliveryDone(true);
      alert("Delivery Completed.")
      setTrucksCompleted(0); // reset for next run
    }
  }, [trucksCompleted, deliveryStarted, routePolylines.length]);

  const handleMapClick = (latlng) => {
    setLocations((prev) => [...prev, latlng]);
    setDemands((prev) => [...prev, 1]); // default demand
  };

  const updateDemand = (index, value) => {
    const newDemands = [...demands];
    newDemands[index] = parseInt(value) || 0;
    setDemands(newDemands);
  };
  
  // Fetch road-following routes from OpenRouteService
  useEffect(() => {
    const fetchORSRoutes = async () => {
      if (!job?.result?.bestRoute || locations.length === 0) return;
      const allRoutes = [];

      for (const route of job.result.bestRoute) {
        const coords = route.map((idx) => locations[idx]);

        if (coords.some((pos) => !Array.isArray(pos) || pos.length !== 2))
          continue;

        try {
          const res = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            {
              coordinates: coords.map(([lat, lng]) => [lng, lat]), // ORS expects [lng, lat]
            },
            {
              headers: {
                Authorization: ORS_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          const geometry = res.data.features[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );

          allRoutes.push(geometry);
        } catch (err) {
          console.error("ORS API error:", err);
        }
      }

      setRoutePolylines(allRoutes);
    };

    fetchORSRoutes();
  }, [job, locations]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}

      <aside className="w-72 bg-gray-100 p-4 border-r overflow-auto">
        <button
          onClick={() => setUseCarto(!useCarto)}
          className="w-full px-4 py-2 bg-white border border-purple-400 text-purple-700 rounded hover:bg-purple-50 transition"
        >
          {useCarto ? "Switch View" : "Switch View"}
        </button>

        <h2 className="font-bold mb-2">Inputs</h2>

        {routePolylines.length > 0 && (
          <button
            onClick={() => {
              setDeliveryStarted(true);
              setDeliveryDone(false);
            }}
            className={`mb-4 w-full px-3 py-2 rounded text-white transition ${
              deliveryStarted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={deliveryStarted}
          >
            {deliveryStarted ? "🚚 Delivering..." : "Start Delivery"}
          </button>
        )}

        {locations.length === 0 && (
          <p className="text-gray-500 text-sm">
            Click on map to place depot first.
          </p>
        )}

        {locations.length > 0 && (
          <div className="space-y-3">
            <div className="p-2 bg-blue-100 rounded">
              <strong>Depot:</strong>
              <div className="text-xs text-gray-700">
                ({locations[0][0].toFixed(4)}, {locations[0][1].toFixed(4)})
              </div>
            </div>

            {locations.slice(1).map((loc, i) => (
              <div key={i} className="p-2 bg-white rounded shadow-sm">
                <div className="font-medium">Customer {i + 1}</div>
                <div className="text-xs text-gray-500 mb-1">
                  ({loc[0].toFixed(4)}, {loc[1].toFixed(4)})
                </div>
                <input
                  type="number"
                  min="1"
                  value={demands[i + 1] || 0} // ✅ Correct demand for customer (skip depot demand)
                  onChange={(e) => handleDemandChange(i + 1, e.target.value)} // ✅ Pass correct index
                  className="border px-2 py-1 rounded w-16"
                />
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapContainer
          center={[22.5726, 88.3639]} // Kolkata default center
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

          {/* Markers */}
          {locations.map((pos, idx) => (
            <Marker
              key={idx}
              position={pos}
              icon={idx === 0 ? depotIcon : customerIcon}
            >
              <Tooltip>
                {idx === 0
                  ? `Depot (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`
                  : `Customer ${idx} (${pos[0].toFixed(4)}, ${pos[1].toFixed(
                      4
                    )})`}
              </Tooltip>
            </Marker>
          ))}

          {/* Real-road Polyline paths */}
          {routePolylines.map((polyline, i) => (
            <Polyline
              key={i}
              positions={polyline}
              color={routeColors[i % routeColors.length]}
            />
          ))}
          {deliveryStarted &&
            routePolylines.map((path, i) => (
              <TruckMarker
                key={i}
                path={path}
                delay={(i * 100)}
                onFinish={handleTruckDone}
              />
            ))}
        </MapContainer>
      </main>
    </div>
  );
}
