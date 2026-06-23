/**
 * Language Selector Component
 */

"use client";

import { Button } from "@/app/components/ui/button";

interface LanguageSelectorProps {
  currentLanguage: "ar" | "en";
  onLanguageChange: (language: "ar" | "en") => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={currentLanguage === "ar" ? "mojaz" : "mojaz-outline"}
        size="sm"
        onClick={() => onLanguageChange("ar")}
      >
        العربية
      </Button>
      <Button
        variant={currentLanguage === "en" ? "mojaz" : "mojaz-outline"}
        size="sm"
        onClick={() => onLanguageChange("en")}
      >
        English
      </Button>
    </div>
  );
}
