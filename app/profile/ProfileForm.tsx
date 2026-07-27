"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound, CalendarHeart, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PregnancyDetailsFields } from "@/components/PregnancyDetailsFields";
import { usePregnancyForm } from "@/hooks/usePregnancyForm";
import type { DBPregnancyProfile, DBUser } from "@/lib/supabase";

type AccountFields = Pick<DBUser, "full_name" | "nickname" | "date_of_birth" | "email">;

export function ProfileForm({
  user,
  profile,
}: {
  user: AccountFields;
  profile: DBPregnancyProfile | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AccountCard user={user} />
      {profile ? (
        <PregnancyCard profile={profile} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You haven&apos;t finished pregnancy setup yet.{" "}
            <Link href="/setup" className="text-primary underline-offset-4 hover:underline">
              Finish setup
            </Link>
          </CardContent>
        </Card>
      )}
      <DangerZoneCard />
    </div>
  );
}

function AccountCard({ user }: { user: AccountFields }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.full_name);
  const [nickname, setNickname] = useState(user.nickname);
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth);
  const [email, setEmail] = useState(user.email);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (showPasswordFields && newPassword && newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          nickname,
          dateOfBirth,
          email,
          currentPassword: showPasswordFields ? currentPassword : undefined,
          newPassword: showPasswordFields ? newPassword : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setShowPasswordFields(false);
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-blue/60 px-5 py-3">
        <UserRound className="h-4 w-4 text-baby-blue-foreground" />
        <div>
          <p className="font-display text-base font-semibold text-baby-blue-foreground">Account</p>
          <p className="text-xs text-baby-blue-foreground/70">Your name, nickname, and login details.</p>
        </div>
      </div>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {showPasswordFields ? (
            <div className="flex flex-col gap-3 rounded-md border border-border p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setShowPasswordFields(false);
                  setCurrentPassword("");
                  setNewPassword("");
                }}
              >
                Cancel password change
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setShowPasswordFields(true)}
            >
              Change password
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">Saved.</p>}

          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PregnancyCard({ profile }: { profile: DBPregnancyProfile }) {
  const router = useRouter();
  const form = usePregnancyForm({
    datingMethod: profile.dating_method,
    datingDate: profile.dating_date,
    dueDate: profile.due_date,
    dueDateAdjusted: profile.due_date_adjusted,
    notifyDailyCheckin: profile.notify_daily_checkin,
    notifyAppointments: profile.notify_appointments,
    timezone: profile.timezone,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.isValid()) {
      setError("Please fill in every question above.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pregnancy-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datingMethod: form.datingMethod,
          datingDate: form.datingDate,
          dueDate: form.dueDate,
          dueDateAdjusted: form.dueDateAdjusted,
          notifyDailyCheckin: form.notifyDailyCheckin,
          notifyAppointments: form.notifyAppointments,
          timezone: form.timezone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-mint/60 px-5 py-3">
        <CalendarHeart className="h-4 w-4 text-baby-mint-foreground" />
        <div>
          <p className="font-display text-base font-semibold text-baby-mint-foreground">Pregnancy details</p>
          <p className="text-xs text-baby-mint-foreground/70">Dating method, due date, and reminder preferences.</p>
        </div>
      </div>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <PregnancyDetailsFields form={form} />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">Saved.</p>}

          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-destructive/40">
      <div className="flex items-center gap-2 bg-destructive/10 px-5 py-3">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <div>
          <p className="font-display text-base font-semibold text-destructive">Danger zone</p>
          <p className="text-xs text-destructive/80">
            Deleting your account permanently removes your profile, pregnancy details, and
            everything else tied to it. This can&apos;t be undone.
          </p>
        </div>
      </div>
      <CardContent className="pt-5">
        {confirming ? (
          <form onSubmit={handleDelete} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deletePassword">Confirm your password to delete your account</Label>
              <Input
                id="deletePassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? "Deleting..." : "Permanently delete my account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
