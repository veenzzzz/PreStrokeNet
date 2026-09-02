import { Bell, CheckCircle2, KeyRound, Moon, Save, ShieldCheck, Sun, UserPlus, UserRound, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/useToast";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-white/15"}`}
    >
      <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
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

export function Settings() {
  const { notify } = useToast();
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains("light"));
  const [notifications, setNotifications] = useState({ reports: true, product: true, weekly: false });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);

  // Manage Access Modal state
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Dr. QA Audit", email: "dr.qa.audit@clinic.com", role: "Auditor", status: "Active" },
    { id: "2", name: "Dr. Sarah Jenkins", email: "s.jenkins@stroke-center.org", role: "Doctor", status: "Active" },
    { id: "3", name: "Alex Morgan (Admin)", email: "a.morgan@stroke-center.org", role: "Admin", status: "Active" },
  ]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"Doctor" | "Admin" | "Auditor">("Doctor");

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight);
    localStorage.setItem("prestrokenet-theme", isLight ? "light" : "dark");
  }, [isLight]);

  const updatePassword = (field: keyof typeof password, value: string) => {
    setSaved(false);
    setPassword((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        eyebrow="Workspace preferences"
        title="Settings"
        description="Configure how PreStrokeNet looks, communicates, and keeps your workspace protected."
      />
      <div className="mt-7 grid max-w-5xl gap-5">
        {/* Appearance Section */}
        <section className="glass-panel p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Moon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Appearance</p>
              <h2 className="mt-1 font-display text-xl font-bold text-text">Interface theme</h2>
              <p className="mt-1 text-sm text-muted">Choose the visual environment that feels most comfortable during review.</p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              className={`flex min-w-36 items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                !isLight ? "border-primary/50 bg-primary/8 text-text" : "border-line text-muted hover:border-line-strong"
              }`}
              onClick={() => setIsLight(false)}
            >
              <Moon className="size-4" aria-hidden="true" />
              <span>Dark mode</span>
            </button>
            <button
              type="button"
              className={`flex min-w-36 items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                isLight ? "border-primary/50 bg-primary/8 text-text" : "border-line text-muted hover:border-line-strong"
              }`}
              onClick={() => setIsLight(true)}
            >
              <Sun className="size-4" aria-hidden="true" />
              <span>Light mode</span>
            </button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="glass-panel p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Notifications</p>
              <h2 className="mt-1 font-display text-xl font-bold text-text">Keep your team in sync</h2>
            </div>
          </div>
          <div className="mt-6 divide-y divide-line">
            {[
              { key: "reports", label: "Assessment complete", description: "Get notified when an AI assessment is ready for review." },
              { key: "product", label: "Product updates", description: "Occasional updates about new clinical workspace features." },
              { key: "weekly", label: "Weekly summary", description: "Receive a weekly digest of workspace activity." },
            ].map((setting) => (
              <div className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0" key={setting.key}>
                <div>
                  <p className="text-sm font-medium text-text">{setting.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{setting.description}</p>
                </div>
                <Toggle
                  checked={notifications[setting.key as keyof typeof notifications]}
                  onChange={(checked) => setNotifications((current) => ({ ...current, [setting.key]: checked }))}
                  label={setting.label}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Password Section */}
        <form className="glass-panel p-6 sm:p-7" onSubmit={handlePasswordSubmit}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Security</p>
                <h2 className="mt-1 font-display text-xl font-bold text-text">Change password</h2>
                <p className="mt-1 text-sm text-muted">Use a unique password to protect your clinical access.</p>
              </div>
            </div>
            {saved ? <CheckCircle2 className="mt-2 size-4 text-success" aria-label="Password saved" /> : null}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            <InputField
              id="current-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={password.current}
              onChange={(event) => updatePassword("current", event.target.value)}
            />
            <InputField
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password.next}
              onChange={(event) => updatePassword("next", event.target.value)}
            />
            <InputField
              id="confirm-new-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={password.confirm}
              onChange={(event) => updatePassword("confirm", event.target.value)}
            />
          </div>
          <div className="mt-7 flex justify-end">
            <Button icon={Save} type="submit">Update password</Button>
          </div>
        </form>

        {/* Account Controls Section */}
        <section className="glass-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Account controls</p>
              <p className="mt-1 text-xs text-muted">Manage team access and connected clinical workflows.</p>
            </div>
          </div>
          <Button variant="secondary" icon={UserRound} onClick={() => setIsManageAccessOpen(true)}>
            Manage access
          </Button>
        </section>
      </div>

      {/* Manage Access Modal */}
      {isManageAccessOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl overflow-hidden p-6 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-text">Manage Workspace Access</h2>
                  <p className="text-xs text-muted">Control team member access levels and permissions.</p>
                </div>
              </div>
              <button
                className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-text"
                onClick={() => setIsManageAccessOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddMember} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted mb-1">Invite Team Member</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@clinic.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>
              <div className="w-full sm:w-36">
                <label className="block text-xs font-medium text-muted mb-1">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Admin">Admin</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>
              <Button type="submit" icon={UserPlus} className="whitespace-nowrap">
                Invite
              </Button>
            </form>

            {/* Team Members List */}
            <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active Team Members ({teamMembers.length})</p>
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] p-3 text-sm">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-medium text-text truncate">{member.name}</p>
                    <p className="text-xs text-muted truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {member.role}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-danger/80 hover:text-danger hover:underline"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end border-t border-line pt-4">
              <Button variant="secondary" onClick={() => setIsManageAccessOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
