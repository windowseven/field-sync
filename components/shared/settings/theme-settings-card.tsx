"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Set your preferred theme for this dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                "rounded-lg border p-3 text-sm font-medium transition-colors",
                isActive ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50"
              )}
            >
              <div className="mb-2 flex justify-center">
                <Icon className="h-4 w-4" />
              </div>
              {option.label}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
