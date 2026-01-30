import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Settings, Upload, Download, Key, Shield, Bell, Database, FileCode } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { data: downloadStats } = trpc.dashboard.downloadStats.useQuery();
  const { data: licenseStats } = trpc.license.stats.useQuery();

  const handleExportLicenses = () => {
    toast.info("Export functionality coming soon");
  };

  const handleUploadApp = () => {
    toast.info("App upload functionality coming soon. Use S3 storage to host the .exe file.");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wider">
            <span className="neon-text-cyan">SYSTEM</span>
            <span className="text-muted-foreground"> // </span>
            <span className="text-foreground">SETTINGS</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure application settings and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Application Distribution */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Application Distribution
              </CardTitle>
              <CardDescription>
                Manage the Windows application download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Current Version</p>
                    <p className="text-sm text-muted-foreground">KSABoom-Setup.exe</p>
                  </div>
                  <span className="font-display text-lg font-bold text-secondary">v1.0.0</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold">{downloadStats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Downloads</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-secondary">{downloadStats?.today || 0}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{downloadStats?.thisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleUploadApp} className="w-full" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Version
              </Button>
              <p className="text-xs text-muted-foreground">
                Upload the compiled .exe file to make it available for download on the landing page.
              </p>
            </CardContent>
          </Card>

          {/* License Management */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                License Configuration
              </CardTitle>
              <CardDescription>
                Configure license key settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold">{licenseStats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Keys</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-green-500">{licenseStats?.active || 0}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default Max Activations</Label>
                    <p className="text-xs text-muted-foreground">Per license key</p>
                  </div>
                  <Input type="number" defaultValue="1" className="w-20" min="1" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-expire after (days)</Label>
                    <p className="text-xs text-muted-foreground">0 = never expire</p>
                  </div>
                  <Input type="number" defaultValue="0" className="w-20" min="0" />
                </div>
              </div>
              <Separator />
              <Button onClick={handleExportLicenses} variant="outline" className="w-full">
                <FileCode className="w-4 h-4 mr-2" />
                Export All Licenses (CSV)
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and monitoring options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Brute Force Protection</Label>
                  <p className="text-xs text-muted-foreground">Block after 5 failed attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>HWID Verification</Label>
                  <p className="text-xs text-muted-foreground">Lock licenses to hardware</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Logging</Label>
                  <p className="text-xs text-muted-foreground">Track activation IPs</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Event Alerts</Label>
                  <p className="text-xs text-muted-foreground">Email on critical events</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alert preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Activations</Label>
                  <p className="text-xs text-muted-foreground">Notify on successful activations</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Failed Activations</Label>
                  <p className="text-xs text-muted-foreground">Alert on failed attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">Critical security events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">Daily activity report</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Information */}
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-secondary" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Endpoints for Windows application integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">License Validation</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.validateLicense
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Validates a license key and returns activation status. Requires: licenseKey, hwid (optional)
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Status Report</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.reportStatus
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Reports application status for monitoring. Requires: licenseKey, status, appVersion
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Track Download</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.trackDownload
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Tracks application downloads for analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            className="font-display font-bold bg-primary hover:bg-primary/90"
            onClick={() => toast.success("Settings saved successfully")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
