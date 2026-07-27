"use client";

import { useEffect, useState } from "react";
import { calculateDueDate, type DatingMethod } from "@/lib/pregnancy";

export interface PregnancyFormInitial {
  datingMethod?: DatingMethod;
  datingDate?: string;
  dueDate?: string;
  dueDateAdjusted?: boolean;
  notifyDailyCheckin?: boolean | null;
  notifyAppointments?: boolean | null;
  timezone?: string;
}

/** Shared state + due-date-calc logic behind the pregnancy details form,
 * used by both the initial setup flow and the profile edit page. */
export function usePregnancyForm(initial?: PregnancyFormInitial) {
  const [datingMethod, setDatingMethodRaw] = useState<DatingMethod>(
    initial?.datingMethod ?? "lmp"
  );
  const [datingDate, setDatingDateRaw] = useState(initial?.datingDate ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [dueDateAdjusted, setDueDateAdjusted] = useState(initial?.dueDateAdjusted ?? false);
  const [notifyDailyCheckin, setNotifyDailyCheckin] = useState<boolean | null>(
    initial?.notifyDailyCheckin ?? null
  );
  const [notifyAppointments, setNotifyAppointments] = useState<boolean | null>(
    initial?.notifyAppointments ?? null
  );
  const [timezone, setTimezone] = useState(initial?.timezone ?? "");

  useEffect(() => {
    if (!initial?.timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    // Only ever run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calculate the due date whenever the method or base date changes,
  // unless she's already manually adjusted it since the last change.
  useEffect(() => {
    if (!datingDate || dueDateAdjusted) return;
    setDueDate(calculateDueDate(datingMethod, datingDate));
  }, [datingMethod, datingDate, dueDateAdjusted]);

  function setDatingMethod(method: DatingMethod) {
    setDatingMethodRaw(method);
    setDueDateAdjusted(false);
  }

  function setDatingDate(value: string) {
    setDatingDateRaw(value);
    setDueDateAdjusted(false);
  }

  function handleDueDateChange(value: string) {
    setDueDate(value);
    setDueDateAdjusted(true);
  }

  function isValid() {
    return !!datingDate && !!dueDate && notifyDailyCheckin !== null && notifyAppointments !== null && !!timezone;
  }

  return {
    datingMethod,
    setDatingMethod,
    datingDate,
    setDatingDate,
    dueDate,
    handleDueDateChange,
    dueDateAdjusted,
    notifyDailyCheckin,
    setNotifyDailyCheckin,
    notifyAppointments,
    setNotifyAppointments,
    timezone,
    setTimezone,
    isValid,
  };
}

export type PregnancyFormState = ReturnType<typeof usePregnancyForm>;
