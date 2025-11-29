import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RouteIcon, MapPin, Navigation } from "lucide-react";

export function RouteAnalysisSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-md">
            <RouteIcon className="h-8 w-8 text-white" />
          </div>
          <Skeleton className="h-9 w-72" />
        </div>
        <Skeleton className="h-4 w-96 ml-16" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input & Map */}
        <div className="space-y-4">
          {/* Trip Planning Card */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-white">
              <CardTitle className="text-base flex items-center gap-2">
                <RouteIcon className="h-5 w-5 text-purple-600" />
                <Skeleton className="h-6 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* To */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-12 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Analyze Button */}
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <Skeleton className="h-6 w-24" />
                </CardTitle>
                <Skeleton className="h-9 w-9 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Placeholder */}
        <div className="space-y-4">
          <Card className="shadow-lg border border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="h-10 w-10 text-purple-600" />
              </div>
              <Skeleton className="h-7 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
