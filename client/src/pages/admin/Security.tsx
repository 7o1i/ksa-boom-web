import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle, Clock, Activity, Ban, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SecurityMonitor() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.security.stats.useQuery();
  const { data: allEvents, isLoading: loadingAll } = trpc.security.events.useQuery({ limit: 100 });
  const { data: unresolvedEvents, isLoading: loadingUnresolved } = trpc.security.events.useQuery({ 
    limit: 100, 
    unresolvedOnly: true 
  });

  const resolveMutation = trpc.security.resolve.useMutation({
    onSuccess: () => {
      utils.security.events.invalidate();
      utils.security.stats.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Event marked as resolved");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'brute_force_attempt':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'invalid_key':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'expired_key_attempt':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'revoked_key_attempt':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'hwid_mismatch':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'multiple_ip_activation':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const EventsTable = ({ events, isLoading, showResolveButton = true }: { 
    events: typeof allEvents; 
    isLoading: boolean;
    showResolveButton?: boolean;
  }) => (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="font-display w-[50px]"></TableHead>
            <TableHead className="font-display">Event Type</TableHead>
            <TableHead className="font-display">Severity</TableHead>
            <TableHead className="font-display">IP Address</TableHead>
            <TableHead className="font-display">Details</TableHead>
            <TableHead className="font-display">Time</TableHead>
            <TableHead className="font-display">Status</TableHead>
            {showResolveButton && <TableHead className="font-display w-[100px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={showResolveButton ? 8 : 7} className="text-center py-8 text-muted-foreground">
                Loading events...
              </TableCell>
            </TableRow>
          ) : events?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showResolveButton ? 8 : 7} className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No security events found</p>
              </TableCell>
            </TableRow>
          ) : (
            events?.map((event) => (
              <TableRow 
                key={event.id} 
                className={`border-border/30 ${
                  !event.resolved && event.severity === 'critical' ? 'bg-red-500/5' :
                  !event.resolved && event.severity === 'high' ? 'bg-orange-500/5' : ''
                }`}
              >
                <TableCell>{getEventIcon(event.eventType)}</TableCell>
                <TableCell className="font-medium">
                  {formatEventType(event.eventType)}
                </TableCell>
                <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                <TableCell>
                  <code className="text-sm bg-muted/50 px-2 py-0.5 rounded">
                    {event.ipAddress || 'Unknown'}
                  </code>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-muted-foreground truncate" title={event.details || ''}>
                    {event.details || '-'}
                  </p>
                  {event.attemptedKey && (
                    <code className="text-xs bg-muted/30 px-1 rounded">
                      Key: {event.attemptedKey.substring(0, 15)}...
                    </code>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell>
                  {event.resolved ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Open
                    </Badge>
                  )}
                </TableCell>
                {showResolveButton && (
                  <TableCell>
                    {!event.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveMutation.mutate({ id: event.id })}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider">
              <span className="neon-text-pink">SECURITY</span>
              <span className="text-muted-foreground"> // </span>
              <span className="text-foreground">MONITOR</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and respond to security events
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/30 bg-card/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Events</span>
                </div>
                <span className="font-display text-2xl font-bold">{stats?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">Unresolved</span>
                </div>
                <span className="font-display text-2xl font-bold text-yellow-500">{stats?.unresolved || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Critical</span>
                </div>
                <span className="font-display text-2xl font-bold text-red-500">{stats?.critical || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-secondary">Last 24h</span>
                </div>
                <span className="font-display text-2xl font-bold text-secondary">{stats?.last24h || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Table with Tabs */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Events
            </CardTitle>
            <CardDescription>Monitor and manage security incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="unresolved">
              <TabsList className="mb-4">
                <TabsTrigger value="unresolved" className="font-display">
                  Unresolved
                  {(stats?.unresolved || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                      {stats?.unresolved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="font-display">All Events</TabsTrigger>
              </TabsList>
              <TabsContent value="unresolved">
                <EventsTable events={unresolvedEvents} isLoading={loadingUnresolved} />
              </TabsContent>
              <TabsContent value="all">
                <EventsTable events={allEvents} isLoading={loadingAll} showResolveButton={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Security Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p><strong className="text-foreground">Brute Force:</strong> Multiple failed attempts from same IP. Consider blocking the IP address.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <p><strong className="text-foreground">HWID Mismatch:</strong> License used on different hardware. Verify with customer.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p><strong className="text-foreground">Invalid Key:</strong> Someone tried a non-existent key. May indicate key guessing.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p><strong className="text-foreground">Expired/Revoked:</strong> Attempted use of invalid license. May need customer follow-up.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
