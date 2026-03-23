export type UUID = string;

export interface JournalEntry {
  id?: UUID;
  entryDate: string; // ISO date "YYYY-MM-DD"
  mood: number | null; // 1-5
  energy: number | null; // 1-5
  notes: string;
  lessonsLearned: string;
  mistakes: string;
  createdAt?: string;
  updatedAt?: string;
}
