import { Bell, CheckCircle2, KeyRound, Moon, Save, ShieldCheck, Sun, UserPlus, UserRound, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/useToast";

/* ── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (checked: boolean) => void; label: string; id: string }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app"
      style={{ background: checked ? "var(--primary)" : "var(--line-strong)" }}
    >
      <span
        className="absolute top-1 size-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
      />
    </button>
  );
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Doctor" | "Admin" | "Auditor";
  status: "Active" | "Pending";
}

/* ── Settings ────────────────────────────────────────────────────────────── */
export function Settings() {
  const { notify } = useToast();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState({ reports: true, product: true, weekly: false });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Dr. QA Audit", email: "dr.qa.audit@clinic.com", role: "Auditor", status: "Active" },
    { id: "2", name: "Dr. Sarah Jenkins", email: "s.jenkins@stroke-center.org", role: "Doctor", status: "Active" },
    { id: "3", name: "Alex Morgan (Admin)", email: "a.morgan@stroke-center.org", role: "Admin", status: "Active" },
  ]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"Doctor" | "Admin" | "Auditor">("Doctor");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    if (isDark) {
      localStorage.setItem("prestrokenet-theme", "dark");
    } else {
      localStorage.removeItem("prestrokenet-theme");
    }
  }, [isDark]);

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(true);
    setPassword({ current: "", next: "", confirm: "" });
    notify({ type: "success", title: "Password updated successfully" });
  };

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    const newMember: TeamMember = {
      id: String(Date.now()),
      name: newMemberEmail.split("@")[0].replace(".", " "),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      status: "Pending",
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setNewMemberEmail("");
    notify({ type: "success", title: `Invitation sent to ${newMember.email}` });
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    notify({ type: "info", title: "Team member access removed" });
  };

  return (
    <div className="page-canvas">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Configure how PreStrokeNet looks, communicates, and keeps your workspace secure."
      />

      <div className="mt-7 grid max-w-3xl gap-5">
        {/* Appearance */}
        <section
          className="rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          aria-labelledby="appearance-heading"
        >
          <div className="flex items-start gap-3 mb-6">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
            >
              <Moon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="section-label">Appearance</p>
              <h2 id="appearance-heading" className="mt-1 text-base font-bold text-text">Interface theme</h2>
              <p className="mt-1 text-sm text-muted">
                Choose the visual environment most comfortable for clinical review.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { label: "Light (default)", value: false, Icon: Sun },
              { label: "Dark mode", value: true, Icon: Moon },
            ].map(({ label, value, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setIsDark(value)}
                className="flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  borderColor: isDark === value
                    ? "color-mix(in srgb, var(--primary) 50%, transparent)"
                    : "var(--line)",
                  background: isDark === value ? "var(--primary-dim)" : "transparent",
                  color: isDark === value ? "var(--primary)" : "var(--muted)",
                }}
                aria-pressed={isDark === value}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section
          className="rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          aria-labelledby="notifications-heading"
        >
          <div className="flex items-start gap-3 mb-6">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
            >
              <Bell className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="section-label" style={{ color: "var(--blue)" }}>Notifications</p>
              <h2 id="notifications-heading" className="mt-1 text-base font-bold text-text">Keep your team in sync</h2>
            </div>
          </div>

          <div className="divide-y divide-line">
            {[
              { key: "reports", label: "Assessment complete", description: "Get notified when an AI assessment is ready for review." },
              { key: "product", label: "Product updates", description: "Occasional updates about new clinical workspace features." },
              { key: "weekly", label: "Weekly summary", description: "Receive a weekly digest of workspace activity." },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-text">{setting.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{setting.description}</p>
                </div>
                <Toggle
                  id={`toggle-${setting.key}`}
                  checked={notifications[setting.key as keyof typeof notifications]}
                  onChange={(checked) => setNotifications((c) => ({ ...c, [setting.key]: checked }))}
                  label={setting.label}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Password */}
        <form
          className="rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          onSubmit={handlePasswordSubmit}
          aria-labelledby="security-heading"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
              >
                <KeyRound className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="section-label" style={{ color: "var(--warning)" }}>Security</p>
                <h2 id="security-heading" className="mt-1 text-base font-bold text-text">Change password</h2>
                <p className="mt-1 text-sm text-muted">
                  Use a unique password to protect your clinical access.
                </p>
              </div>
            </div>
            {saved && (
              <CheckCircle2 className="mt-1 size-5 shrink-0" style={{ color: "var(--success)" }} aria-label="Password saved" />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InputField
              id="current-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={password.current}
              onChange={(e) => setPassword((c) => ({ ...c, current: e.target.value }))}
            />
            <InputField
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password.next}
              onChange={(e) => setPassword((c) => ({ ...c, next: e.target.value }))}
            />
            <InputField
              id="confirm-new-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={password.confirm}
              onChange={(e) => setPassword((c) => ({ ...c, confirm: e.target.value }))}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <Button icon={Save} type="submit">Update password</Button>
          </div>
        </form>

        {/* Access control */}
        <section
          className="rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          aria-labelledby="access-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--success-dim)", color: "var(--success)" }}
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 id="access-heading" className="text-sm font-semibold text-text">Team access</h2>
                <p className="mt-0.5 text-xs text-muted">Manage team members and access permissions.</p>
              </div>
            </div>
            <Button variant="secondary" icon={UserRound} onClick={() => setIsManageAccessOpen(true)}>
              Manage access
            </Button>
          </div>
        </section>
      </div>

      {/* Manage Access Modal */}
      {isManageAccessOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--surface-overlay)", backdropFilter: "blur(12px)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-line shadow-2xl"
            style={{ background: "var(--surface-strong)", boxShadow: "var(--shadow-xl)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
                >
                  <UserRound className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="modal-title" className="text-base font-bold text-text">Manage Workspace Access</h2>
                  <p className="text-xs text-muted">Control team member access levels and permissions.</p>
                </div>
              </div>
              <button
                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-text"
                onClick={() => setIsManageAccessOpen(false)}
                aria-label="Close modal"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Invite form */}
              <form onSubmit={handleAddMember} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="invite-email">
                    Invite team member
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="colleague@clinic.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full rounded-lg border border-line bg-app/50 px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="invite-role">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-app/50 px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Admin">Admin</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
                <Button type="submit" icon={UserPlus}>Invite</Button>
              </form>

              {/* Team members list */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                  Active team members ({teamMembers.length})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-line p-3 text-sm"
                      style={{ background: "var(--surface)" }}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-medium text-text truncate">{member.name}</p>
                        <p className="text-xs text-muted truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="badge badge-primary">{member.role}</span>
                        {member.status === "Pending" && (
                          <span className="badge badge-warning">Pending</span>
                        )}
                        <button
                          type="button"
                          className="text-xs font-medium transition-colors"
                          style={{ color: "color-mix(in srgb, var(--danger) 70%, transparent)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "color-mix(in srgb, var(--danger) 70%, transparent)")}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-line px-6 py-4">
              <Button variant="secondary" onClick={() => setIsManageAccessOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
