import { Link } from "@tanstack/react-router";
import { MapPin, Github, Mail, ExternalLink } from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">{t("common.appName")}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.links")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/map"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.map")}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              </li>
              <li>
                <Link
                  to="/predict"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.predict")}
                </Link>
              </li>
              <li>
                <Link
                  to="/records"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.history")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.resources")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://iticfoundation.org/open-data-sharing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  ITIC Foundation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://datagov.mot.go.th/dataset/7e077ffd-dc4f-4dc6-a71c-0813726f3c12"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  MOT Data Catalog
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://openweathermap.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Weather API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://developer.tomtom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Traffic API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@saferoute.th"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  contact@saferoute.th
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {t("common.appName")}.{" "}
            {t("footer.rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
