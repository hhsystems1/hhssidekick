/**
 * CommandCenter Types
 * Types for the Command Center dashboard components
 */

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface FocusItem {
  id: string;
  title: string;
  subtitle?: string;
  priority: PriorityLevel;
  actionLabel: string;
  category?: string;
  dueAt?: Date;
}

export interface QuickAction {
  id: string;
  type: 'task' | 'meeting' | 'message';
  label: string;
  icon: string;
}

export interface UpdateItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'team' | 'deadline' | 'resource' | 'mention';
  timestamp: Date;
  isRead: boolean;
}

export interface CommandCenterProps {
  onNavigateToSchedule?: () => void;
  onNavigateToChat?: () => void;
}
