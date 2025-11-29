import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { 
  AlertTriangle, 
  Lightbulb, 
  Construction, 
  Waves, 
  HelpCircle,
  Car,
  Signal,
  Wrench,
  XCircle,
  TreePine,
  Cat,
  CloudFog,
  Flame
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  currentLocation: { lat: number; lon: number } | null;
}

export function ReportDialog({
  open,
  onOpenChange,
  onSubmit,
  currentLocation,
}: ReportDialogProps) {
  const [category, setCategory] = useState("pothole");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation) return;

    setSubmitting(true);
    try {
      await onSubmit({
        category,
        description,
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        title: getCategoryTitle(category),
        reporter_name: reporterName || "Anonymous",
      });
      setDescription("");
      setReporterName("");
      setCategory("pothole");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case "accident": return t("reporting.categories.accident");
      case "traffic_jam": return t("reporting.categories.traffic_jam");
      case "flooding": return t("reporting.categories.flooding");
      case "construction": return t("reporting.categories.construction");
      case "pothole": return t("reporting.categories.pothole");
      case "lighting": return t("reporting.categories.lighting");
      case "traffic_light": return t("reporting.categories.traffic_light");
      case "breakdown": return t("reporting.categories.breakdown");
      case "road_closed": return t("reporting.categories.road_closed");
      case "fallen_tree": return t("reporting.categories.fallen_tree");
      case "animal": return t("reporting.categories.animal");
      case "visibility": return t("reporting.categories.visibility");
      case "fire": return t("reporting.categories.fire");
      default: return t("reporting.categories.other");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("reporting.title")}</DialogTitle>
          <DialogDescription>
            {t("reporting.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category">{t("reporting.form.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t("reporting.form.category")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="accident">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>{t("reporting.categories.accident")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="traffic_jam">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-orange-600" />
                    <span>{t("reporting.categories.traffic_jam")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="flooding">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-blue-500" />
                    <span>{t("reporting.categories.flooding")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="construction">
                  <div className="flex items-center gap-2">
                    <Construction className="h-4 w-4 text-amber-500" />
                    <span>{t("reporting.categories.construction")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="pothole">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>{t("reporting.categories.pothole")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="lighting">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span>{t("reporting.categories.lighting")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="traffic_light">
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4 text-red-500" />
                    <span>{t("reporting.categories.traffic_light")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="breakdown">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-600" />
                    <span>{t("reporting.categories.breakdown")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="road_closed">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-700" />
                    <span>{t("reporting.categories.road_closed")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="fallen_tree">
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4 text-green-700" />
                    <span>{t("reporting.categories.fallen_tree")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="animal">
                  <div className="flex items-center gap-2">
                    <Cat className="h-4 w-4 text-amber-700" />
                    <span>{t("reporting.categories.animal")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="visibility">
                  <div className="flex items-center gap-2">
                    <CloudFog className="h-4 w-4 text-gray-400" />
                    <span>{t("reporting.categories.visibility")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="fire">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>{t("reporting.categories.fire")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                    <span>{t("reporting.categories.other")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("reporting.form.details")}</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t("reporting.form.detailsPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reporter">{t("reporting.form.reporter")}</Label>
            <input
              id="reporter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t("reporting.form.reporterPlaceholder")}
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {t("predict.location")}: {currentLocation?.lat.toFixed(6)}, {currentLocation?.lon.toFixed(6)}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("reporting.form.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
