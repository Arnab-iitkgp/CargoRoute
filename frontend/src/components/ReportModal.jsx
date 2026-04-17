import React, { useState } from "react";

const VEHICLE_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#65a30d",
];

function Tooltip({ text }) {
  const [pos, setPos] = useState(null);
  const ref = React.useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top, left: r.left + r.width / 2 });
    }
  };

  return (
    <span className="inline-block ml-1 align-middle" style={{ position: "relative" }}>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPos(null)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-400 text-[8px] font-bold cursor-help leading-none select-none"
      >
        i
      </span>
      {pos && (
        <span
          style={{
            position: "fixed",
            top: pos.top - 8,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 99999,
            width: "160px",
            pointerEvents: "none",
          }}
          className="bg-black text-white text-[10px] font-normal leading-snug px-2 py-1.5 shadow-lg normal-case tracking-normal"
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></span>
        </span>
      )}
    </span>
  );
}

function UtilBar({ used, max, color }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-black mb-1 font-mono uppercase">
        <span>Shift: {(used * 60).toFixed(0)} / {(max * 60).toFixed(0)} min</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 border border-gray-300">
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ReportModal({
  job,
  onClose,
  onStartDelivery,
  onStopDelivery,
  deliveryStarted,
  maxShiftHours = 8,
  numVehicles = 2,
  isMinimized,
  setIsMinimized
}) {
  if (!job?.result) return null;

  const {
    vehicles = [],
    deferredCustomers = [],
    unservableCustomers = [],
    makespan = 0,
    numVehiclesUsed = 0,
    minVehiclesNeeded = 0,
    coveredKm = 0,
    totalKm = 0,
    recommendations = null,
  } = job.result;

  const totalDeferred = deferredCustomers.length + unservableCustomers.length;
  const totalServed = (job.locations?.length || 1) - 1 - totalDeferred;
  const avgUtil = vehicles.length > 0
    ? Math.round(vehicles.reduce((s, v) => s + (v.finishTime / maxShiftHours) * 100, 0) / vehicles.length)
    : 0;

  const insights = [];
  if (totalDeferred === 0) insights.push(`All ${totalServed} customers served in one shift.`);
  if (totalDeferred > 0) insights.push(`${totalDeferred} customer(s) deferred to next shift.`);
  const bottleneck = vehicles.reduce((a, b) => (a.finishTime > b.finishTime ? a : b), { finishTime: 0, id: "-" });
  if (bottleneck.finishTime > 0) insights.push(`Bottleneck: Vehicle ${bottleneck.id} (${(bottleneck.finishTime * 60).toFixed(0)} min)`);
  insights.push(`Average Fleet Utilization: ${avgUtil}%`);
  if (vehicles.length > 0) {
    const longestVehicle = vehicles.reduce((a, b) => a.totalKm > b.totalKm ? a : b);
    insights.push(`Longest Route: Vehicle ${longestVehicle.id} (${longestVehicle.totalKm.toFixed(2)} km)`);
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-black p-3 cursor-pointer hover:bg-gray-50 flex flex-col shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none w-[calc(50%-1.25rem)] lg:w-auto lg:flex-row lg:items-center lg:gap-4"
      >
        <div className="font-bold text-black uppercase tracking-wider text-[10px] lg:text-sm">Report</div>
        <div className="text-xs text-gray-700 font-mono font-bold mt-1 lg:mt-0">
          {totalKm.toFixed(1)} km
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[85dvh] z-[10001] bg-white border-t-4 border-black lg:border-t-0 lg:bg-transparent lg:top-4 lg:right-4 lg:bottom-4 lg:left-auto lg:h-auto lg:z-[9999] lg:pointer-events-none lg:flex lg:items-start lg:justify-end lg:p-0">
      <div className="relative bg-white lg:border-2 lg:border-black w-full h-full lg:h-auto lg:max-w-lg lg:max-h-[90vh] flex flex-col pointer-events-auto rounded-none lg:shadow-[8px_8px_0px_#000]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black text-white px-5 py-3 flex items-center justify-between border-b-2 border-black">
          <div>
            <h2 className="text-base font-bold uppercase tracking-widest leading-none mb-1">Delivery Report</h2>
            <div className="text-[10px] font-mono opacity-70">VRPMT / Genetic Algorithm</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 flex items-center justify-center border-2 border-white/20 hover:bg-white/10 text-white font-mono text-lg transition-none"
              title="Minimize"
            >
              —
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border-2 border-white/20 hover:bg-red-500 hover:border-red-500 text-white font-mono text-sm transition-none"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-6 flex-1 overflow-y-auto brutalist-scrollbar">

          {/* Core Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-300 border border-black">
            {[
              {
                label: "Distance",
                value: `${coveredKm.toFixed(1)}km`,
                sub: totalDeferred > 0
                  ? `of ${totalKm.toFixed(1)}km planned`
                  : `${totalServed} / ${totalServed + totalDeferred} served`,
                tip: totalDeferred > 0
                  ? `Covered: ${coveredKm.toFixed(1)}km (routes driven today). Full plan including deferred trips would be ${totalKm.toFixed(1)}km.`
                  : "Total travel distance for all served routes."
              },
              { label: "Makespan", value: `${(makespan * 60).toFixed(0)}m`, tip: "Total time from first departure to last delivery — how long the whole operation takes." },
              { label: "Fleet", value: `${numVehiclesUsed}/${numVehicles}`, tip: "Vehicles actually used out of the total available." },
              { label: "Deferred", value: totalDeferred, tip: "Customers who couldn't be reached within today's shift. They'll be served next shift." },
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-3 flex flex-col justify-between">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                  {s.label}{s.tip && <Tooltip text={s.tip} />}
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-black leading-none">{s.value}</div>
                  {s.sub && <div className="text-[9px] text-gray-400 font-mono mt-1 uppercase">{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Advisory */}
          {minVehiclesNeeded > numVehicles && (
            <div className="border border-black p-3 bg-gray-50 text-xs">
              <span className="font-bold text-black uppercase">Advisory: </span>
              Requires ≥ {minVehiclesNeeded} vehicles to complete perfectly within shifting limits.
            </div>
          )}

          {/* Vehicles */}
          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Vehicle Assignments</h3>
            <div className="space-y-4">
              {vehicles.map((v, vi) => {
                const vehicleColor = VEHICLE_COLORS[(v.id - 1) % VEHICLE_COLORS.length];
                return (
                  <div key={v.id} className="border border-black bg-white">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-black bg-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-black" style={{ backgroundColor: vehicleColor }} />
                        <span className="font-bold text-sm uppercase">Vehicle {v.id}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600">{v.trips.length} Trip(s) | {v.totalKm.toFixed(2)} km</span>
                    </div>

                    <div className="p-3 space-y-3">
                      {v.trips.map((trip, ti) => {
                        const detail = v.tripDetails?.[ti] || {};

                        let globalTripIdx = 0;
                        for (let i = 0; i < vi; i++) globalTripIdx += vehicles[i].trips.length;
                        globalTripIdx += ti;
                        const tripColor = VEHICLE_COLORS[globalTripIdx % VEHICLE_COLORS.length];

                        return (
                          <div key={ti}>
                            {ti > 0 && <div className="text-[10px] text-gray-500 font-mono mb-1">↳ +30 min reload</div>}
                            <div className="border border-gray-300 p-2">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: tripColor }} />
                                  <span className="text-xs font-bold uppercase">Trip {ti + 1}</span>
                                </div>
                                <div className="flex gap-2 text-[10px] font-mono text-gray-600">
                                  <span>{detail.distanceKm?.toFixed(2) ?? '-'} km</span>
                                  <span>{detail.durationMinutes ?? '-'}m</span>
                                  <span>Load: {detail.load ?? '-'}</span>
                                </div>
                              </div>
                              <div className="text-[10px] font-mono text-black leading-relaxed">
                                {trip.map((idx, i) => (
                                  <span key={i}>
                                    <span className={idx === 0 ? "font-bold" : ""}>
                                      {idx === 0 ? 'DEPOT' : `C${idx}`}
                                    </span>
                                    {i < trip.length - 1 && <span className="text-gray-400 mx-1">→</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <UtilBar used={v.finishTime} max={maxShiftHours} color={vehicleColor} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deferred */}
          {totalDeferred > 0 && (
            <div className="border border-black bg-white p-4">
              <h3 className="font-bold text-black uppercase text-xs mb-2">Deferred</h3>
              <p className="text-xs text-black font-mono">
                [ {[...deferredCustomers, ...unservableCustomers].join(", ")} ] postponed to next shift.
              </p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="border-2 border-blue-500 bg-blue-50 p-4">
              <h3 className="font-bold text-blue-800 uppercase text-xs mb-3 border-b border-blue-200 pb-2">Suggested Configurations</h3>
              <p className="text-[10px] text-blue-600 font-mono mb-3 uppercase">To eliminate all {totalDeferred} deferred deliveries:</p>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-white border border-blue-200">
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 shrink-0 uppercase mt-0.5">
                      {rec.type === 'vehicles' ? 'Fleet' : rec.type === 'shift' ? 'Time' : rec.type === 'speed' ? 'Speed' : 'Combo'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-black">{rec.label}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{rec.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="border border-black p-4">
            <h3 className="font-bold text-black text-xs uppercase mb-3">Logs</h3>
            <ul className="text-xs text-black font-mono space-y-1">
              {insights.map((ins, i) => (
                <li key={i} className="before:content-['>'] before:mr-2 before:text-gray-400">{ins}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="p-5 border-t-2 border-black bg-white sticky bottom-0">
          {deliveryStarted ? (
            <button
              onClick={() => onStopDelivery()}
              className="w-full py-3 font-bold uppercase tracking-wider border-2 border-red-600 bg-red-600 text-white transition-none hover:bg-red-700 hover:border-red-700"
            >
              Stop Delivery
            </button>
          ) : (
            <button
              onClick={() => {
                onStartDelivery();
                setIsMinimized(true);
              }}
              className="w-full py-3 font-bold uppercase tracking-wider border-2 border-black bg-white text-black transition-none hover:bg-black hover:text-white"
            >
              Start Delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
