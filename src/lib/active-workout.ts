const STORAGE_KEY = "active-workout-session";

export interface ActiveWorkoutState {
  workoutId: string;
  workoutName: string;
  currentIndex: number;
  currentSet: number;
  elapsed: number;
  weightLog: Record<number, Record<number, string>>;
  weightConfirmed: Record<string, boolean>;
  totalExercises: number;
  startedAt: string; // ISO string
}

export function saveActiveWorkout(state: ActiveWorkoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadActiveWorkout(): ActiveWorkoutState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkoutState;
    // Expire after 4 hours
    const startedAt = new Date(parsed.startedAt).getTime();
    if (Date.now() - startedAt > 4 * 60 * 60 * 1000) {
      clearActiveWorkout();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveWorkout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
