import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, Shield, Zap, Target, Eye, Settings, ChevronRight, Monitor, Lock, Activity } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const trackDownload = trpc.api.trackDownload.useMutation();

  const handleDownload = async () => {
    await trackDownload.mutateAsync({});
    // TODO: Replace with actual download URL from S3
    window.open('/downloads/KSABoom-Setup.exe', '_blank');
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center neon-border-pink">
              <span className="font-display font-bold text-lg neon-text-pink">K</span>
            </div>
            <span className="font-display text-xl font-bold tracking-wider">
              <span className="neon-text-pink">KSA</span>
              <span className="text-muted-foreground">,</span>
              <span className="neon-text-cyan">Boom</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="compact" />
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline" className="border-primary/50 hover:border-primary hover:neon-border-pink">
                      <Shield className="w-4 h-4 mr-2" />
                      {t('nav.adminPanel')}
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  {t('nav.welcome')}, <span className="text-primary">{user?.name || 'User'}</span>
                </span>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="border-secondary/50 hover:border-secondary hover:neon-border-cyan">
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* HUD Frame */}
            <div className="relative p-8 mb-8">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
              
              <div className="inline-block px-4 py-1 mb-6 border border-secondary/50 rounded-full">
                <span className="text-sm text-secondary font-medium tracking-wider uppercase">
                  {t('landing.badge')}
                </span>
              </div>
              
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-wider">
                <span className="neon-text-pink neon-flicker">KSA</span>
                <span className="text-muted-foreground">,</span>
                <span className="neon-text-cyan">Boom</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('landing.tagline')}
                <span className="text-foreground"> {t('landing.precision')}</span>
              </p>
            </div>

            {/* Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleDownload}
                className="relative group px-8 py-6 text-lg font-display font-bold tracking-wider bg-primary hover:bg-primary/90 neon-glow-pink transition-all duration-300"
              >
                <Download className="w-5 h-5 mr-2" />
                {t('landing.download')}
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('landing.version')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="neon-text-cyan">{t('landing.featuresTitle').split(' // ')[0]}</span>
              <span className="text-muted-foreground"> // </span>
              <span className="text-foreground">{t('landing.featuresTitle').split(' // ')[1] || 'FEATURES'}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <FeatureCard 
              icon={<Target className="w-6 h-6" />}
              title={t('landing.feature.colorDetection')}
              description={t('landing.feature.colorDetectionDesc')}
              accent="pink"
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title={t('landing.feature.instantResponse')}
              description={t('landing.feature.instantResponseDesc')}
              accent="cyan"
            />
            <FeatureCard 
              icon={<Eye className="w-6 h-6" />}
              title={t('landing.feature.regionSelection')}
              description={t('landing.feature.regionSelectionDesc')}
              accent="pink"
            />
            <FeatureCard 
              icon={<Settings className="w-6 h-6" />}
              title={t('landing.feature.fullControl')}
              description={t('landing.feature.fullControlDesc')}
              accent="cyan"
            />
            <FeatureCard 
              icon={<Monitor className="w-6 h-6" />}
              title={t('landing.feature.multiMonitor')}
              description={t('landing.feature.multiMonitorDesc')}
              accent="pink"
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6" />}
              title={t('landing.feature.secureLicensing')}
              description={t('landing.feature.secureLicensingDesc')}
              accent="cyan"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border/30 bg-card/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <StatCard value="<1ms" label={t('landing.stats.responseTime')} />
            <StatCard value="60+" label={t('landing.stats.fpsTracking')} />
            <StatCard value="99.9%" label={t('landing.stats.accuracy')} />
            <StatCard value="24/7" label={t('landing.stats.support')} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="relative max-w-3xl mx-auto text-center p-8 rounded-lg border border-border/50 bg-card/50">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-secondary" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-secondary" />
            
            <Activity className="w-12 h-12 mx-auto mb-4 text-primary neon-text-pink" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              {t('landing.cta.title').split('Dominate')[0]}<span className="neon-text-pink">Dominate</span>?
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('landing.cta.subtitle')}
            </p>
            <Button 
              size="lg" 
              onClick={handleDownload}
              className="font-display font-bold tracking-wider bg-primary hover:bg-primary/90 neon-glow-pink"
            >
              <Download className="w-5 h-5 mr-2" />
              {t('landing.cta.button')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold">
                <span className="neon-text-pink">KSA</span>
                <span className="text-muted-foreground">,</span>
                <span className="neon-text-cyan">Boom</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('landing.footer')}
            </p>
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-primary hover:underline">
                {t('nav.adminPanel')}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  accent: 'pink' | 'cyan';
}) {
  const borderClass = accent === 'pink' ? 'hover:border-primary' : 'hover:border-secondary';
  const iconClass = accent === 'pink' ? 'text-primary' : 'text-secondary';
  
  return (
    <div className={`relative p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 ${borderClass} hover:bg-card/80 group`}>
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${accent === 'pink' ? 'border-primary/50' : 'border-secondary/50'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${accent === 'pink' ? 'border-primary/50' : 'border-secondary/50'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      <div className={`${iconClass} mb-4`}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6">
      <div className="font-display text-4xl md:text-5xl font-bold neon-text-cyan mb-2">
        {value}
      </div>
      <div className="text-sm text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
