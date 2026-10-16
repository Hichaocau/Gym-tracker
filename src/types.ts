export type ExerciseKind = 'weight' | 'bodyweight' | 'time' | 'cardio'

export type ColorKey = 'teal' | 'pink' | 'blue' | 'amber' | 'purple' | 'coral'

export interface LibraryExercise {
  id: string
  name: string
  en: string
  group: string
  kind: ExerciseKind
  equipment: string
  image: string
  instructions: string[]
  /** extra search terms, e.g. "chest fly" */
  aliases?: string[]
}

/** Exercise a profile added by hand (not in the library). */
export interface CustomExercise {
  id: string
  name: string
  group: string
  kind: ExerciseKind
}

/** One set. Which fields are used depends on the exercise kind. kg = weight per side/dumbbell. */
export interface SetEntry {
  reps?: number
  kg?: number
  seconds?: number
  /** ticked off during the workout */
  done?: boolean
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  sets: SetEntry[]
  /** cardio only */
  minutes?: number
  km?: number
}

/** One workout of one profile on one day. */
export interface Session {
  id: string
  profileId: string
  date: string // YYYY-MM-DD
  groups: string[]
  start?: string // HH:MM
  end?: string // HH:MM
  /** Manual total minutes, used when start/end are not both set. */
  durationMin?: number
  exercises: ExerciseEntry[]
  note?: string
}

export interface Profile {
  id: string
  name: string
  color: ColorKey
  groups: string[]
  habits: string[]
  weeklyGoal: number
  customExercises: CustomExercise[]
}

export interface AppState {
  version: 1
  profiles: Profile[]
  sessions: Session[]
  /** habitLogs[profileId][date] = habits ticked that day */
  habitLogs: Record<string, Record<string, string[]>>
  currentProfileId: string | null
  /** YYYY-MM-DD of the last exported backup file */
  lastBackupAt?: string
}
