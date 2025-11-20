import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Shield, MapPin } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { useLanguage } from "~/contexts/LanguageContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { language } = useLanguage();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = (credentialResponse: any) => {
    login(credentialResponse);
    navigate({ to: "/" });
  };

  const handleError = () => {
    console.error("Login failed");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {language === "en" ? "Welcome Back" : "ยินดีต้อนรับ"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Sign in to access all features"
                : "เข้าสู่ระบบเพื่อใช้งานทุกฟีเจอร์"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features list */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  {language === "en"
                    ? "Access Risk Prediction"
                    : "เข้าถึงการทำนายความเสี่ยง"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  {language === "en"
                    ? "Route Risk Analysis"
                    : "วิเคราะห์ความเสี่ยงเส้นทาง"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  {language === "en"
                    ? "View History & Reports"
                    : "ดูประวัติและรายงาน"}
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <div className="flex justify-center pt-4">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                locale={language === "th" ? "th" : "en"}
              />
            </div>

            {/* Info text */}
            <p className="text-xs text-center text-muted-foreground">
              {language === "en"
                ? "Free features (Map, Dashboard) are available without login"
                : "ฟีเจอร์ฟรี (แผนที่, แดชบอร์ด) ใช้งานได้โดยไม่ต้องเข้าสู่ระบบ"}
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
