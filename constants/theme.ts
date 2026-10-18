// Common theme interface
export interface ThemeColors {
  // Base colors
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  border: string;
  success: string;
  error: string;
  
  // Gradients
  headerGradient: string[];
  cardGradient: string[];
  accentGradient: string[];
  quizGradient: string[];
  
  // Alert colors
  alertHigh: string;
  alertMedium: string;
  alertLow: string;
  
  // Card colors
  cardBackground: string;
  tipCard: string;
  
  // UI elements
  shadow: string;
  sectionHeader: string;
}

// Light theme colors
export const lightTheme: ThemeColors = {
  // Base colors
  background: "#FAFAFA",
  text: "#1E293B",
  textSecondary: "#64748B",
  accent: "#2563EB",
  accentText: "#FFFFFF",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  
  // Gradients
  headerGradient: ["#2563EB", "#1D4ED8"],
  cardGradient: ["#FFFFFF", "#F8FAFC"],
  accentGradient: ["#2563EB", "#1D4ED8"],
  quizGradient: ["#8B5CF6", "#7C3AED"],
  
  // Alert colors
  alertHigh: "#EF4444",
  alertMedium: "#F59E0B",
  alertLow: "#10B981",
  
  // Card colors
  cardBackground: "#FFFFFF",
  tipCard: "#F8FAFC",
  
  // UI elements
  shadow: "rgba(0, 0, 0, 0.1)",
  sectionHeader: "#1E293B"
};

// Dark theme colors
export const darkTheme: ThemeColors = {
  // Base colors
  background: "#0F172A",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  accent: "#3B82F6",
  accentText: "#FFFFFF",
  border: "#1E293B",
  success: "#10B981",
  error: "#EF4444",
  
  // Gradients
  headerGradient: ["#1D4ED8", "#1E40AF"],
  cardGradient: ["#1E293B", "#0F172A"],
  accentGradient: ["#1D4ED8", "#1E40AF"],
  quizGradient: ["#A78BFA", "#8B5CF6"],
  
  // Alert colors
  alertHigh: "#F87171",
  alertMedium: "#FBBF24",
  alertLow: "#34D399",
  
  // Card colors
  cardBackground: "#1E293B",
  tipCard: "#1E293B",
  
  // UI elements
  shadow: "rgba(0, 0, 0, 0.3)",
  sectionHeader: "#F1F5F9"
};

// Action gradients
export const actionGradients = {
  sos: ["#FF4B4B", "#FF6B6B"],
  contacts: ["#3B82F6", "#60A5FA"],
  alarm: ["#FFD166", "#FFE066"],
  firstaid: ["#06D6A0", "#34D399"],
  default: ["#8B5CF6", "#7C3AED"]
} as const;
