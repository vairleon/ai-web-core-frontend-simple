import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
      className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      {language === 'en' ? '中文' : 'EN'}
    </button>
  );
} 