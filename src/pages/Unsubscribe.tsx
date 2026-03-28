import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const SUPABASE_URL = "https://qczblwoaiuxgesjzxjvu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjemJsd29haXV4Z2Vzanp4anZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTkzMDgsImV4cCI6MjA4ODI3NTMwOH0.8_WvREKiiHcwQ6wRrQRoDFSQEfGp8tnYtk3V4qdN2t8";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "confirming" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already_unsubscribed"); return; }
        if (data.valid) { setStatus("valid"); return; }
        setStatus("invalid");
      } catch { setStatus("invalid"); }
    })();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) { setStatus("error"); return; }
      if (data?.success) { setStatus("success"); return; }
      if (data?.reason === "already_unsubscribed") { setStatus("already_unsubscribed"); return; }
      setStatus("error");
    } catch { setStatus("error"); }
  };

  const content: Record<Status, { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }> = {
    loading: { icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />, title: "Verifying...", desc: "Please wait while we verify your request." },
    valid: { icon: <MailX className="w-8 h-8 text-primary" />, title: "Unsubscribe from emails?", desc: "You will no longer receive app emails from EXOS.", action: <Button onClick={handleConfirm} className="mt-4">Confirm Unsubscribe</Button> },
    confirming: { icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />, title: "Processing...", desc: "Unsubscribing you now." },
    success: { icon: <CheckCircle className="w-8 h-8 text-success" />, title: "Unsubscribed", desc: "You have been successfully unsubscribed. You will no longer receive app emails." },
    already_unsubscribed: { icon: <CheckCircle className="w-8 h-8 text-muted-foreground" />, title: "Already unsubscribed", desc: "This email address has already been unsubscribed." },
    invalid: { icon: <XCircle className="w-8 h-8 text-destructive" />, title: "Invalid link", desc: "This unsubscribe link is invalid or has expired." },
    error: { icon: <XCircle className="w-8 h-8 text-destructive" />, title: "Something went wrong", desc: "We couldn't process your request. Please try again later." },
  };

  const c = content[status];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">{c.icon}</div>
            <h1 className="font-display text-xl font-semibold text-foreground">{c.title}</h1>
            <p className="text-muted-foreground text-sm">{c.desc}</p>
            {c.action}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
