import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Pricing() {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: string; amount: number; currency: string } | null>(null);

  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setOrderComplete(data);
      toast.success("Order placed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place order");
    },
  });

  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
    setIsDialogOpen(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !customerEmail) return;

    createOrderMutation.mutate({
      planId: selectedPlan,
      customerEmail,
      customerName: customerName || undefined,
    });
  };

  const getPlanIcon = (duration: string) => {
    switch (duration) {
      case "weekly": return <Zap className="h-8 w-8" />;
      case "monthly": return <Rocket className="h-8 w-8" />;
      case "yearly": return <Crown className="h-8 w-8" />;
      default: return <Zap className="h-8 w-8" />;
    }
  };

  const getPlanFeatures = (features: string | null) => {
    if (!features) return [];
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  };

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
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            SUBSCRIPTION PLANS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="neon-text-gold">Choose</span>{" "}
            <span className="text-secondary">Your Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select the subscription that fits your needs. All plans include full access to KSA,Boom features.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50 ${
                  plan.duration === "monthly" ? "md:scale-105 border-primary/30" : ""
                }`}
              >
                {plan.duration === "monthly" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getPlanIcon(plan.duration)}
                  </div>
                  <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="capitalize">{plan.duration} subscription</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-display font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.currency}</span>
                  </div>
                  <ul className="space-y-3 text-left">
                    {getPlanFeatures(plan.features).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full neon-glow-gold" 
                    size="lg"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-4">
                After placing your order, our team will contact you via email to verify payment. 
                Once confirmed, your license key will be generated and sent to your email address.
              </p>
              <p className="text-sm">
                For payment inquiries, contact us at: <span className="text-primary">hack1pro6@gmail.com</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-border/50 bg-card">
          {orderComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-primary">Order Placed Successfully!</DialogTitle>
                <DialogDescription>
                  Your order has been received and is pending confirmation.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="font-mono text-lg font-bold text-primary">{orderComplete.orderNumber}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-lg font-bold">{orderComplete.amount} {orderComplete.currency}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We will contact you at <span className="text-primary">{customerEmail}</span> to verify payment. 
                  Once confirmed, your license key will be sent to this email.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setIsDialogOpen(false);
                  setOrderComplete(null);
                  setCustomerEmail("");
                  setCustomerName("");
                }}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Complete Your Order</DialogTitle>
                <DialogDescription>
                  Enter your details to place your order. We'll contact you to verify payment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitOrder}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your license key will be sent to this email
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrderMutation.isPending || !customerEmail}>
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
