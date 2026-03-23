import { ReactNode } from "react";

interface EnterpriseLayoutProps {
  children: ReactNode;
}


const EnterpriseLayout = ({ children }: EnterpriseLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TelemetryBar />
      {children}
    </div>
  );
};

export default EnterpriseLayout;
