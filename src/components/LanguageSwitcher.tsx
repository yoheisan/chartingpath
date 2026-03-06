import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { languages } from '@/i18n/config';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    setIsLoading(true);
    
    try {
      // Change the language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Always persist to localStorage so it survives refreshes
      try {
        localStorage.setItem('cp_language', languageCode);
      } catch {}
      
      // Save user preference to backend if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke('set-user-language', {
          body: {
            userId: user.id,
            languageCode,
            isManual: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 h-8 px-3"
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
            </div>
            {language.code === currentLanguage.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};