import { useTheme } from "next-themes";
import exosMarkDark from "@/assets/exos-mark-dark.svg";
import exosMarkLight from "@/assets/exos-mark.svg";

export const useThemedLogo = () => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? exosMarkDark : exosMarkLight;
};
