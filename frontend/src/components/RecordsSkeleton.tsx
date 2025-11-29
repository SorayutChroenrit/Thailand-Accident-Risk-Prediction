import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Search, Filter, CalendarIcon } from "lucide-react";

export function RecordsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="p-3 h-14 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      {/* Search Filters Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-blue-600" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Date Range */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              {/* Start Date */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-center">
                  <Skeleton className="w-14 h-10" />
                  <Skeleton className="w-20 h-10" />
                  <Skeleton className="w-20 h-10" />
                </div>
                <Skeleton className="h-10 w-10" />
              </div>

              <Skeleton className="h-4 w-8" />

              {/* End Date */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-center">
                  <Skeleton className="w-14 h-10" />
                  <Skeleton className="w-20 h-10" />
                  <Skeleton className="w-20 h-10" />
                </div>
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-11 w-full" />
            </div>

            {/* Per Page */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-11 w-full" />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Results Summary */}
          <div className="flex items-center gap-5">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-14 w-40" />
              <Skeleton className="h-14 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
            <tr>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-3 w-12 bg-blue-400/50" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-3 w-24 bg-blue-400/50" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-3 w-16 bg-blue-400/50" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-3 w-32 bg-blue-400/50" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-3 w-20 bg-blue-400/50" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="hover:bg-blue-50">
                <td className="px-6 py-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Skeleton */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-1">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
