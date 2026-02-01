import { useState, useCallback, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
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

/**
 * Hook for managing shareable report links.
 * Uses localStorage for MVP - can be upgraded to Supabase for cross-device sharing.
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

  // Store report data and generate a shareable link
  const generateShareLink = useCallback(async (data: ReportData): Promise<string | null> => {
    try {
      setIsLoading(true);
      const id = generateShareId();
      
      // Store in localStorage (MVP approach)
      // TODO: Upgrade to Supabase for cross-device sharing
      const storageKey = `exos_shared_report_${id}`;
      localStorage.setItem(storageKey, JSON.stringify({
        ...data,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }));
      
      setShareId(id);
      
      // Build the share URL
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/report?share=${id}`;
      
      return shareUrl;
    } catch (error) {
      console.error("Failed to generate share link:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load shared report data from storage
  const loadSharedReport = useCallback(async (id: string): Promise<ReportData | null> => {
    try {
      setIsLoading(true);
      
      const storageKey = `exos_shared_report_${id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }
      
      const data = JSON.parse(stored);
      
      // Check expiration
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return {
        scenarioTitle: data.scenarioTitle,
        scenarioId: data.scenarioId,
        analysisResult: data.analysisResult,
        formData: data.formData,
        timestamp: data.timestamp,
        selectedDashboards: data.selectedDashboards,
      };
    } catch (error) {
      console.error("Failed to load shared report:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    shareId,
    isShared,
    isLoading,
    generateShareLink,
    loadSharedReport,
  };
}
