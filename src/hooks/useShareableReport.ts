import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardType } from "@/lib/dashboard-mappings";

interface ReportData {
  scenarioTitle: string;
  scenarioId?: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
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

  // Generate a unique share ID
  const generateShareId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  };

  /**
   * Store report data and generate a shareable link.
   * Uses published URL so share links work without Lovable auth.
   */
  const generateShareLink = useCallback(
    async (data: ReportData): Promise<string | null> => {
      try {
        setIsLoading(true);
        const id = generateShareId();

        const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase.rpc("create_shared_report", {
          p_share_id: id,
          p_payload: JSON.parse(JSON.stringify(data)),
          p_expires_at: expiresAt,
        });

        if (error) {
          console.error("Failed to persist shared report:", error);
          return null;
        }

        setShareId(id);

        // IMPORTANT: Use the current origin so the share link points to the same
        // environment that stored the payload (preview vs published are separate).
        // On the published site this is still public (no Lovable auth gate).
        const origin = typeof window !== "undefined" ? window.location.origin : "https://optimal-buy.lovable.app";
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
          formData: payload.formData,
          timestamp: payload.timestamp,
          selectedDashboards: payload.selectedDashboards,
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
