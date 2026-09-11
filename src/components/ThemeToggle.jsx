import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-secondary hover:shadow-md hover:shadow-primary/10 ${className}`}
    >
      <Sun className={`h-4 w-4 transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"} absolute`} />
      <Moon className={`h-4 w-4 transition-all duration-500 ${theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"} absolute`} />
    </button>
  );
}