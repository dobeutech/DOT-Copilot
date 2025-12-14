// In-memory data store (replace with actual database in production)
// This simulates the Bubble.io database structure

export interface User {
  id: string;
  email: string;
  name?: string;
  password?: string; // In production, this should be hashed
  [key: string]: any;
}

export interface Fleet {
  id: string;
  locations?: string;
  cargo_type?: string;
  cdl_status?: string;
  company_name?: string;
  vehicle_types?: string;
  key_risk_areas?: string;
  operation_type?: string;
  states_of_operation?: string;
  onboarding_completed?: boolean;
  compliance_profile_configured?: boolean;
}

export interface TrainingProgram {
  id: string;
  description?: string;
  program_name?: string;
  fleet_id?: string;
  is_recommended?: boolean;
}

export interface Module {
  id: string;
  description?: string;
  module_name?: string;
  fleet_id?: string;
  sequence_order?: number;
  training_program_id?: string;
}

export interface Lesson {
  id: string;
  content?: string;
  file_url?: string;
  lesson_name?: string;
  content_type?: string;
  fleet_id?: string;
  module_id?: string;
  sequence_order?: number;
  requires_esignature?: boolean;
}

export interface Assignment {
  id: string;
  user_id: string;
  status?: string;
  due_date?: Date | string;
  assigned_date?: Date | string;
  fleet_id?: string;
  module_id?: string;
  training_program_id?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message?: string;
  is_read?: boolean;
  fleet_id?: string;
  notification_type?: string;
  related_assignment_id?: string;
}

export interface CompletionRecord {
  id: string;
  user_id: string;
  esignature?: string;
  quiz_score?: number;
  fleet_id?: string;
  completed_date?: Date | string;
  lesson_id?: string;
  module_id?: string;
  esignature_timestamp?: Date | string;
  assignment_id?: string;
}

// In-memory stores
export const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'password123', // In production, use bcrypt
  },
];

export const fleets: Fleet[] = [];
export const trainingPrograms: TrainingProgram[] = [];
export const modules: Module[] = [];
export const lessons: Lesson[] = [];
export const assignments: Assignment[] = [];
export const notifications: Notification[] = [];
export const completionRecords: CompletionRecord[] = [];

