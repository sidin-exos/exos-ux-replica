import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Check, X, AlertTriangle } from "lucide-react";
import type { ProfileData } from "@/hooks/useAccountData";
import type { UseMutationResult } from "@tanstack/react-query";
import { useIndustryContexts } from "@/hooks/useContextData";

const COUNTRY_NAMES: Record<string, string> = {
  DE: "Germany", NL: "Netherlands", IT: "Italy", ES: "Spain", FR: "France",
  PL: "Poland", BE: "Belgium", AT: "Austria", CH: "Switzerland", SE: "Sweden",
  DK: "Denmark", FI: "Finland", NO: "Norway", IE: "Ireland", PT: "Portugal",
  CZ: "Czech Republic", RO: "Romania", HU: "Hungary", SK: "Slovakia",
  BG: "Bulgaria", HR: "Croatia", SI: "Slovenia", LT: "Lithuania",
  LV: "Latvia", EE: "Estonia", LU: "Luxembourg", MT: "Malta", CY: "Cyprus",
  GR: "Greece", GB: "United Kingdom", US: "United States",
};

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1001-5000", label: "1,001–5,000 employees" },
  { value: "5001+", label: "5,001+ employees" },
];

interface AccountSidebarProps {
  profile: ProfileData;
  email: string;
  emptyFieldCount: number;
  updateProfile: UseMutationResult<void, Error, Partial<ProfileData>>;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SECTIONS = [
  { id: "profile", label: "Profile Overview" },
  { id: "plan", label: "Plan & Usage" },
  { id: "files", label: "Storage Assets" },
  { id: "billing", label: "Billing & Invoices" },
];

const ADMIN_SECTIONS = [
  { id: "profile", label: "Profile Overview" },
  { id: "plan", label: "Plan & Usage" },
  { id: "team", label: "Team" },
  { id: "files", label: "Storage Assets" },
  { id: "billing", label: "Billing & Invoices" },
];

const AccountSidebar = ({
  profile,
  email,
  emptyFieldCount,
  updateProfile,
  activeSection,
  onSectionChange,
}: AccountSidebarProps) => {
  const { data: industryContexts } = useIndustryContexts();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    job_title: profile.job_title ?? "",
    company_name: profile.company_name ?? "",
    company_size: profile.company_size ?? "",
    country: profile.country ?? "",
    industry: profile.industry ?? "",
    primary_challenge: profile.primary_challenge ?? "",
    business_context: profile.business_context ?? "",
  });

  const startEdit = () => {
    setForm({
      full_name: profile.full_name ?? "",
      job_title: profile.job_title ?? "",
      company_name: profile.company_name ?? "",
      company_size: profile.company_size ?? "",
      country: profile.country ?? "",
      industry: profile.industry ?? "",
      primary_challenge: profile.primary_challenge ?? "",
      business_context: profile.business_context ?? "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(form as any, { onSuccess: () => setIsEditing(false) });
  };

  const initials = (profile.full_name || profile.display_name || email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayName = profile.full_name || profile.display_name || email.split("@")[0];
  const subline = [profile.job_title, profile.company_name].filter(Boolean).join(" at ");
  const countryLabel = COUNTRY_NAMES[profile.country ?? ""] || profile.country;
  const industryLabel = industryContexts?.find((ic) => ic.slug === profile.industry)?.name || profile.industry;

  return (
    <aside className="space-y-8">
      {/* Profile card */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="flex items-start justify-between mb-5">
          <div className="size-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-display font-semibold text-xl">
            {initials}
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={startEdit} className="h-8 px-2 gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <FieldEdit label="Full Name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
            <FieldEdit label="Job Title" value={form.job_title} onChange={(v) => setForm((f) => ({ ...f, job_title: v }))} />
            <FieldEdit label="Company" value={form.company_name} onChange={(v) => setForm((f) => ({ ...f, company_name: v }))} />
            <div className="space-y-1">
              <Label>Company Size</Label>
              <Select value={form.company_size} onValueChange={(v) => setForm((f) => ({ ...f, company_size: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <FieldEdit label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
            <div className="space-y-1">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {industryContexts?.map((ic) => <SelectItem key={ic.slug} value={ic.slug}>{ic.name}</SelectItem>)}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FieldEdit
              label="Primary Challenge"
              value={form.primary_challenge}
              onChange={(v) => setForm((f) => ({ ...f, primary_challenge: v }))}
            />
            <div className="space-y-1">
              <Label>Business Context</Label>
              <Textarea
                value={form.business_context}
                onChange={(e) => setForm((f) => ({ ...f, business_context: e.target.value }))}
                placeholder="Describe your context for AI tailoring…"
                className="min-h-[80px] text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending} className="gap-1.5 flex-1">
                <Check className="w-3.5 h-3.5" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1.5">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-display font-semibold text-foreground leading-tight">{displayName}</h2>
            {subline && <p className="text-sm text-muted-foreground mt-1 mb-4">{subline}</p>}
            <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
              <DetailRow value={email} />
              {countryLabel && <DetailRow value={countryLabel} />}
              {industryLabel && <DetailRow label="Sector" value={industryLabel} />}
              {profile.primary_challenge && (
                <DetailRow label="Challenge" value={profile.primary_challenge} />
              )}
            </div>
            {emptyFieldCount >= 3 && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                <span className="text-foreground">Complete your profile for better AI tailoring.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Section nav */}
      <nav className="space-y-3 text-sm px-2">
        {(profile.role === "admin" ? ADMIN_SECTIONS : SECTIONS).map((s) => (
          <button
            key={s.id}
            onClick={() => onSectionChange(s.id)}
            className={`block w-full text-left transition-colors ${
              activeSection === s.id
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-[11px] uppercase tracking-wider text-primary font-medium">{children}</span>;
}

function FieldEdit({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}

function DetailRow({ label, value }: { label?: string; value: string }) {
  return (
    <div className="text-foreground/80 truncate">
      {label && <span className="text-muted-foreground">{label}: </span>}
      {value}
    </div>
  );
}

export default AccountSidebar;
