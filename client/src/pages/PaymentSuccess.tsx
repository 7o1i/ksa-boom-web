import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle, ArrowLeft, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PaymentSuccess() {
  const { t } = useLanguage();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get('session_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');

  const { data: paymentStatus, isLoading, error } = trpc.stripe.checkPayment.useQuery(
    { sessionId: sessionId || '' },
    { 
      enabled: !!sessionId,
      refetchInterval: status === 'pending' ? 3000 : false,
    }
  );

  useEffect(() => {
    if (paymentStatus) {
      if (paymentStatus.status === 'completed') {
        setStatus('success');
      } else if (paymentStatus.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('failed');
      }
    } else if (error) {
      setStatus('failed');
    }
  }, [paymentStatus, error]);

  const renderContent = () => {
    if (status === 'loading' || isLoading) {
      return (
        <>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <CardTitle className="font-display">Processing Payment</CardTitle>
          <CardDescription>Please wait while we verify your payment...</CardDescription>
        </>
      );
    }
    
    if (status === 'success') {
      return (
        <>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="font-display text-green-500">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been processed successfully. Your license key will be sent to your email shortly.
          </CardDescription>
        </>
      );
    }
    
    if (status === 'pending') {
      return (
        <>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
          </div>
          <CardTitle className="font-display text-yellow-500">Payment Pending</CardTitle>
          <CardDescription>
            Your payment is being processed. This page will update automatically.
          </CardDescription>
        </>
      );
    }
    
    return (
      <>
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <CardTitle className="font-display text-red-500">Payment Failed</CardTitle>
        <CardDescription>
          There was an issue processing your payment. Please try again or contact support.
        </CardDescription>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="text-center">
          {renderContent()}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-2">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Check your email for your license key</li>
                <li>2. Download the KSA,Boom application</li>
                <li>3. Enter your license key to activate</li>
              </ul>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Link href="/download">
                <Button className="w-full neon-glow-gold">
                  <Download className="h-4 w-4 mr-2" />
                  Download Application
                </Button>
              </Link>
            )}
            
            {status === 'failed' && (
              <Link href="/pricing">
                <Button className="w-full">
                  Try Again
                </Button>
              </Link>
            )}
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
