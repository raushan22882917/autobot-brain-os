import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Key } from "lucide-react";

export default function Settings() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Executive Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account and security settings.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your identity within the Decision Brain OS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-primary font-bold">{user.firstName?.[0] || 'U'}</span>
                )}
              </div>
              <div>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <Input defaultValue={user.firstName || ''} className="bg-input border-border text-white" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <Input defaultValue={user.lastName || ''} className="bg-input border-border text-white" disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <Input defaultValue={user.primaryEmailAddress?.emailAddress || ''} className="bg-input border-border text-white" disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Security
            </CardTitle>
            <CardDescription>Authentication and access controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <Key className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Password Authentication</p>
                  <p className="text-xs text-muted-foreground">Manage via Clerk securely.</p>
                </div>
              </div>
              <Button variant="outline" className="border-border text-white hover:bg-white/5">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}