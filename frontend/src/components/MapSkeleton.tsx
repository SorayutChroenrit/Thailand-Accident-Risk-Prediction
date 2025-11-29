import { Skeleton } from "~/components/ui/skeleton";
import { Search, MapPin } from "lucide-react";

export function MapSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Skeleton - Matches Header component height */}
      <div className="h-16 bg-white border-b border-gray-200 px-4">
        <div className="flex items-center justify-between h-full">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <div className="bg-white border-r border-gray-200 flex flex-col overflow-hidden w-96">
          {/* View All Events Button */}
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-11 w-full" />
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Skeleton className="h-10 w-full pl-10" />
            </div>

            {/* Latest Events Header */}
            <div className="mt-3 px-2 py-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* Traffic Index Widget */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>

          {/* Filter Results */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="shrink-0 w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Container Skeleton */}
        <div className="flex-1 relative bg-gray-100">
          {/* Loading animation in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          </div>

          {/* Category Filter Icons */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-20 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
