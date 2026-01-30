import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Copy, Key, MoreHorizontal, Plus, Trash2, Edit, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function LicenseManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingLicense, setEditingLicense] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: licenses, isLoading } = trpc.license.list.useQuery();
  const { data: stats } = trpc.license.stats.useQuery();

  const createMutation = trpc.license.create.useMutation({
    onSuccess: () => {
      utils.license.list.invalidate();
      utils.license.stats.invalidate();
      setIsCreateOpen(false);
      toast.success("License key created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.license.update.useMutation({
    onSuccess: () => {
      utils.license.list.invalidate();
      utils.license.stats.invalidate();
      setIsEditOpen(false);
      setEditingLicense(null);
      toast.success("License updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.license.delete.useMutation({
    onSuccess: () => {
      utils.license.list.invalidate();
      utils.license.stats.invalidate();
      setDeleteId(null);
      toast.success("License deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      assignedTo: formData.get("assignedTo") as string || undefined,
      assignedEmail: formData.get("assignedEmail") as string || undefined,
      maxActivations: parseInt(formData.get("maxActivations") as string) || 1,
      notes: formData.get("notes") as string || undefined,
      status: formData.get("status") as "active" | "pending" || "pending",
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLicense) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingLicense.id,
      assignedTo: formData.get("assignedTo") as string || null,
      assignedEmail: formData.get("assignedEmail") as string || null,
      maxActivations: parseInt(formData.get("maxActivations") as string) || 1,
      notes: formData.get("notes") as string || null,
      status: formData.get("status") as "active" | "pending" | "expired" | "revoked",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("License key copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider">
              <span className="neon-text-pink">LICENSE</span>
              <span className="text-muted-foreground"> // </span>
              <span className="text-foreground">MANAGEMENT</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage activation keys
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-display font-bold bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Generate Key
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="font-display">Generate New License Key</DialogTitle>
                <DialogDescription>
                  Create a new activation key for distribution
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
                    <Input id="assignedTo" name="assignedTo" placeholder="Customer name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignedEmail">Email (Optional)</Label>
                    <Input id="assignedEmail" name="assignedEmail" type="email" placeholder="customer@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxActivations">Max Activations</Label>
                    <Input id="maxActivations" name="maxActivations" type="number" min="1" defaultValue="1" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select name="status" defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea id="notes" name="notes" placeholder="Internal notes about this license" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Generating..." : "Generate Key"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/30 bg-card/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-bold text-foreground">{stats?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-500">Active</span>
                <span className="font-display text-2xl font-bold text-green-500">{stats?.active || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-500">Pending</span>
                <span className="font-display text-2xl font-bold text-yellow-500">{stats?.pending || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-500">Revoked</span>
                <span className="font-display text-2xl font-bold text-red-500">{stats?.revoked || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Table */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              License Keys
            </CardTitle>
            <CardDescription>All generated license keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="font-display">License Key</TableHead>
                    <TableHead className="font-display">Status</TableHead>
                    <TableHead className="font-display">Assigned To</TableHead>
                    <TableHead className="font-display">Activations</TableHead>
                    <TableHead className="font-display">Created</TableHead>
                    <TableHead className="font-display w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading licenses...
                      </TableCell>
                    </TableRow>
                  ) : licenses?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No license keys generated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    licenses?.map((license) => (
                      <TableRow key={license.id} className="border-border/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                              {license.licenseKey}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(license.licenseKey)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(license.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{license.assignedTo || '-'}</p>
                            {license.assignedEmail && (
                              <p className="text-xs text-muted-foreground">{license.assignedEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={license.currentActivations >= license.maxActivations ? 'text-orange-500' : ''}>
                            {license.currentActivations} / {license.maxActivations}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(license.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(license.licenseKey)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Key
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingLicense(license);
                                setIsEditOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(license.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingLicense(null);
        }}>
          <DialogContent className="border-border/50 bg-card">
            <DialogHeader>
              <DialogTitle className="font-display">Edit License</DialogTitle>
              <DialogDescription>
                Update license key details
              </DialogDescription>
            </DialogHeader>
            {editingLicense && (
              <form onSubmit={handleEdit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>License Key</Label>
                    <code className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
                      {editingLicense.licenseKey}
                    </code>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignedTo">Assigned To</Label>
                    <Input
                      id="edit-assignedTo"
                      name="assignedTo"
                      defaultValue={editingLicense.assignedTo || ''}
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignedEmail">Email</Label>
                    <Input
                      id="edit-assignedEmail"
                      name="assignedEmail"
                      type="email"
                      defaultValue={editingLicense.assignedEmail || ''}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-maxActivations">Max Activations</Label>
                    <Input
                      id="edit-maxActivations"
                      name="maxActivations"
                      type="number"
                      min="1"
                      defaultValue={editingLicense.maxActivations}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={editingLicense.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      name="notes"
                      defaultValue={editingLicense.notes || ''}
                      placeholder="Internal notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="border-border/50 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Delete License Key?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The license key will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
