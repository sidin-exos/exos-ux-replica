import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Pencil, Check, X, AlertTriangle } from "lucide-react";
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

// Industries are now loaded from the database via useIndustryContexts

interface ProfileCardProps {
  profile: ProfileData;
  email: string;
  emptyFieldCount: number;
  updateProfile: UseMutationResult<void, Error, Partial<ProfileData>>;
}

const ProfileCard = ({ profile, email, emptyFieldCount, updateProfile }: ProfileCardProps) => {
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

  const fields = [
    { label: "Full Name", key: "full_name" as const },
    { label: "Job Title", key: "job_title" as const },
    { label: "Company", key: "company_name" as const },
    { label: "Company Size", key: "company_size" as const, type: "select", options: COMPANY_SIZES },
    { label: "Country", key: "country" as const },
    { label: "Industry", key: "industry" as const, type: "industry" },
    { label: "Primary Challenge", key: "primary_challenge" as const },
  ];

  return (
    <Card className="card-elevated overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-accent" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-display font-semibold text-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-xl truncate">
                {profile.full_name || profile.display_name || email.split("@")[0]}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground truncate">{email}</span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
                  <Check className="w-3 h-3 mr-1" /> Verified
                </Badge>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5 shrink-0">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {emptyFieldCount >= 3 && !isEditing && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="text-foreground">
              Complete your profile to get personalised recommendations.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map(({ label, key, type, options }) => (
            <div key={key} className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-primary font-medium">
                {label}
              </span>
              {isEditing ? (
                type === "select" ? (
                  <Select value={form[key]} onValueChange={(v) => setForm((f) => ({ ...f, [key]: v }))}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {(options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : type === "industry" ? (
                  <Select value={form[key]} onValueChange={(v) => setForm((f) => ({ ...f, [key]: v }))}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {industryContexts?.map((ic) => (
                        <SelectItem key={ic.slug} value={ic.slug}>{ic.name}</SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="h-10"
                  />
                )
              ) : (
                <p className="text-sm text-foreground">
                  {key === "country"
                    ? COUNTRY_NAMES[profile[key] ?? ""] || profile[key] || "—"
                    : key === "company_size"
                    ? COMPANY_SIZES.find((s) => s.value === profile[key])?.label || profile[key] || "—"
                    : profile[key] || "—"}
                </p>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-1.5">
              <Check className="w-4 h-4" /> Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-1.5">
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
