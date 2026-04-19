import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrgInvitation {
  id: string;
  invitee_email: string;
  role: "user" | "manager";
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

type InviteAction =
  | { action: "send"; email: string; role: "user" | "manager" }
  | { action: "resend"; invitationId: string }
  | { action: "revoke"; invitationId: string };

export function useOrgInvitations(enabled: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["org-invitations"],
    queryFn: async () => {
      // Table exists at runtime; types.ts needs regeneration to pick it up.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const from = (supabase.from as unknown as (name: string) => any)("org_invitations");
      const { data, error } = await from
        .select("id, invitee_email, role, status, expires_at, created_at, accepted_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgInvitation[];
    },
    enabled,
  });

  const invoke = useMutation({
    mutationFn: async (payload: InviteAction) => {
      const { data, error } = await supabase.functions.invoke("send-team-invite", {
        body: payload,
      });
      if (error) {
        // Extract server-side error message when available
        const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
        let message = error.message;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (body?.error) message = body.error;
          } catch {
            /* noop */
          }
        }
        throw new Error(message);
      }
      return data as { ok?: boolean; invitationId?: string; warning?: string; emailSent?: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-invitations"] });
    },
  });

  const sendInvite = (email: string, role: "user" | "manager") =>
    invoke.mutateAsync({ action: "send", email, role }).then(
      (res) => {
        if (res?.warning) {
          toast({ title: "Invitation created", description: res.warning, variant: "destructive" });
        } else {
          toast({ title: "Invitation sent", description: `Email delivered to ${email}` });
        }
        return res;
      },
      (err: Error) => {
        toast({ title: "Could not send invitation", description: err.message, variant: "destructive" });
        throw err;
      },
    );

  const resendInvite = (invitationId: string) =>
    invoke.mutateAsync({ action: "resend", invitationId }).then(
      () => {
        toast({ title: "Invitation resent" });
      },
      (err: Error) => {
        toast({ title: "Could not resend", description: err.message, variant: "destructive" });
        throw err;
      },
    );

  const revokeInvite = (invitationId: string) =>
    invoke.mutateAsync({ action: "revoke", invitationId }).then(
      () => {
        toast({ title: "Invitation revoked" });
      },
      (err: Error) => {
        toast({ title: "Could not revoke", description: err.message, variant: "destructive" });
        throw err;
      },
    );

  return {
    invitations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    sendInvite,
    resendInvite,
    revokeInvite,
    isMutating: invoke.isPending,
  };
}
