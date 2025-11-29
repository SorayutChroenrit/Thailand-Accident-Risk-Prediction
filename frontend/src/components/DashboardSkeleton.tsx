import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  BarChart3,
  Filter,
  MapPin,
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
} from "lucide-react";

export function DashboardSkeleton() {
  return (
    <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="ml-16">
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 shadow-lg border border-gray-200 bg-white">
          <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Filters
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                  <MapPin className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div>
                  <Skeleton className="h-8 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="text-left sm:text-right">
                <Skeleton className="h-10 w-24 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
          {/* Fatal */}
          <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                <span className="text-gray-700">Fatal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>

          {/* Serious */}
          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                <span className="text-gray-700">Serious</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>

          {/* Minor */}
          <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                <span className="text-gray-700">Minor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>

          {/* Property Damage */}
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                <span className="text-gray-700">Property</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                <span className="text-gray-700">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2 columns width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Map */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <Skeleton className="h-6 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full h-[500px] bg-gray-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-pulse">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>

            {/* Vehicle Types Chart */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Severity Distribution */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-[250px] w-full rounded-full mx-auto" />
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>

            {/* Weather Distribution */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Provinces */}
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
