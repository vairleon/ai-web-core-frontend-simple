"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    'home': 'Home',
    'removeBackground': 'Remove Background',
    'feedback': 'Feedback',
    'submit': 'Submit',
    'processing': 'Processing your image...',
    'downloadImage': 'Download Image',
    'resetChanges': 'Reset Changes',
    'sideBySide': 'Side by Side',
    'compare': 'Compare',
    'brightness': 'Brightness',
    'contrast': 'Contrast',
    'saturation': 'Saturation',
    // Add more translations as needed
  },
  zh: {
    'home': '首页',
    'removeBackground': '移除背景',
    'feedback': '反馈',
    'submit': '提交',
    'processing': '正在处理您的图片...',
    'downloadImage': '下载图片',
    'resetChanges': '重置更改',
    'sideBySide': '并排显示',
    'compare': '对比',
    'brightness': '亮度',
    'contrast': '对比度',
    'saturation': '饱和度',
    // Add more translations as needed
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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