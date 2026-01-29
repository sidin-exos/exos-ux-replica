import Header from "@/components/layout/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqData = [
  {
    id: "tariff",
    question: "What is the right tariff for me?",
    answer: `Pick SMB (small-medium business) option if you're in small-medium sized businesses, doing responsible for commercial transactions, need a distilled procurement best practices which will be tailored to your business-case each time.

Pick Pro option if you're full-time procurement professional who needs to run multiple simulations almost every day to improve your decision making and save (a lot of) your time. We also recommend Pro for CFOs and business owners who are responsible for high-value decisions and need 24/7 best-in-class support.`,
  },
  {
    id: "limited-requests",
    question: "Why is number of requests limited in SMB option?",
    answer: `EXOS is not designed to be creative but provides best-in-class expertise. Each of your requests is enhanced with business knowledge, scenario fine tuning, structured XML prompts, grounding and validation after receiving API response. That means your request goes through multiple checks before it returns to you. EXOS gives you straightforward answers, pointing you attention to it's limitations if it doesn't have sufficient data.`,
  },
  {
    id: "price-comparison",
    question: "Why is the price higher than ChatGPT or Gemini?",
    answer: `EXOS is not a mass product, designed for professionals seeking best possible quality. For each request you make, we made tens of scenario simulations to improve quality, reduce hallucinations and empower EXOS with best business practices.`,
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Hero Section */}
        <section className="mb-12 text-center animate-fade-up">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about EXOS and how it can help your procurement decisions.
          </p>
        </section>

        {/* FAQ Accordion */}
        <section className="max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "100ms" }}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="card-elevated border border-border/50 rounded-lg px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
                  <span className="font-display font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Section */}
        <section className="mt-16 text-center animate-fade-up" style={{ animationDelay: "200ms" }}>
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a href="#" className="text-primary hover:underline">
              Contact our team
            </a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default FAQ;
