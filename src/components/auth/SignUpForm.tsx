import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import StepIndicator from "./StepIndicator";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import ConsentBlock from "./ConsentBlock";
import CountrySelect from "./CountrySelect";
import JobTitleInput from "./JobTitleInput";
import { useIndustryContexts } from "@/hooks/useContextData";

const FREE_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "outlook.com", "live.com", "aol.com", "icloud.com", "me.com", "mail.com",
  "protonmail.com", "proton.me", "gmx.com", "gmx.de", "yandex.com",
];

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  workEmail: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .max(255)
    .refine(
      (val) => !FREE_DOMAINS.some((d) => val.toLowerCase().endsWith("@" + d)),
      "Please use your work email"
    ),
  companyName: z.string().trim().min(2, "Company name is required").max(200),
  companySize: z.string().min(1, "Please select company size"),
  country: z.string().min(1, "Please select a country"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

const step2Schema = z.object({
  jobTitle: z.string().trim().min(2, "Job title is required").max(200),
  industry: z.string().min(1, "Please select an industry"),
  primaryChallenge: z.string().min(1, "Please select a challenge"),
  referralSource: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

const COMPANY_SIZES = [
  { value: "1-50", label: "1–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1001-5000", label: "1,001–5,000 employees" },
  { value: "5001+", label: "5,001+ employees" },
];

// Industries are now loaded from the database via useIndustryContexts

const CHALLENGES = [
  { value: "cost-reduction", label: "Cost reduction & savings tracking" },
  { value: "supplier-risk", label: "Supplier risk management" },
  { value: "contract-negotiation", label: "Contract negotiation preparation" },
  { value: "spend-visibility", label: "Spend visibility & analytics" },
  { value: "market-intelligence", label: "Market intelligence & benchmarking" },
  { value: "compliance", label: "Compliance & regulatory requirements" },
  { value: "digital-transformation", label: "Procurement digital transformation" },
  { value: "other", label: "Other" },
];

const REFERRAL_SOURCES = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "google", label: "Google Search" },
  { value: "colleague", label: "Colleague / Word of Mouth" },
  { value: "event", label: "Conference / Event" },
  { value: "article", label: "Blog / Article" },
  { value: "other", label: "Other" },
];

function deriveCohort(companySize: string): string {
  if (["1-50", "51-200"].includes(companySize)) return "C1";
  if (["201-1000", "1001-5000"].includes(companySize)) return "C2";
  return "C3";
}

const SignUpForm = () => {
  const { toast } = useToast();
  const { data: industryContexts } = useIndustryContexts();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Consents (managed outside react-hook-form for simplicity)
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      workEmail: "",
      companyName: "",
      companySize: "",
      country: "",
      password: "",
    },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onBlur",
    defaultValues: {
      jobTitle: "",
      industry: "",
      primaryChallenge: "",
      referralSource: "",
    },
  });

  const watchPassword = step1Form.watch("password");

  const handleStep1Continue = async () => {
    const valid = await step1Form.trigger();
    if (valid) setStep(2);
  };

  const handleSubmit = async (step2Values: Step2Values) => {
    setIsLoading(true);
    const s1 = step1Form.getValues();

    try {
      const utmSource = searchParams.get("utm_source") || undefined;
      const utmMedium = searchParams.get("utm_medium") || undefined;
      const utmCampaign = searchParams.get("utm_campaign") || undefined;

      const { error } = await supabase.auth.signUp({
        email: s1.workEmail,
        password: s1.password,
        options: {
          emailRedirectTo: window.location.origin + "/auth",
          data: {
            full_name: s1.fullName,
            company_name: s1.companyName,
            company_size: s1.companySize,
            country: s1.country,
            job_title: step2Values.jobTitle,
            industry: step2Values.industry,
            primary_challenge: step2Values.primaryChallenge,
            referral_source: step2Values.referralSource || undefined,
            consent_terms: true,
            consent_data_processing: true,
            consent_marketing: consentMarketing,
            cohort: deriveCohort(s1.companySize),
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
          },
        },
      });

      if (error) {
        if (error.message.includes("rate_limit") || error.message.includes("rate limit")) {
          toast({
            title: "Too many attempts",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        }
      } else {
        setSubmittedEmail(s1.workEmail);
        // Clear password from state
        step1Form.setValue("password", "");
        setSuccess(true);
      }
    } catch {
      toast({ title: "Sign up failed", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const step2CanSubmit = step2Form.formState.isValid;

  // Success confirmation screen
  if (success) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Check your inbox</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{submittedEmail}</span>.
          Click the link to activate your account.
        </p>
        <Button
          variant="link"
          className="text-sm"
          onClick={() => {
            setSuccess(false);
            setStep(1);
          }}
        >
          Go back and correct it
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Form {...step1Form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStep1Continue();
            }}
            className="space-y-4"
          >
            <p className="text-[11px] uppercase tracking-widest text-primary font-medium">
              Account Details
            </p>

            <FormField
              control={step1Form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="workEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@acmecorp.com" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimum 10 characters" className="h-11" {...field} />
                  </FormControl>
                  <PasswordStrengthMeter password={watchPassword} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-[11px] uppercase tracking-widest text-primary font-medium pt-2">
              Company Information
            </p>

            <FormField
              control={step1Form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select size…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <CountrySelect value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12"
              disabled={!step1Form.formState.isValid}
            >
              Continue
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(handleSubmit)} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              className="gap-2 px-0 h-auto text-sm text-muted-foreground"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <p className="text-[11px] uppercase tracking-widest text-primary font-medium">
              Professional Details
            </p>

            <FormField
              control={step2Form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <JobTitleInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select industry…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industryContexts?.map((ic) => (
                        <SelectItem key={ic.slug} value={ic.slug}>
                          {ic.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="primaryChallenge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Challenge</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="What are you trying to solve?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CHALLENGES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="referralSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    How did you hear about us?{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <ConsentBlock
                consentTerms={consentTerms}
                consentDataProcessing={consentDataProcessing}
                consentMarketing={consentMarketing}
                onConsentTermsChange={setConsentTerms}
                onConsentDataProcessingChange={setConsentDataProcessing}
                onConsentMarketingChange={setConsentMarketing}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading || !step2CanSubmit}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create My Account"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default SignUpForm;
