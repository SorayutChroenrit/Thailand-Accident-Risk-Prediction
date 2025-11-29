import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { useLanguage } from "~/contexts/LanguageContext";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:10000/reports?status=pending");
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching pending reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`http://localhost:10000/reports/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Remove from list
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error(`Error updating report status to ${status}:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("approvals.title")}</h1>
            <p className="text-gray-500 mt-1">{t("approvals.navTitle")}</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {reports.length}
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">{t("approvals.noPending")}</h3>
            <p className="text-gray-500 mt-2">{t("approvals.allHandled")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("approvals.date")}</TableHead>
                  <TableHead className="w-[100px]">{t("approvals.time")}</TableHead>
                  <TableHead className="w-[80px]">{t("approvals.year")}</TableHead>
                  <TableHead>{t("approvals.topic")}</TableHead>
                  <TableHead>{t("approvals.category")}</TableHead>
                  <TableHead>{t("approvals.details")}</TableHead>
                  <TableHead>{t("approvals.reporter")}</TableHead>
                  <TableHead className="text-right">{t("approvals.manage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const date = new Date(report.pubDate);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {date.toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                      </TableCell>
                      <TableCell>
                        {date.toLocaleTimeString(language === "th" ? "th-TH" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>{language === "th" ? date.getFullYear() + 543 : date.getFullYear()}</TableCell>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={report.description}>
                        {report.description || "-"}
                      </TableCell>
                      <TableCell>{report.reporter || "Anonymous"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 h-8 px-2"
                            onClick={() => handleStatusUpdate(report.id, "rejected")}
                            title={t("approvals.reject")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                            onClick={() => handleStatusUpdate(report.id, "approved")}
                            title={t("approvals.approve")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
