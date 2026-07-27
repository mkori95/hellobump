"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DBActivityLog } from "@/lib/supabase";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function sortActivities(list: DBActivityLog[]) {
  return [...list].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
}

export function ActivityManager({ initialActivities }: { initialActivities: DBActivityLog[] }) {
  const [activities, setActivities] = useState(initialActivities);

  return (
    <div className="flex flex-col gap-6">
      <NewActivityForm onCreated={(a) => setActivities((prev) => sortActivities([...prev, a]))} />

      {activities.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nothing logged yet — add what you did today above.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((a) => (
            <ActivityRow
              key={a.id}
              activity={a}
              onUpdated={(updated) =>
                setActivities((prev) => sortActivities(prev.map((x) => (x.id === updated.id ? updated : x))))
              }
              onDeleted={(id) => setActivities((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewActivityForm({ onCreated }: { onCreated: (a: DBActivityLog) => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      onCreated(data.activity);
      setDescription("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log an activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activityDate">Date</Label>
              <Input id="activityDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activityDescription">What did you do?</Label>
              <Input
                id="activityDescription"
                placeholder="e.g. 20 min walk, prenatal stretches"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Saving..." : "Add activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  activity,
  onUpdated,
  onDeleted,
}: {
  activity: DBActivityLog;
  onUpdated: (a: DBActivityLog) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(activity.activity_date);
  const [description, setDescription] = useState(activity.description);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/activity/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      onUpdated(data.activity);
      setEditing(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this activity? This can't be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/activity/${activity.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(activity.id);
    } else {
      setError("Could not delete activity.");
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`date-${activity.id}`}>Date</Label>
              <Input
                id={`date-${activity.id}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`description-${activity.id}`}>What did you do?</Label>
              <Input
                id={`description-${activity.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
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
          <p className="font-medium">{formatDate(activity.activity_date)}</p>
          <p className="text-sm text-muted-foreground">{activity.description}</p>
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
