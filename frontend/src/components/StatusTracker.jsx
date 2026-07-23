const STEPS = [
  { key: "pending", label: "Dipesan", icon: "🧾" },
  { key: "picked_up", label: "Dijemput", icon: "🚴" },
  { key: "in_process", label: "Dicuci", icon: "🌀" },
  { key: "ready", label: "Siap Antar", icon: "✅" },
  { key: "delivered", label: "Diantar", icon: "🏠" },
];

export default function StatusTracker({ status }) {
  if (status === "cancelled") {
    return (
      <div className="bg-coral-100 text-coral-600 rounded-xl2 px-4 py-3 font-medium text-sm">
        Pesanan ini telah dibatalkan.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-start min-w-[480px] sm:min-w-full">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIndex;
          const isLast = idx === STEPS.length - 1;
          return (
            <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors ${
                    done ? "bg-blue-900 text-white shadow-sm" : "bg-blue-900/10 text-blue-900/40"
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-[11px] font-medium text-center whitespace-nowrap ${done ? "text-blue-950 font-bold" : "text-ink/40"}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mb-5 -mx-1 ${idx < currentIndex ? "bg-blue-900" : "bg-blue-900/10"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
