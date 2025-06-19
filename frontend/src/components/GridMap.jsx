import React, { useRef, useState, useEffect, useMemo } from "react";
import { FaTruckMoving, FaHome } from "react-icons/fa";

const ROUTE_COLORS = [
  "stroke-red-500",
  "stroke-green-500",
  "stroke-blue-500",
  "stroke-yellow-500",
  "stroke-purple-500",
];

export default function GridMap({ locations, routes }) {
  // 1) Layout math
  const xs = locations.map((p) => p[0]);
  const ys = locations.map((p) => p[1]);
  const maxX = Math.max(...xs),
    maxY = Math.max(...ys);
  const size = 600,
    pad = 40;
  const project = ([x, y]) => ({
    x: pad + (x / maxX) * (size - 2 * pad),
    y: size - pad - (y / maxY) * (size - 2 * pad),
  });

  // 2) Precompute path metadata
  const meta = useMemo(
    () =>
      routes.map((route) => {
        const pts = route.map((idx) => project(locations[idx]));
        const segLens = pts.slice(1).map(
          (p1, i) => Math.hypot(p1.x - pts[i].x, p1.y - pts[i].y)
        );
        const cumLens = [0, ...segLens];
        for (let i = 1; i < cumLens.length; i++) {
          cumLens[i] += cumLens[i - 1];
        }
        return {
          pts,
          cumLens,
          totalLen: cumLens[cumLens.length - 1],
        };
      }),
    [locations, routes]
  );

  // 3) Animation state
  const [positions, setPositions] = useState(meta.map((m) => m.pts[0]));
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const raf = useRef();

  // 4) Drive the animation once
  useEffect(() => {
    if (!running) return;
    const DURATION = 20 * 1000; // 20 seconds

    function step(timestamp) {
      if (!startTime) setStartTime(timestamp);
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / DURATION, 1);

      // update each truck
      const newPos = meta.map(({ pts, cumLens, totalLen }) => {
        const dist = t * totalLen;
        let i = cumLens.findIndex((cl) => cl > dist) - 1;
        if (i < 0) i = cumLens.length - 2;
        const segStart = cumLens[i];
        const segLen = cumLens[i + 1] - segStart;
        const localT = segLen ? (dist - segStart) / segLen : 0;
        const p0 = pts[i],
          p1 = pts[i + 1];
        return {
          x: p0.x + (p1.x - p0.x) * localT,
          y: p0.y + (p1.y - p0.y) * localT,
        };
      });

      setPositions(newPos);

      if (t < 1) raf.current = requestAnimationFrame(step);
      else setRunning(false);
    }

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [running, startTime, meta]);

  // 5) Render
  return (
    <div>
      <button
        onClick={() => {
          setRunning(true);
          setStartTime(0);
        }}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        disabled={running}
      >
        {running ? "Delivering…" : "Start Delivery"}
      </button>

      <div className="relative">
        <svg width={size} height={size} className="border bg-white rounded">
          {/* Grid */}
          {[...Array(11)].map((_, i) => {
            const pos = pad + (i * (size - 2 * pad)) / 10;
            return (
              <g key={i} className="stroke-gray-200">
                <line x1={pad} y1={pos} x2={size - pad} y2={pos} />
                <line x1={pos} y1={pad} x2={pos} y2={size - pad} />
              </g>
            );
          })}

          {/* Routes */}
          {routes.map((route, i) => {
            const isActive = running && i === 0;
            const colorClass = ROUTE_COLORS[i % ROUTE_COLORS.length];
            const points = route
              .map((idx) => {
                const { x, y } = project(locations[idx]);
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <polyline
                key={i}
                points={points}
                fill="none"
                strokeWidth={isActive ? 4 : 2}
                strokeDasharray={isActive ? "0" : "4,4"}
                className={`${colorClass} ${isActive ? "opacity-100" : "opacity-30"}`}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {locations.map((pt, i) => {
          const { x, y } = project(pt);
          const isDepot = i === 0;
          const Icon = isDepot ? FaTruckMoving : FaHome;
          return (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: x, top: y }}
            >
              <div
                className={`rounded-full p-2 shadow-md ${
                  isDepot ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="text-[10px] mt-1 text-gray-700 bg-white px-1 rounded shadow-sm">
                {isDepot ? `Depot (${pt[0]},${pt[1]})` : `C${i} (${pt[0]},${pt[1]})`}
              </div>
            </div>
          );
        })}

        {/* Moving trucks */}
        {positions.map((pos, i) => (
          <div
            key={`truck-${i}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: pos.x, top: pos.y }}
          >
            <FaTruckMoving
              size={18}
              className={ROUTE_COLORS[i % ROUTE_COLORS.length]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
