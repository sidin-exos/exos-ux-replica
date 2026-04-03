import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Brain, Home, Sparkles, Tag } from "lucide-react";

const navItems = [
  { label: "Home", path: "/welcome", icon: Home },
  { label: "Intel", path: "/market-intelligence", icon: Brain },
  { label: "Tech", path: "/features", icon: Sparkles },
  { label: "Dashboards", path: "/features#dashboards", icon: BarChart3 },
  { label: "Pricing", path: "/pricing", icon: Tag },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
