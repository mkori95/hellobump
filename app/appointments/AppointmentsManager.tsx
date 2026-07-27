"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DBAppointment } from "@/lib/supabase";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function AppointmentsManager({
  initialAppointments,
}: {
  initialAppointments: DBAppointment[];
}) {
  const [appointments, setAppointments] = useState(initialAppointments);

  return (
    <div className="flex flex-col gap-6">
      <NewAppointmentForm onCreated={(a) => setAppointments((prev) => sortAppts([...prev, a]))} />

      {appointments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No appointments yet — add your first one above.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {appointments.map((appt) => (
            <AppointmentRow
              key={appt.id}
              appt={appt}
              onUpdated={(updated) =>
                setAppointments((prev) => sortAppts(prev.map((a) => (a.id === updated.id ? updated : a))))
              }
              onDeleted={(id) => setAppointments((prev) => prev.filter((a) => a.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function sortAppts(list: DBAppointment[]) {
  return [...list].sort((a, b) =>
    (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time)
  );
}

function NewAppointmentForm({ onCreated }: { onCreated: (a: DBAppointment) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, notes }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      onCreated(data.appointment);
      setDate("");
      setTime("");
      setNotes("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newDate">Date</Label>
              <Input id="newDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newTime">Time</Label>
              <Input id="newTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newNotes">Notes</Label>
            <Input
              id="newNotes"
              placeholder="e.g. 20-week anatomy scan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Adding..." : "Add appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AppointmentRow({
  appt,
  onUpdated,
  onDeleted,
}: {
  appt: DBAppointment;
  onUpdated: (a: DBAppointment) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(appt.appointment_date);
  const [time, setTime] = useState(appt.appointment_time.slice(0, 5));
  const [notes, setNotes] = useState(appt.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, notes }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      onUpdated(data.appointment);
      setEditing(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this appointment? This can't be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/appointments/${appt.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(appt.id);
    } else {
      setError("Could not delete appointment.");
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`date-${appt.id}`}>Date</Label>
                <Input
                  id={`date-${appt.id}`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`time-${appt.id}`}>Time</Label>
                <Input
                  id={`time-${appt.id}`}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`notes-${appt.id}`}>Notes</Label>
              <Input id={`notes-${appt.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-6">
        <div>
          <p className="font-medium">
            {formatDate(appt.appointment_date)} at {formatTime(appt.appointment_time)}
          </p>
          {appt.notes && <p className="text-sm text-muted-foreground">{appt.notes}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
