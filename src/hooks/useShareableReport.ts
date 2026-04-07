import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardType } from "@/lib/dashboard-mappings";

interface ReportData {
  scenarioTitle: string;
  scenarioId?: string;
  analysisResult: string;
  structuredData?: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  evaluationScore?: number | null;
  evaluationConfidence?: string | null;
}

interface ShareableReportReturn {
  shareId: string | null;
  isShared: boolean;
  isLoading: boolean;
  generateShareLink: (data: ReportData) => Promise<string | null>;
  loadSharedReport: (shareId: string) => Promise<ReportData | null>;
}

/** Expiry period in days */
const EXPIRY_DAYS = 5;

/**
 * Hook for managing shareable report links.
 * Uses Supabase RPC for cross-device sharing with 5-day expiry.
 */
export function useShareableReport(): ShareableReportReturn {
  const [searchParams] = useSearchParams();
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isShared = searchParams.has("share");

  /**
   * Store report data and generate a shareable link.
   * The share_id is now generated server-side for security.
   * Requires authentication.
   */
  const generateShareLink = useCallback(
    async (data: ReportData): Promise<string | null> => {
      try {
        setIsLoading(true);

        const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const { data: id, error } = await supabase.rpc("create_shared_report", {
          p_payload: JSON.parse(JSON.stringify(data)) as unknown as import("@/integrations/supabase/types").Json,
          p_expires_at: expiresAt,
        });

        if (error || !id) {
          console.error("Failed to persist shared report:", error);
          return null;
        }

        setShareId(id);

        // Use the current origin so the share link points to the same
        // environment that stored the payload.
        const origin = window.location.origin;
        const shareUrl = `${origin}/report?share=${id}`;

        return shareUrl;
      } catch (error) {
        console.error("Failed to generate share link:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Load shared report data from the database.
   */
  const loadSharedReport = useCallback(
    async (id: string): Promise<ReportData | null> => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase.rpc("get_shared_report", {
          p_share_id: id,
        });

        if (error) {
          console.error("Failed to load shared report:", error);
          return null;
        }

        if (!data) {
          return null;
        }

        const payload = data as unknown as ReportData;

        return {
          scenarioTitle: payload.scenarioTitle,
          scenarioId: payload.scenarioId,
          analysisResult: payload.analysisResult,
          structuredData: payload.structuredData,
          formData: payload.formData,
          timestamp: payload.timestamp,
          selectedDashboards: payload.selectedDashboards,
          evaluationScore: payload.evaluationScore,
          evaluationConfidence: payload.evaluationConfidence,
        };
      } catch (error) {
        console.error("Failed to load shared report:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    shareId,
    isShared,
    isLoading,
    generateShareLink,
    loadSharedReport,
  };
}
