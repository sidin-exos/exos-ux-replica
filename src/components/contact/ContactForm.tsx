import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", company: "", subject: "", message: "" },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: values.name,
        email: values.email,
        company: values.company || null,
        subject: values.subject,
        message: values.message,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (err) {
      console.error("Contact form submission failed:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold">Thank you for reaching out!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We've received your message and will get back to you within 24 hours.
        </p>
        <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl><Input placeholder="Your name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl><Input placeholder="Your company (optional)" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *</FormLabel>
              <FormControl><Input placeholder="How can we help?" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>Message *</FormLabel>
            <FormControl><Textarea placeholder="Tell us more about your needs..." rows={5} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto gap-2">
          <Send className="w-4 h-4" />
          {submitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Form>
  );
}
