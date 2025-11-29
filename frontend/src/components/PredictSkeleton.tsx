import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";
import { Crosshair, Loader2 } from "lucide-react";

export function PredictSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-700 rounded-full opacity-20 animate-ping"></div>
        </div>
        <Skeleton className="h-6 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}

export function PredictMapSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {/* Full Screen Map Skeleton */}
      <div className="absolute inset-0 bg-gray-100" />

      {/* Top Bar Skeleton */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="flex items-center gap-2">
          <Card className="flex-1 shadow-xl border-0 bg-white/95">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Skeleton className="h-[58px] w-[58px] rounded" />
        </div>
      </div>

      {/* Risk Score Card Skeleton - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="shadow-2xl border-0 bg-white/95">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Location Button Skeleton - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Skeleton className="h-14 w-48 rounded-md shadow-2xl" />
      </div>
    </div>
  );
}
