import { Shield, Route } from "lucide-react";

export function Logo({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const containerSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex ${containerSize} items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg`}>
        <Shield className={`${iconSize} text-white absolute`} strokeWidth={2.5} />
        <Route className={`${iconSize} text-white/80 absolute scale-75 translate-y-0.5`} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-gray-900 ${size === "lg" ? "text-2xl" : "text-xl"}`}>
          Safe<span className="text-blue-600">Route</span>
        </span>
      </div>
    </div>
  );
}
