import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Key, Download, Shield, Activity, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentActivations } = trpc.license.recentActivations.useQuery({ limit: 5 });
  const { data: securityEvents } = trpc.security.events.useQuery({ limit: 5, unresolvedOnly: true });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider">
              <span className="neon-text-cyan">CONTROL</span>
              <span className="text-muted-foreground"> // </span>
              <span className="text-foreground">PANEL</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              System overview and monitoring
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Licenses"
            value={stats?.licenses.total}
            icon={<Key className="h-5 w-5" />}
            description={`${stats?.licenses.active || 0} active`}
            isLoading={isLoading}
            accent="pink"
          />
          <StatsCard
            title="Downloads"
            value={stats?.downloads.total}
            icon={<Download className="h-5 w-5" />}
            description={`${stats?.downloads.today || 0} today`}
            isLoading={isLoading}
            accent="cyan"
          />
          <StatsCard
            title="Security Events"
            value={stats?.security.unresolved}
            icon={<Shield className="h-5 w-5" />}
            description={`${stats?.security.critical || 0} critical`}
            isLoading={isLoading}
            accent="pink"
            alert={stats?.security.critical ? stats.security.critical > 0 : false}
          />
          <StatsCard
            title="Last 24h Events"
            value={stats?.security.last24h}
            icon={<Activity className="h-5 w-5" />}
            description="Security events"
            isLoading={isLoading}
            accent="cyan"
          />
        </div>

        {/* License Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MiniStatCard
            label="Active"
            value={stats?.licenses.active || 0}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            isLoading={isLoading}
          />
          <MiniStatCard
            label="Pending"
            value={stats?.licenses.pending || 0}
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
            isLoading={isLoading}
          />
          <MiniStatCard
            label="Expired"
            value={stats?.licenses.expired || 0}
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
            isLoading={isLoading}
          />
          <MiniStatCard
            label="Revoked"
            value={stats?.licenses.revoked || 0}
            icon={<Shield className="h-4 w-4 text-red-500" />}
            isLoading={isLoading}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activations */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <CardTitle className="font-display text-lg">Recent Activations</CardTitle>
              </div>
              <CardDescription>Latest license activation attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivations?.slice(0, 5).map((activation) => (
                  <div
                    key={activation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activation.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {activation.machineName || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activation.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${activation.success ? 'text-green-500' : 'text-red-500'}`}>
                        {activation.success ? 'Success' : 'Failed'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activation.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!recentActivations || recentActivations.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="font-display text-lg">Security Alerts</CardTitle>
              </div>
              <CardDescription>Unresolved security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents?.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg border bg-background/50 ${
                      event.severity === 'critical' ? 'border-red-500/50' :
                      event.severity === 'high' ? 'border-orange-500/50' :
                      'border-border/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${
                        event.severity === 'critical' ? 'text-red-500' :
                        event.severity === 'high' ? 'text-orange-500' :
                        event.severity === 'medium' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {event.eventType.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                        event.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                        event.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {event.severity}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!securityEvents || securityEvents.length === 0) && (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No unresolved security events
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
  isLoading,
  accent,
  alert = false,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  description: string;
  isLoading: boolean;
  accent: 'pink' | 'cyan';
  alert?: boolean;
}) {
  const borderClass = accent === 'pink' ? 'border-primary/30 hover:border-primary/50' : 'border-secondary/30 hover:border-secondary/50';
  const iconClass = accent === 'pink' ? 'text-primary' : 'text-secondary';

  return (
    <Card className={`relative border bg-card/50 transition-colors ${borderClass} ${alert ? 'border-destructive/50' : ''}`}>
      {/* Corner accent */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${accent === 'pink' ? 'border-primary/50' : 'border-secondary/50'}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${accent === 'pink' ? 'border-primary/50' : 'border-secondary/50'}`} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={iconClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`font-display text-3xl font-bold ${accent === 'pink' ? 'text-primary' : 'text-secondary'}`}>
            {value ?? 0}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Card className="border-border/30 bg-card/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-8" />
          ) : (
            <span className="font-display text-xl font-bold">{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
