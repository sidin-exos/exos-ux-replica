import { useTheme } from "next-themes";
import exosLogoDark from "@/assets/exos-logo-dark.png";
import exosLogoLight from "@/assets/exos-logo-light.png";

export const useThemedLogo = () => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? exosLogoDark : exosLogoLight;
};
