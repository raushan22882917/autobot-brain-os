import { useUser } from "@clerk/react";
import { User, Mail, Shield, Key, Bell, Zap, ChevronRight } from "lucide-react";

function SettingRow({ icon: Icon, label, desc, action, iconColor = "#555" }: {
  icon: any; label: string; desc: string; action?: React.ReactNode; iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-white/[0.02]"
      style={{ border: "1px solid #161616", background: "#0a0a0a" }}>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#111", border: "1px solid #1e1e1e" }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">{label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#3a3a3a" }}>{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: "#333" }}>{desc}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#444" }}>Manage your profile, security, and preferences.</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border p-6" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: "2px solid #DC2626" }}>
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "#DC2626" }}>
                  {user.firstName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black"
              style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-white">{user.fullName || "Executive"}</p>
            <p className="text-sm mt-0.5" style={{ color: "#444" }}>{user.primaryEmailAddress?.emailAddress}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                <Zap className="w-2.5 h-2.5 inline mr-1" />
                Executive Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <Section title="Personal Information" desc="Your identity within the Decision Brain OS.">
        <SettingRow icon={User} label={user.fullName || "Name not set"} desc="Full name from your account" iconColor="#a78bfa"
          action={
            <div className="flex items-center gap-1 text-[11px]" style={{ color: "#333" }}>
              Managed by Clerk <ChevronRight className="w-3 h-3" />
            </div>
          }
        />
        <SettingRow icon={Mail} label={user.primaryEmailAddress?.emailAddress || "No email"} desc="Primary email address" iconColor="#60a5fa"
          action={
            <div className="flex items-center gap-1 text-[11px]" style={{ color: "#333" }}>
              Verified <span className="text-emerald-500">✓</span>
            </div>
          }
        />
      </Section>

      {/* Security */}
      <Section title="Security" desc="Authentication and access controls.">
        <SettingRow icon={Key} label="Password" desc="Update your login credentials securely" iconColor="#f59e0b"
          action={
            <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/60 hover:text-white transition-colors"
              style={{ background: "#161616", border: "1px solid #222" }}>
              Update
            </button>
          }
        />
        <SettingRow icon={Shield} label="Two-Factor Authentication" desc="Add an extra layer of account security" iconColor="#22c55e"
          action={
            <div className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
              Managed by Clerk
            </div>
          }
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" desc="Control how Decision Brain alerts you.">
        <SettingRow icon={Bell} label="Alert Notifications" desc="Be notified of new blind spots and patterns" iconColor="#f87171"
          action={
            <div className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
              Enabled
            </div>
          }
        />
      </Section>

      {/* Danger zone */}
      <div className="rounded-2xl border p-5" style={{ background: "#0a0a0a", borderColor: "#1e1e1e" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#DC2626" }}>Danger Zone</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-white">Delete Account</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#3a3a3a" }}>Permanently remove your account and all data</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
