"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PregnancyDetailsFields } from "@/components/PregnancyDetailsFields";
import { usePregnancyForm } from "@/hooks/usePregnancyForm";

export function SetupForm() {
  const router = useRouter();
  const form = usePregnancyForm();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

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

      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <PregnancyDetailsFields form={form} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
