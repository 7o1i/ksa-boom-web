import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Eye,
  DollarSign,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Orders() {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const { data: stats } = trpc.orders.stats.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();

  const confirmMutation = trpc.orders.confirm.useMutation({
    onSuccess: (data) => {
      toast.success(t('orders.orderConfirmed'));
      utils.orders.list.invalidate();
      utils.orders.stats.invalidate();
      setConfirmingId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm order");
      setConfirmingId(null);
    },
  });

  const cancelMutation = trpc.orders.cancel.useMutation({
    onSuccess: () => {
      toast.success(t('orders.orderCancelled'));
      utils.orders.list.invalidate();
      utils.orders.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });

  const getPlanName = (planId: number) => {
    const plan = plans?.find(p => p.id === planId);
    return plan?.name || "Unknown Plan";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><Clock className="h-3 w-3 mr-1" />{t('dashboard.pending')}</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="border-green-500/50 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('orders.confirmedOrders')}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-red-500/50 text-red-500"><XCircle className="h-3 w-3 mr-1" />{t('orders.cancelledOrders')}</Badge>;
      case "refunded":
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleConfirm = (orderId: number) => {
    setConfirmingId(orderId);
    confirmMutation.mutate({ id: orderId });
  };

  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const confirmedOrders = orders?.filter(o => o.status === "confirmed") || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wider">
            <span className="neon-text-gold">{t('orders.title').split(' // ')[0]}</span>
            <span className="text-muted-foreground"> // </span>
            <span className="text-foreground">{t('orders.title').split(' // ')[1] || t('nav.orders')}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{t('orders.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{t('orders.allOrders')}</CardDescription>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {stats?.total || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{t('orders.pendingOrders')}</CardDescription>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {stats?.pending || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{t('orders.confirmedOrders')}</CardDescription>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {stats?.confirmed || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.revenue')}</CardDescription>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {stats?.totalRevenue || 0} SAR
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="font-display">{t('nav.orders')}</CardTitle>
            <CardDescription>{t('orders.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  {t('orders.pendingOrders')} ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  {t('orders.confirmedOrders')} ({confirmedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  {t('orders.allOrders')} ({orders?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <OrdersTable 
                  orders={pendingOrders}
                  isLoading={isLoading}
                  getPlanName={getPlanName}
                  getStatusBadge={getStatusBadge}
                  onView={(order) => { setSelectedOrder(order); setIsViewOpen(true); }}
                  onConfirm={handleConfirm}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                  confirmingId={confirmingId}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="confirmed">
                <OrdersTable 
                  orders={confirmedOrders}
                  isLoading={isLoading}
                  getPlanName={getPlanName}
                  getStatusBadge={getStatusBadge}
                  onView={(order) => { setSelectedOrder(order); setIsViewOpen(true); }}
                  onConfirm={handleConfirm}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                  confirmingId={confirmingId}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="all">
                <OrdersTable 
                  orders={orders || []}
                  isLoading={isLoading}
                  getPlanName={getPlanName}
                  getStatusBadge={getStatusBadge}
                  onView={(order) => { setSelectedOrder(order); setIsViewOpen(true); }}
                  onConfirm={handleConfirm}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                  confirmingId={confirmingId}
                  t={t}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Order Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="border-border/50 bg-card">
            <DialogHeader>
              <DialogTitle className="font-display">{t('common.view')} {t('nav.orders')}</DialogTitle>
              <DialogDescription>
                {t('orders.orderNumber')}{selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('orders.status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('orders.amount')}</p>
                    <p className="font-bold">{selectedOrder.amount} {selectedOrder.currency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.customer')}</p>
                  <p className="font-mono">{selectedOrder.customerEmail}</p>
                </div>
                {selectedOrder.customerName && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pricing.yourName')}</p>
                    <p>{selectedOrder.customerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.plan')}</p>
                  <p>{getPlanName(selectedOrder.planId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.date')}</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>{t('common.close')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function OrdersTable({ 
  orders, 
  isLoading, 
  getPlanName, 
  getStatusBadge, 
  onView, 
  onConfirm, 
  onCancel,
  confirmingId,
  t
}: {
  orders: any[];
  isLoading: boolean;
  getPlanName: (id: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onView: (order: any) => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  confirmingId: number | null;
  t: (key: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('orders.noOrders')}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30">
            <TableHead>{t('orders.orderNumber')}</TableHead>
            <TableHead>{t('orders.customer')}</TableHead>
            <TableHead>{t('orders.plan')}</TableHead>
            <TableHead>{t('orders.amount')}</TableHead>
            <TableHead>{t('orders.status')}</TableHead>
            <TableHead>{t('orders.date')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-border/30">
              <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{order.customerName || "-"}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </div>
              </TableCell>
              <TableCell>{getPlanName(order.planId)}</TableCell>
              <TableCell>{order.amount} {order.currency}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('common.view')}
                    </DropdownMenuItem>
                    {order.status === "pending" && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => onConfirm(order.id)}
                          disabled={confirmingId === order.id}
                        >
                          {confirmingId === order.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {t('orders.confirm')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onCancel(order.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('orders.cancel')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
