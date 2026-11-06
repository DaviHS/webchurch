"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VersionInfo {
  code: string;
  name: string;
  language: string;
}

const LANGUAGE_LABELS: Record<string, string> = { pt: "Português", en: "Inglês" };

export function VersionSelect({
  value,
  versions,
  taken,
  onChange,
  label,
  className,
}: {
  value: string;
  versions: VersionInfo[];
  taken: string[];
  onChange: (code: string) => void;
  label: string;
  className?: string;
}) {
  const languages = [...new Set(versions.map((v) => v.language))];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label={label}>
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {languages.map((language) => (
          <SelectGroup key={language}>
            <SelectLabel>{LANGUAGE_LABELS[language] ?? language}</SelectLabel>
            {versions
              .filter((v) => v.language === language)
              .map((v) => (
                <SelectItem key={v.code} value={v.code} disabled={v.code !== value && taken.includes(v.code)}>
                  {v.code} · {v.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
