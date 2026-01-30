import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Supported languages with their native names
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// English translations (default)
const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    'nav.adminPanel': 'Admin Panel',
    'nav.welcome': 'Welcome',
    'nav.dashboard': 'Dashboard',
    'nav.licenses': 'Licenses',
    'nav.security': 'Security',
    'nav.settings': 'Settings',
    'nav.backToSite': 'Back to Site',
    'nav.signOut': 'Sign out',
    
    // Landing Page
    'landing.badge': 'ADVANCED COLOR DETECTION SYSTEM',
    'landing.tagline': 'Professional-grade color tracking and automated mouse control for Windows.',
    'landing.precision': 'Precision. Speed. Control.',
    'landing.download': 'DOWNLOAD FOR WINDOWS',
    'landing.version': 'v1.0.0 • Windows 10/11 • 64-bit',
    'landing.featuresTitle': 'SYSTEM // FEATURES',
    'landing.featuresSubtitle': 'Engineered for performance, designed for precision',
    'landing.feature.colorDetection': 'Color Detection',
    'landing.feature.colorDetectionDesc': 'Advanced pixel-level color tracking with customizable tolerance and multi-color support.',
    'landing.feature.instantResponse': 'Instant Response',
    'landing.feature.instantResponseDesc': 'Sub-millisecond detection with optimized algorithms for real-time performance.',
    'landing.feature.regionSelection': 'Region Selection',
    'landing.feature.regionSelectionDesc': 'Define specific screen regions to optimize performance and reduce false positives.',
    'landing.feature.fullControl': 'Full Control',
    'landing.feature.fullControlDesc': 'Adjustable click rates, tracking sensitivity, and customizable hotkeys.',
    'landing.feature.multiMonitor': 'Multi-Monitor',
    'landing.feature.multiMonitorDesc': 'Seamless support for multi-monitor setups with independent region tracking.',
    'landing.feature.secureLicensing': 'Secure Licensing',
    'landing.feature.secureLicensingDesc': 'Hardware-locked activation with encrypted license validation.',
    'landing.stats.responseTime': 'RESPONSE TIME',
    'landing.stats.fpsTracking': 'FPS TRACKING',
    'landing.stats.accuracy': 'ACCURACY',
    'landing.stats.support': 'SUPPORT',
    'landing.cta.title': 'Ready to Dominate?',
    'landing.cta.subtitle': 'Download KSA,Boom now and experience the next level of color tracking technology.',
    'landing.cta.button': 'GET STARTED',
    'landing.footer': '© 2024 KSA,Boom. All rights reserved.',
    
    // Dashboard
    'dashboard.title': 'CONTROL // PANEL',
    'dashboard.subtitle': 'System overview and monitoring',
    'dashboard.totalLicenses': 'Total Licenses',
    'dashboard.downloads': 'Downloads',
    'dashboard.securityEvents': 'Security Events',
    'dashboard.last24hEvents': 'Last 24h Events',
    'dashboard.active': 'Active',
    'dashboard.pending': 'Pending',
    'dashboard.expired': 'Expired',
    'dashboard.revoked': 'Revoked',
    'dashboard.recentActivations': 'Recent Activations',
    'dashboard.recentActivationsDesc': 'Latest license activation attempts',
    'dashboard.securityAlerts': 'Security Alerts',
    'dashboard.securityAlertsDesc': 'Unresolved security events',
    'dashboard.noRecentActivations': 'No recent activations',
    'dashboard.noSecurityEvents': 'No unresolved security events',
    'dashboard.success': 'Success',
    'dashboard.failed': 'Failed',
    'dashboard.unknownDevice': 'Unknown Device',
    'dashboard.today': 'today',
    'dashboard.critical': 'critical',
    'dashboard.securityEventsLabel': 'Security events',
    
    // License Management
    'license.title': 'LICENSE // MANAGEMENT',
    'license.subtitle': 'Create and manage activation keys',
    'license.generateKey': 'Generate Key',
    'license.total': 'Total',
    'license.licenseKeys': 'License Keys',
    'license.allGeneratedKeys': 'All generated license keys',
    'license.licenseKey': 'License Key',
    'license.status': 'Status',
    'license.assignedTo': 'Assigned To',
    'license.activations': 'Activations',
    'license.created': 'Created',
    'license.noLicenses': 'No license keys generated yet',
    'license.copyKey': 'Copy Key',
    'license.edit': 'Edit',
    'license.delete': 'Delete',
    'license.generateNew': 'Generate New License Key',
    'license.generateNewDesc': 'Create a new activation key for distribution',
    'license.assignedToOptional': 'Assigned To (Optional)',
    'license.customerName': 'Customer name',
    'license.emailOptional': 'Email (Optional)',
    'license.maxActivations': 'Max Activations',
    'license.initialStatus': 'Initial Status',
    'license.notesOptional': 'Notes (Optional)',
    'license.internalNotes': 'Internal notes about this license',
    'license.cancel': 'Cancel',
    'license.generating': 'Generating...',
    'license.editLicense': 'Edit License',
    'license.editLicenseDesc': 'Update license key details',
    'license.saving': 'Saving...',
    'license.saveChanges': 'Save Changes',
    'license.deleteConfirm': 'Delete License Key?',
    'license.deleteConfirmDesc': 'This action cannot be undone. The license key will be permanently deleted.',
    'license.keyCopied': 'License key copied to clipboard',
    'license.createSuccess': 'License key created successfully',
    'license.updateSuccess': 'License updated successfully',
    'license.deleteSuccess': 'License deleted successfully',
    
    // Security
    'security.title': 'SECURITY // MONITOR',
    'security.subtitle': 'Track and respond to security events',
    'security.totalEvents': 'Total Events',
    'security.unresolved': 'Unresolved',
    'security.critical': 'Critical',
    'security.last24h': 'Last 24h',
    'security.securityEvents': 'Security Events',
    'security.securityEventsDesc': 'Monitor and manage security incidents',
    'security.unresolvedTab': 'Unresolved',
    'security.allEventsTab': 'All Events',
    'security.eventType': 'Event Type',
    'security.severity': 'Severity',
    'security.ipAddress': 'IP Address',
    'security.details': 'Details',
    'security.time': 'Time',
    'security.statusLabel': 'Status',
    'security.noEvents': 'No security events found',
    'security.resolved': 'Resolved',
    'security.open': 'Open',
    'security.resolve': 'Resolve',
    'security.resolveSuccess': 'Event marked as resolved',
    'security.guidelines': 'Security Guidelines',
    'security.bruteForce': 'Brute Force:',
    'security.bruteForceDesc': 'Multiple failed attempts from same IP. Consider blocking the IP address.',
    'security.hwidMismatch': 'HWID Mismatch:',
    'security.hwidMismatchDesc': 'License used on different hardware. Verify with customer.',
    'security.invalidKey': 'Invalid Key:',
    'security.invalidKeyDesc': 'Someone tried a non-existent key. May indicate key guessing.',
    'security.expiredRevoked': 'Expired/Revoked:',
    'security.expiredRevokedDesc': 'Attempted use of invalid license. May need customer follow-up.',
    
    // Settings
    'settings.title': 'SYSTEM // SETTINGS',
    'settings.subtitle': 'Configure application settings and preferences',
    'settings.appDistribution': 'Application Distribution',
    'settings.appDistributionDesc': 'Manage the Windows application download',
    'settings.currentVersion': 'Current Version',
    'settings.totalDownloads': 'Total Downloads',
    'settings.thisWeek': 'This Week',
    'settings.uploadNewVersion': 'Upload New Version',
    'settings.uploadDesc': 'Upload the compiled .exe file to make it available for download on the landing page.',
    'settings.licenseConfig': 'License Configuration',
    'settings.licenseConfigDesc': 'Configure license key settings',
    'settings.totalKeys': 'Total Keys',
    'settings.defaultMaxActivations': 'Default Max Activations',
    'settings.perLicenseKey': 'Per license key',
    'settings.autoExpire': 'Auto-expire after (days)',
    'settings.neverExpire': '0 = never expire',
    'settings.exportLicenses': 'Export All Licenses (CSV)',
    'settings.securitySettings': 'Security Settings',
    'settings.securitySettingsDesc': 'Configure security and monitoring options',
    'settings.bruteForceProtection': 'Brute Force Protection',
    'settings.bruteForceProtectionDesc': 'Block after 5 failed attempts',
    'settings.hwidVerification': 'HWID Verification',
    'settings.hwidVerificationDesc': 'Lock licenses to hardware',
    'settings.ipLogging': 'IP Logging',
    'settings.ipLoggingDesc': 'Track activation IPs',
    'settings.securityEventAlerts': 'Security Event Alerts',
    'settings.securityEventAlertsDesc': 'Email on critical events',
    'settings.notifications': 'Notifications',
    'settings.notificationsDesc': 'Configure alert preferences',
    'settings.newActivations': 'New Activations',
    'settings.newActivationsDesc': 'Notify on successful activations',
    'settings.failedActivations': 'Failed Activations',
    'settings.failedActivationsDesc': 'Alert on failed attempts',
    'settings.securityAlertsNotif': 'Security Alerts',
    'settings.securityAlertsNotifDesc': 'Critical security events',
    'settings.dailySummary': 'Daily Summary',
    'settings.dailySummaryDesc': 'Daily activity report',
    'settings.apiEndpoints': 'API Endpoints',
    'settings.apiEndpointsDesc': 'Endpoints for Windows application integration',
    'settings.licenseValidation': 'License Validation',
    'settings.licenseValidationDesc': 'Validates a license key and returns activation status. Requires: licenseKey, hwid (optional)',
    'settings.statusReport': 'Status Report',
    'settings.statusReportDesc': 'Reports application status for monitoring. Requires: licenseKey, status, appVersion',
    'settings.trackDownload': 'Track Download',
    'settings.trackDownloadDesc': 'Tracks application downloads for analytics.',
    'settings.saveSettings': 'Save Settings',
    'settings.settingsSaved': 'Settings saved successfully',
    
    // Auth
    'auth.signInToContinue': 'Sign in to continue',
    'auth.signInDesc': 'Access to this dashboard requires authentication. Continue to launch the login flow.',
    'auth.signIn': 'Sign in',
    'auth.accessDenied': 'ACCESS DENIED',
    'auth.noPermission': 'You do not have permission to access the admin panel.',
    'auth.returnHome': 'Return Home',
    'auth.adminAccessRequired': 'Admin Access Required',
    'auth.adminAccessDesc': 'Sign in with an admin account to access the control panel.',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.comingSoon': 'Feature coming soon',
    'common.language': 'Language',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'ksa-boom-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in SUPPORTED_LANGUAGES) {
        return saved as LanguageCode;
      }
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang in SUPPORTED_LANGUAGES) {
        return browserLang as LanguageCode;
      }
    }
    return 'en';
  });

  const isRTL = (SUPPORTED_LANGUAGES[language] as { rtl?: boolean })?.rtl === true;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    // Update document direction for RTL languages
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Get translation from current language or fallback to English
    let text = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper to add translations for other languages dynamically
export function addTranslations(lang: LanguageCode, newTranslations: Record<string, string>) {
  if (!translations[lang]) {
    translations[lang] = {};
  }
  Object.assign(translations[lang], newTranslations);
}

// Pre-add some common translations for other languages
addTranslations('ar', {
  'nav.adminPanel': 'لوحة الإدارة',
  'nav.welcome': 'مرحباً',
  'nav.dashboard': 'لوحة التحكم',
  'nav.licenses': 'التراخيص',
  'nav.security': 'الأمان',
  'nav.settings': 'الإعدادات',
  'nav.backToSite': 'العودة للموقع',
  'nav.signOut': 'تسجيل الخروج',
  'landing.badge': 'نظام كشف الألوان المتقدم',
  'landing.tagline': 'تتبع الألوان الاحترافي والتحكم الآلي بالماوس لنظام ويندوز.',
  'landing.precision': 'دقة. سرعة. تحكم.',
  'landing.download': 'تحميل لويندوز',
  'landing.featuresTitle': 'النظام // المميزات',
  'landing.featuresSubtitle': 'مصمم للأداء، مبني للدقة',
  'landing.cta.title': 'مستعد للسيطرة؟',
  'landing.cta.button': 'ابدأ الآن',
  'dashboard.title': 'لوحة // التحكم',
  'dashboard.subtitle': 'نظرة عامة على النظام والمراقبة',
  'common.language': 'اللغة',
});

addTranslations('zh', {
  'nav.adminPanel': '管理面板',
  'nav.welcome': '欢迎',
  'nav.dashboard': '仪表板',
  'nav.licenses': '许可证',
  'nav.security': '安全',
  'nav.settings': '设置',
  'nav.backToSite': '返回网站',
  'nav.signOut': '退出登录',
  'landing.badge': '高级颜色检测系统',
  'landing.tagline': '专业级颜色追踪和Windows自动鼠标控制。',
  'landing.precision': '精准。速度。控制。',
  'landing.download': '下载Windows版',
  'landing.featuresTitle': '系统 // 功能',
  'landing.featuresSubtitle': '为性能而设计，为精准而打造',
  'landing.cta.title': '准备好称霸了吗？',
  'landing.cta.button': '开始使用',
  'dashboard.title': '控制 // 面板',
  'dashboard.subtitle': '系统概览和监控',
  'common.language': '语言',
});

addTranslations('es', {
  'nav.adminPanel': 'Panel de Admin',
  'nav.welcome': 'Bienvenido',
  'nav.dashboard': 'Panel',
  'nav.licenses': 'Licencias',
  'nav.security': 'Seguridad',
  'nav.settings': 'Configuración',
  'nav.backToSite': 'Volver al Sitio',
  'nav.signOut': 'Cerrar Sesión',
  'landing.badge': 'SISTEMA AVANZADO DE DETECCIÓN DE COLOR',
  'landing.tagline': 'Seguimiento de color profesional y control automático del ratón para Windows.',
  'landing.precision': 'Precisión. Velocidad. Control.',
  'landing.download': 'DESCARGAR PARA WINDOWS',
  'landing.featuresTitle': 'SISTEMA // CARACTERÍSTICAS',
  'landing.featuresSubtitle': 'Diseñado para el rendimiento, construido para la precisión',
  'landing.cta.title': '¿Listo para Dominar?',
  'landing.cta.button': 'COMENZAR',
  'dashboard.title': 'PANEL // DE CONTROL',
  'dashboard.subtitle': 'Vista general del sistema y monitoreo',
  'common.language': 'Idioma',
});

addTranslations('fr', {
  'nav.adminPanel': 'Panneau Admin',
  'nav.welcome': 'Bienvenue',
  'nav.dashboard': 'Tableau de Bord',
  'nav.licenses': 'Licences',
  'nav.security': 'Sécurité',
  'nav.settings': 'Paramètres',
  'nav.backToSite': 'Retour au Site',
  'nav.signOut': 'Déconnexion',
  'landing.badge': 'SYSTÈME DE DÉTECTION DE COULEUR AVANCÉ',
  'landing.tagline': 'Suivi de couleur professionnel et contrôle automatique de la souris pour Windows.',
  'landing.precision': 'Précision. Vitesse. Contrôle.',
  'landing.download': 'TÉLÉCHARGER POUR WINDOWS',
  'landing.featuresTitle': 'SYSTÈME // FONCTIONNALITÉS',
  'landing.featuresSubtitle': 'Conçu pour la performance, construit pour la précision',
  'landing.cta.title': 'Prêt à Dominer?',
  'landing.cta.button': 'COMMENCER',
  'dashboard.title': 'PANNEAU // DE CONTRÔLE',
  'dashboard.subtitle': 'Vue d\'ensemble du système et surveillance',
  'common.language': 'Langue',
});

addTranslations('de', {
  'nav.adminPanel': 'Admin-Panel',
  'nav.welcome': 'Willkommen',
  'nav.dashboard': 'Dashboard',
  'nav.licenses': 'Lizenzen',
  'nav.security': 'Sicherheit',
  'nav.settings': 'Einstellungen',
  'nav.backToSite': 'Zurück zur Seite',
  'nav.signOut': 'Abmelden',
  'landing.badge': 'FORTSCHRITTLICHES FARBERKENNUNGSSYSTEM',
  'landing.tagline': 'Professionelle Farbverfolgung und automatische Maussteuerung für Windows.',
  'landing.precision': 'Präzision. Geschwindigkeit. Kontrolle.',
  'landing.download': 'FÜR WINDOWS HERUNTERLADEN',
  'landing.featuresTitle': 'SYSTEM // FUNKTIONEN',
  'landing.featuresSubtitle': 'Entwickelt für Leistung, gebaut für Präzision',
  'landing.cta.title': 'Bereit zu Dominieren?',
  'landing.cta.button': 'LOSLEGEN',
  'dashboard.title': 'KONTROLL // PANEL',
  'dashboard.subtitle': 'Systemübersicht und Überwachung',
  'common.language': 'Sprache',
});

addTranslations('ja', {
  'nav.adminPanel': '管理パネル',
  'nav.welcome': 'ようこそ',
  'nav.dashboard': 'ダッシュボード',
  'nav.licenses': 'ライセンス',
  'nav.security': 'セキュリティ',
  'nav.settings': '設定',
  'nav.backToSite': 'サイトに戻る',
  'nav.signOut': 'ログアウト',
  'landing.badge': '高度なカラー検出システム',
  'landing.tagline': 'Windows用プロフェッショナルグレードのカラートラッキングと自動マウス制御。',
  'landing.precision': '精度。速度。制御。',
  'landing.download': 'WINDOWS版をダウンロード',
  'landing.featuresTitle': 'システム // 機能',
  'landing.featuresSubtitle': 'パフォーマンスのために設計、精度のために構築',
  'landing.cta.title': '支配する準備はできましたか？',
  'landing.cta.button': '始める',
  'dashboard.title': 'コントロール // パネル',
  'dashboard.subtitle': 'システム概要と監視',
  'common.language': '言語',
});

addTranslations('ko', {
  'nav.adminPanel': '관리자 패널',
  'nav.welcome': '환영합니다',
  'nav.dashboard': '대시보드',
  'nav.licenses': '라이선스',
  'nav.security': '보안',
  'nav.settings': '설정',
  'nav.backToSite': '사이트로 돌아가기',
  'nav.signOut': '로그아웃',
  'landing.badge': '고급 색상 감지 시스템',
  'landing.tagline': 'Windows용 전문가급 색상 추적 및 자동 마우스 제어.',
  'landing.precision': '정밀함. 속도. 제어.',
  'landing.download': 'WINDOWS용 다운로드',
  'landing.featuresTitle': '시스템 // 기능',
  'landing.featuresSubtitle': '성능을 위해 설계, 정밀함을 위해 구축',
  'landing.cta.title': '지배할 준비가 되셨나요?',
  'landing.cta.button': '시작하기',
  'dashboard.title': '컨트롤 // 패널',
  'dashboard.subtitle': '시스템 개요 및 모니터링',
  'common.language': '언어',
});

addTranslations('ru', {
  'nav.adminPanel': 'Панель Админа',
  'nav.welcome': 'Добро пожаловать',
  'nav.dashboard': 'Панель управления',
  'nav.licenses': 'Лицензии',
  'nav.security': 'Безопасность',
  'nav.settings': 'Настройки',
  'nav.backToSite': 'Вернуться на сайт',
  'nav.signOut': 'Выйти',
  'landing.badge': 'ПРОДВИНУТАЯ СИСТЕМА ОПРЕДЕЛЕНИЯ ЦВЕТА',
  'landing.tagline': 'Профессиональное отслеживание цвета и автоматическое управление мышью для Windows.',
  'landing.precision': 'Точность. Скорость. Контроль.',
  'landing.download': 'СКАЧАТЬ ДЛЯ WINDOWS',
  'landing.featuresTitle': 'СИСТЕМА // ФУНКЦИИ',
  'landing.featuresSubtitle': 'Разработано для производительности, создано для точности',
  'landing.cta.title': 'Готовы Доминировать?',
  'landing.cta.button': 'НАЧАТЬ',
  'dashboard.title': 'ПАНЕЛЬ // УПРАВЛЕНИЯ',
  'dashboard.subtitle': 'Обзор системы и мониторинг',
  'common.language': 'Язык',
});

addTranslations('tr', {
  'nav.adminPanel': 'Yönetici Paneli',
  'nav.welcome': 'Hoş Geldiniz',
  'nav.dashboard': 'Gösterge Paneli',
  'nav.licenses': 'Lisanslar',
  'nav.security': 'Güvenlik',
  'nav.settings': 'Ayarlar',
  'nav.backToSite': 'Siteye Dön',
  'nav.signOut': 'Çıkış Yap',
  'landing.badge': 'GELİŞMİŞ RENK ALGILAMA SİSTEMİ',
  'landing.tagline': 'Windows için profesyonel düzeyde renk takibi ve otomatik fare kontrolü.',
  'landing.precision': 'Hassasiyet. Hız. Kontrol.',
  'landing.download': 'WINDOWS İÇİN İNDİR',
  'landing.featuresTitle': 'SİSTEM // ÖZELLİKLER',
  'landing.featuresSubtitle': 'Performans için tasarlandı, hassasiyet için inşa edildi',
  'landing.cta.title': 'Domine Etmeye Hazır mısınız?',
  'landing.cta.button': 'BAŞLA',
  'dashboard.title': 'KONTROL // PANELİ',
  'dashboard.subtitle': 'Sistem genel bakış ve izleme',
  'common.language': 'Dil',
});
