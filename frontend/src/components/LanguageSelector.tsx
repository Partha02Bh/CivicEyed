import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  console.log('Current language:', language); // Debug log
  console.log('Translation test - hero.title:', t('hero.title')); // Test translation

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-green-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-300"
        >
          <Globe className="h-4 w-4 text-green-600" />
          <span className="hidden sm:inline text-slate-700 font-medium">
            {currentLanguage?.nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white/95 backdrop-blur-xl border-green-100 rounded-xl shadow-xl"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${
              language === lang.code 
                ? 'bg-green-50 text-green-700 font-semibold' 
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{lang.nativeName}</span>
              <span className="text-sm text-slate-500">({lang.name})</span>
            </span>
            {language === lang.code && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
