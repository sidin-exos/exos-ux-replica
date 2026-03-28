import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryContext, ProcurementCategory } from "@/lib/ai-context-templates";

/**
 * Fetch all industry contexts for selection dropdowns
 */
export function useIndustryContexts() {
  return useQuery({
    queryKey: ["industry-contexts"],
    queryFn: async (): Promise<IndustryContext[]> => {
      const { data, error } = await supabase
        .from("industry_contexts")
        .select("id, name, slug, constraints, kpis, constraints_v2, kpis_v2")
        .order("name");

      if (error) {
        console.error("Error fetching industry contexts:", error);
        throw error;
      }

      return (data || []) as unknown as IndustryContext[];
    },
  });
}

/**
 * Fetch all procurement categories for selection dropdowns
 */
export function useProcurementCategories() {
  return useQuery({
    queryKey: ["procurement-categories"],
    queryFn: async (): Promise<ProcurementCategory[]> => {
      const { data, error } = await supabase
        .from("procurement_categories")
        .select("id, name, slug, characteristics, kpis, category_group, spend_type, kraljic_position, kraljic_rationale, price_volatility, market_structure, supply_concentration, key_cost_drivers, procurement_levers, negotiation_dynamics, should_cost_components, eu_regulatory_context, common_failure_modes, exos_scenarios_primary, exos_scenarios_secondary, kpis_v2")
        .order("name");

      if (error) {
        console.error("Error fetching procurement categories:", error);
        throw error;
      }

      return (data || []) as unknown as ProcurementCategory[];
    },
  });
}

/**
 * Fetch a specific industry context by slug
 */
export function useIndustryContext(slug: string | null) {
  return useQuery({
    queryKey: ["industry-context", slug],
    queryFn: async (): Promise<IndustryContext | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("industry_contexts")
        .select("id, name, slug, constraints, kpis, constraints_v2, kpis_v2")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Error fetching industry context:", error);
        throw error;
      }

      return data as unknown as IndustryContext | null;
    },
    enabled: !!slug,
  });
}

/**
 * Fetch a specific procurement category by slug
 */
export function useProcurementCategory(slug: string | null) {
  return useQuery({
    queryKey: ["procurement-category", slug],
    queryFn: async (): Promise<ProcurementCategory | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("procurement_categories")
        .select("id, name, slug, characteristics, kpis, category_group, spend_type, kraljic_position, kraljic_rationale, price_volatility, market_structure, supply_concentration, key_cost_drivers, procurement_levers, negotiation_dynamics, should_cost_components, eu_regulatory_context, common_failure_modes, exos_scenarios_primary, exos_scenarios_secondary, kpis_v2")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Error fetching procurement category:", error);
        throw error;
      }

      return data as unknown as ProcurementCategory | null;
    },
    enabled: !!slug,
  });
}
