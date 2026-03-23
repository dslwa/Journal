export type UUID = string;

// export type Attachment = {
//   id: UUID;
//   url: string;
//   filename: string;
//   contentType: string;
//   size: number;
// };

export type Trade = {
  id: UUID;
  ticker: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number | null;
  positionSize: number;
  openedAt: string;
  closedAt: string | null;
  stopLoss: number | null;
  playbookId: UUID | null;
  notes: string | null;
  createdAt: string;
};

// export type ChecklistItem = {
//   label: string;
//   checked: boolean;
// };

export type Playbook = {
  id: UUID;
  title: string;
  description: string | null;
  rules: string | null;
  setup: string | null;
  timeframe: string | null;
  riskNote: string | null;
  createdAt: string;
  updatedAt: string;
};
