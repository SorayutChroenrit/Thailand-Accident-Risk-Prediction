import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Activity,
  Cloud,
  Car,
  BarChart3,
  Bell,
  ArrowRight,
  Shield,
  AlertTriangle,
  Skull,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { useLanguage } from "~/contexts/LanguageContext";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-4">
                <Zap className="mr-1 h-3 w-3" />
                {t("landing.hero.badge")}
              </Badge>
              <h1 className="text-4xl font-bold sm:text-6xl leading-tight">
                {t("landing.hero.title")}{" "}
                <span className="text-primary">
                  {t("landing.hero.titleHighlight")}
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t("landing.hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/map">
                  <Button size="xl" className="gap-2">
                    <MapPin className="h-5 w-5" />
                    {t("landing.hero.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/predict">
                  <Button size="xl" variant="outline" className="gap-2">
                    <Target className="h-5 w-5" />
                    {t("landing.hero.ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section className="border-y bg-card py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("landing.stats.predictions")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">94%</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("landing.stats.accuracy")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">77</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("landing.stats.areas")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("landing.stats.updates")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl">
                {t("landing.features.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t("landing.features.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Cloud className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">
                    {t("landing.features.realtime.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.features.realtime.description")}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">
                    {t("landing.features.ai.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.features.ai.description")}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">
                    {t("landing.features.visualization.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.features.visualization.description")}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">
                    {t("landing.features.alerts.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.features.alerts.description")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Risk Severity Section */}
        <section className="bg-card py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl">
                {t("landing.severity.title")}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              {/* Low Risk */}
              <Card className="border-risk-low/50 bg-risk-low/5">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-risk-low/20">
                    <Shield className="h-8 w-8 text-risk-low" />
                  </div>
                  <CardTitle className="mt-4 text-risk-low">
                    {t("landing.severity.low")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.severity.lowDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <Badge variant="success" className="text-sm">
                      0-33% Risk Score
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Medium Risk */}
              <Card className="border-risk-medium/50 bg-risk-medium/5">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-risk-medium/20">
                    <AlertTriangle className="h-8 w-8 text-risk-medium" />
                  </div>
                  <CardTitle className="mt-4 text-risk-medium">
                    {t("landing.severity.medium")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.severity.mediumDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <Badge variant="warning" className="text-sm">
                      34-66% Risk Score
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* High Risk */}
              <Card className="border-risk-high/50 bg-risk-high/5">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-risk-high/20">
                    <Skull className="h-8 w-8 text-risk-high" />
                  </div>
                  <CardTitle className="mt-4 text-risk-high">
                    {t("landing.severity.high")}
                  </CardTitle>
                  <CardDescription>
                    {t("landing.severity.highDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <Badge variant="danger" className="text-sm">
                      67-100% Risk Score
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl">
                {t("landing.dataIntegration.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t("landing.dataIntegration.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Cloud className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {t("landing.dataIntegration.weather.title")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("landing.dataIntegration.weather.source")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t("landing.dataIntegration.weather.items.0")}</li>
                    <li>{t("landing.dataIntegration.weather.items.1")}</li>
                    <li>{t("landing.dataIntegration.weather.items.2")}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Car className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {t("landing.dataIntegration.traffic.title")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("landing.dataIntegration.traffic.source")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t("landing.dataIntegration.traffic.items.0")}</li>
                    <li>{t("landing.dataIntegration.traffic.items.1")}</li>
                    <li>{t("landing.dataIntegration.traffic.items.2")}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {t("landing.dataIntegration.historical.title")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("landing.dataIntegration.historical.source")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t("landing.dataIntegration.historical.items.0")}</li>
                    <li>{t("landing.dataIntegration.historical.items.1")}</li>
                    <li>{t("landing.dataIntegration.historical.items.2")}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              {t("landing.cta.subtitle")}
            </p>
            <div className="mt-8">
              <Link to="/predict">
                <Button size="xl" variant="secondary" className="gap-2">
                  <Target className="h-5 w-5" />
                  {t("landing.cta.button")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
