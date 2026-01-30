import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "icon";
  className?: string;
}

export function LanguageSwitcher({ variant = "default", className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES[language];

  const languages = Object.entries(SUPPORTED_LANGUAGES) as [LanguageCode, typeof currentLang][];

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
          {languages.map(([code, lang]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className={`cursor-pointer ${language === code ? 'bg-accent' : ''}`}
            >
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
            <span>{currentLang.flag}</span>
            <span className="hidden sm:inline">{currentLang.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
          {languages.map(([code, lang]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className={`cursor-pointer ${language === code ? 'bg-accent' : ''}`}
            >
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.language')}</span>
          <span>{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto w-48">
        {languages.map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={`cursor-pointer ${language === code ? 'bg-accent' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.nativeName}</span>
            {language === code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
