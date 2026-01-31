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
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminSettings() {
  const { t } = useLanguage();
  const { data: downloadStats } = trpc.dashboard.downloadStats.useQuery();
  const { data: licenseStats } = trpc.license.stats.useQuery();

  const handleExportLicenses = () => {
    toast.info(t('common.comingSoon'));
  };

  const handleUploadApp = () => {
    toast.info(t('common.comingSoon'));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wider">
            <span className="neon-text-cyan">{t('settings.title').split(' // ')[0]}</span>
            <span className="text-muted-foreground"> // </span>
            <span className="text-foreground">{t('settings.title').split(' // ')[1] || t('nav.settings')}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Application Distribution */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                {t('settings.appDistribution')}
              </CardTitle>
              <CardDescription>
                {t('settings.appDistributionDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{t('settings.currentVersion')}</p>
                    <p className="text-sm text-muted-foreground">KSABoom-Setup.exe</p>
                  </div>
                  <span className="font-display text-lg font-bold text-secondary">v1.0.0</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold">{downloadStats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.totalDownloads')}</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-secondary">{downloadStats?.today || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.today')}</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{downloadStats?.thisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.thisWeek')}</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleUploadApp} className="w-full" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {t('settings.uploadNewVersion')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('settings.uploadDesc')}
              </p>
            </CardContent>
          </Card>

          {/* License Management */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                {t('settings.licenseConfig')}
              </CardTitle>
              <CardDescription>
                {t('settings.licenseConfigDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold">{licenseStats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.totalKeys')}</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-green-500">{licenseStats?.active || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.active')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.defaultMaxActivations')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.perLicenseKey')}</p>
                  </div>
                  <Input type="number" defaultValue="1" className="w-20" min="1" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.autoExpire')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.neverExpire')}</p>
                  </div>
                  <Input type="number" defaultValue="0" className="w-20" min="0" />
                </div>
              </div>
              <Separator />
              <Button onClick={handleExportLicenses} variant="outline" className="w-full">
                <FileCode className="w-4 h-4 mr-2" />
                {t('settings.exportLicenses')}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('settings.securitySettings')}
              </CardTitle>
              <CardDescription>
                {t('settings.securitySettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.bruteForceProtection')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.bruteForceProtectionDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.hwidVerification')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.hwidVerificationDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.ipLogging')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.ipLoggingDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.securityEventAlerts')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.securityEventAlertsDesc')}</p>
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
                {t('settings.notifications')}
              </CardTitle>
              <CardDescription>
                {t('settings.notificationsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.newActivations')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.newActivationsDesc')}</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.failedActivations')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.failedActivationsDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.securityAlertsNotif')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.securityAlertsNotifDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.dailySummary')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.dailySummaryDesc')}</p>
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
              {t('settings.apiEndpoints')}
            </CardTitle>
            <CardDescription>
              {t('settings.apiEndpointsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t('settings.licenseValidation')}</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.validateLicense
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.licenseValidationDesc')}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t('settings.statusReport')}</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.reportStatus
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.statusReportDesc')}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/30 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t('settings.trackDownload')}</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">POST</code>
                </div>
                <code className="text-xs text-muted-foreground block">
                  /api/trpc/api.trackDownload
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.trackDownloadDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            className="font-display font-bold bg-primary hover:bg-primary/90"
            onClick={() => toast.success(t('settings.settingsSaved'))}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
