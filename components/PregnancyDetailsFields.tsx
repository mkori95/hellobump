"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard } from "@/components/ui/radio-card";
import { DATING_METHODS } from "@/lib/pregnancy";
import type { PregnancyFormState } from "@/hooks/usePregnancyForm";

const FALLBACK_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function getTimezoneOptions(): string[] {
  try {
    const all = Intl.supportedValuesOf?.("timeZone");
    if (Array.isArray(all) && all.length > 0) return all;
  } catch {
    // fall through to the fallback list
  }
  return FALLBACK_TIMEZONES;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function PregnancyDetailsFields({ form }: { form: PregnancyFormState }) {
  const timezones = useMemo(getTimezoneOptions, []);
  const activeMethod = DATING_METHODS.find((m) => m.value === form.datingMethod)!;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Label>How are you dating this pregnancy?</Label>
        <div className="flex flex-col gap-2">
          {DATING_METHODS.map((m) => (
            <RadioCard
              key={m.value}
              name="datingMethod"
              label={m.label}
              checked={form.datingMethod === m.value}
              onChange={() => form.setDatingMethod(m.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="datingDate">{activeMethod.dateLabel}</Label>
        <Input
          id="datingDate"
          type="date"
          value={form.datingDate}
          onChange={(e) => form.setDatingDate(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="dueDate">Estimated due date</Label>
          {form.dueDate && !form.dueDateAdjusted && (
            <span className="text-xs text-muted-foreground">
              Auto-calculated — {formatDate(form.dueDate)}
            </span>
          )}
        </div>
        <Input
          id="dueDate"
          type="date"
          value={form.dueDate}
          onChange={(e) => form.handleDueDateChange(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Adjust this if an ultrasound gave you a different date.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Would you like daily check-in nudges?</Label>
        <div className="flex gap-2">
          <RadioCard
            name="notifyDailyCheckin"
            label="Yes, remind me"
            checked={form.notifyDailyCheckin === true}
            onChange={() => form.setNotifyDailyCheckin(true)}
            className="flex-1 justify-center"
          />
          <RadioCard
            name="notifyDailyCheckin"
            label="No thanks"
            checked={form.notifyDailyCheckin === false}
            onChange={() => form.setNotifyDailyCheckin(false)}
            className="flex-1 justify-center"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Would you like appointment reminders?</Label>
        <div className="flex gap-2">
          <RadioCard
            name="notifyAppointments"
            label="Yes, remind me"
            checked={form.notifyAppointments === true}
            onChange={() => form.setNotifyAppointments(true)}
            className="flex-1 justify-center"
          />
          <RadioCard
            name="notifyAppointments"
            label="No thanks"
            checked={form.notifyAppointments === false}
            onChange={() => form.setNotifyAppointments(false)}
            className="flex-1 justify-center"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Time zone</Label>
        <select
          id="timezone"
          value={form.timezone}
          onChange={(e) => form.setTimezone(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          required
        >
          {!timezones.includes(form.timezone) && form.timezone && (
            <option value={form.timezone}>{form.timezone}</option>
          )}
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Detected automatically — change it if this isn&apos;t right.
        </p>
      </div>
    </>
  );
}
