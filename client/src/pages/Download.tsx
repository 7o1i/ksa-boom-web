import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Download as DownloadIcon, 
  ArrowLeft, 
  Monitor, 
  Shield, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Download() {
  const { t } = useLanguage();
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    expiresAt?: Date;
  } | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  const trackDownloadMutation = trpc.api.trackDownload.useMutation();
  const validateLicenseMutation = trpc.api.validateLicense.useMutation({
    onSuccess: (data) => {
      setValidationResult({
        valid: true,
        message: "License key is valid!",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });
    },
    onError: (error) => {
      setValidationResult({
        valid: false,
        message: error.message || "Invalid license key",
      });
    },
    onSettled: () => {
      setIsValidating(false);
    },
  });

  const handleDownload = async () => {
    // Track the download
    trackDownloadMutation.mutate({ appVersion: "1.0.0" });
    
    // For now, show a message about the download
    // In production, this would link to the actual .exe file in S3
    toast.info("Download will start shortly. The application requires a valid license key to run.");
    
    // Simulate download start - in production, redirect to S3 URL
    // window.location.href = "https://your-s3-bucket.s3.amazonaws.com/KSABoom-v1.0.0.exe";
  };

  const handleValidateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    validateLicenseMutation.mutate({
      licenseKey: licenseKey.trim(),
    });
  };

  const systemRequirements = [
    { label: "Operating System", value: "Windows 10/11 (64-bit)" },
    { label: "Processor", value: "Intel Core i3 or equivalent" },
    { label: "Memory", value: "4 GB RAM minimum" },
    { label: "Storage", value: "100 MB available space" },
    { label: "Display", value: "1280x720 resolution minimum" },
    { label: "Other", value: "Internet connection for license validation" },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center neon-border-gold">
              <span className="font-display text-primary font-bold">K</span>
            </div>
            <span className="font-display text-xl">
              <span className="text-primary neon-text-gold">KSA</span>
              <span className="text-secondary">,Boom</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container pt-32 pb-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            DOWNLOAD CENTER
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="neon-text-gold">Download</span>{" "}
            <span className="text-secondary">KSA,Boom</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get the latest version of KSA,Boom for Windows. A valid license key is required to use the application.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Download Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <DownloadIcon className="h-6 w-6 text-primary" />
                KSA,Boom for Windows
              </CardTitle>
              <CardDescription>Version 1.0.0 • Released January 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                <Monitor className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-semibold">Windows Application</p>
                  <p className="text-sm text-muted-foreground">64-bit executable • ~25 MB</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Digitally signed and verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Optimized for performance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-secondary" />
                  <span>License key required for activation</span>
                </div>
              </div>

              <Button 
                className="w-full neon-glow-gold" 
                size="lg"
                onClick={handleDownload}
              >
                <DownloadIcon className="h-5 w-5 mr-2" />
                Download for Windows
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By downloading, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* License Validation Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Key className="h-6 w-6 text-secondary" />
                Validate License Key
              </CardTitle>
              <CardDescription>Check if your license key is valid and active</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleValidateLicense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Input
                    id="licenseKey"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="outline"
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate License"
                  )}
                </Button>

                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.valid 
                      ? "bg-green-500/10 border-green-500/50" 
                      : "bg-red-500/10 border-red-500/50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={validationResult.valid ? "text-green-500" : "text-red-500"}>
                        {validationResult.message}
                      </span>
                    </div>
                    {validationResult.valid && validationResult.expiresAt && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Expires: {validationResult.expiresAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </form>

              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-4">
                  Don't have a license key?
                </p>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    View Subscription Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Requirements */}
        <Card className="max-w-5xl mx-auto mt-8 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display">System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {systemRequirements.map((req, idx) => (
                <div key={idx} className="flex justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">{req.label}</span>
                  <span className="font-medium">{req.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Installation Guide */}
        <Card className="max-w-5xl mx-auto mt-8 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display">Installation Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-medium">Download the installer</p>
                  <p className="text-sm text-muted-foreground">Click the download button above to get the latest version</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-medium">Run the installer</p>
                  <p className="text-sm text-muted-foreground">Double-click the downloaded .exe file and follow the installation wizard</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-medium">Enter your license key</p>
                  <p className="text-sm text-muted-foreground">When prompted, enter the license key you received via email</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="font-medium">Start using KSA,Boom</p>
                  <p className="text-sm text-muted-foreground">Once activated, you can start using all the features</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
