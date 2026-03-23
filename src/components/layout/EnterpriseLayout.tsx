import { ReactNode } from "react";

interface EnterpriseLayoutProps {
  children: ReactNode;
}

const TelemetryBar = () => (
  <div className="hidden md:flex items-center justify-between w-full h-7 bg-slate-950 px-6 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
    <span className="text-slate-500">Module: Command_Center // EXOS_V2</span>
  </div>
);

const EnterpriseLayout = ({ children }: EnterpriseLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TelemetryBar />
      {children}
    </div>
  );
};

export default EnterpriseLayout;
