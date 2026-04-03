import { useTheme } from "next-themes";
import exosLogoDark from "@/assets/exos-logo-dark.svg";
import exosLogoLight from "@/assets/exos-logo-light.svg";

export const useThemedLogo = () => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? exosLogoDark : exosLogoLight;
};
