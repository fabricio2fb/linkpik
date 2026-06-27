import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type TableColumn = {
  key: string;
  label: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  render?: (row: TableRow) => ReactNode;
};

export type TableRow = Record<string, string | number | boolean | ReactNode>;

export type Metric = {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  icon: LucideIcon;
  color: string;
};

export type SmartAlert = {
  title: string;
  text: string;
  tone: "success" | "warning" | "danger" | "accent";
  action?: string;
};

export type FilterConfig = {
  searchPlaceholder: string;
  selects: Array<{ label: string; options: string[] }>;
};

export type KanbanCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  action?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type TimelineStep = {
  title: string;
  text: string;
  status?: string;
  time?: string;
};
