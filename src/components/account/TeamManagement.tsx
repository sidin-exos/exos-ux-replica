import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send, RotateCw, X, Mail } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useOrgInvitations } from "@/hooks/useOrgInvitations";

interface TeamManagementProps {
  organizationId: string | null;
  currentUserId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "Member",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function expiryLabel(expiresAt: string): { label: string; expired: boolean } {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  if (expiry < now) return { label: "Expired", expired: true };
  const days = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
  return { label: days === 1 ? "Expires in 1 day" : `Expires in ${days} days`, expired: false };
}

const TeamManagement = ({ organizationId, currentUserId }: TeamManagementProps) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "manager">("user");

  const members = useTeamMembers(organizationId, !!organizationId);
  const invitations = useOrgInvitations(!!organizationId);

  const pendingInvitations = invitations.invitations.filter((i) => i.status === "pending");

  const emailValid = EMAIL_RE.test(inviteEmail.trim());
  const canSubmit = emailValid && !invitations.isMutating;

  const handleSendInvite = async () => {
    if (!canSubmit) return;
    try {
      await invitations.sendInvite(inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail("");
      setInviteRole("user");
    } catch {
      /* toast already shown */
    }
  };

  return (
    <div id="section-team" className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">Team</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Invite colleagues to collaborate in your organization.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="font-display text-base font-medium text-foreground mb-4">Invite a colleague</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendInvite();
                }
              }}
            />
          </div>
          <div className="sm:w-40">
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "user" | "manager")}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSendInvite} disabled={!canSubmit} className="h-10 gap-2">
            {invitations.isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send invite
          </Button>
        </div>
      </div>

      {/* Pending invitations */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="font-display text-base font-medium text-foreground mb-4">
          Pending invitations
          {pendingInvitations.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">({pendingInvitations.length})</span>
          )}
        </h3>

        {invitations.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : pendingInvitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingInvitations.map((inv) => {
              const { label, expired } = expiryLabel(inv.expires_at);
              return (
                <li key={inv.id} className="py-3 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{inv.invitee_email}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 items-center mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </Badge>
                      <span>Sent {formatDate(inv.created_at)}</span>
                      <span className={expired ? "text-destructive" : ""}>· {label}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => invitations.resendInvite(inv.id).catch(() => {})}
                    disabled={invitations.isMutating}
                    className="gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => invitations.revokeInvite(inv.id).catch(() => {})}
                    disabled={invitations.isMutating}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                    Revoke
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Current members */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="font-display text-base font-medium text-foreground mb-4">
          Members
          {members.members.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">({members.members.length})</span>
          )}
        </h3>

        {members.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : members.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.members.map((m) => {
              const displayName = m.full_name || m.display_name || m.email || "—";
              const isCurrentUser = m.id === currentUserId;
              return (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.email}
                      {m.job_title ? ` · ${m.job_title}` : ""}
                      {` · Joined ${formatDate(m.created_at)}`}
                    </div>
                  </div>
                  {m.role === "admin" || isCurrentUser ? (
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                  ) : (
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        members.updateRole.mutate({ memberId: m.id, role: v as "user" | "manager" })
                      }
                      disabled={members.updateRole.isPending}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
