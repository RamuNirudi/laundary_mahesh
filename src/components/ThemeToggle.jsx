import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      // cn() merges through tailwind-merge, so a caller's colours win over the
      // defaults instead of depending on stylesheet order.
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:text-primary",
        className,
      )}
    >
      <Sun className={`absolute h-4 w-4 transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-500 ${theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
    </button>
  );
}
