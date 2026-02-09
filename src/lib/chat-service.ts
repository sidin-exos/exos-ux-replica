export async function getMockAIResponse(input: string): Promise<string> {
  const delay = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const lower = input.toLowerCase();

  if (lower.includes('cost') || lower.includes('saving') || lower.includes('consolidat')) {
    return "For cost optimization, I'd recommend starting with **Cost Breakdown Analysis** to understand your spend structure, or **Volume Consolidation** if you're looking to leverage buying power across categories. Which sounds closer to your goal?";
  }

  if (lower.includes('supplier') || lower.includes('vendor') || lower.includes('sourcing')) {
    return "For supplier-related decisions, try **Supplier Review** for evaluating current partners, **Pre-flight Audit** for vetting new ones, or **Risk Assessment** to map supply chain vulnerabilities. What's your priority?";
  }

  if (lower.includes('contract') || lower.includes('document') || lower.includes('sow')) {
    return "For documentation needs, **Contract Review** analyzes existing agreements for risks, while **SOW Generation** helps create scope documents from scratch. Need help with an existing contract or a new one?";
  }

  if (lower.includes('risk') || lower.includes('disruption')) {
    return "The **Risk Assessment** scenario provides multi-dimensional analysis across market, financial, and operational risks. For supplier-specific intelligence, try **Pre-flight Audit**. Which angle matters most?";
  }

  if (lower.includes('negotiat') || lower.includes('strategy') || lower.includes('plan')) {
    return "For strategic planning, **Negotiation Preparation** builds tactical playbooks, while **Category Strategy** helps with long-term positioning. **Project Planning** is great for setting procurement priorities. What's your timeframe?";
  }

  if (lower.includes('compare') || lower.includes('make or buy') || lower.includes('tco') || lower.includes('total cost')) {
    return "**TCO Analysis** compares total lifecycle costs across options, and **Make-or-Buy** evaluates insourcing vs. outsourcing decisions. Both include scenario modeling. Which comparison are you looking at?";
  }

  if (lower.includes('help') || lower.includes('what can') || lower.includes('how does') || lower.includes('guide')) {
    return "I can help you pick the right analysis scenario! We have 20+ templates across four areas: **Cost Optimization**, **Planning & Sourcing**, **Risk Management**, and **Documentation**. Tell me your challenge — I'll point you to the best fit.";
  }

  return "Tell me more about your procurement challenge — are you focused on reducing costs, managing suppliers, handling risks, or preparing documents? I'll recommend the best scenario for you.";
}
