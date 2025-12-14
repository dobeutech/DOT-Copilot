// TypeScript types generated from Bubble.io data types

export interface User {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export interface Fleet {
  id?: string;
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

export interface Lesson {
  id?: string;
  content?: string;
  file_url?: string;
  lesson_name?: string;
  content_type?: string;
  fleet?: Fleet;
  module?: Module;
  sequence_order?: number;
  requires_esignature?: boolean;
}

export interface Module {
  id?: string;
  description?: string;
  module_name?: string;
  fleet?: Fleet;
  sequence_order?: number;
  training_program?: TrainingProgram;
}

export interface AuditLog {
  id?: string;
  user?: User;
  action?: string;
  details?: string;
  timestamp?: Date | string;
  entity_id?: number;
  entity_type?: string;
  fleet?: Fleet;
}

export interface Assignment {
  id?: string;
  user?: User;
  status?: string;
  due_date?: Date | string;
  assigned_date?: Date | string;
  fleet?: Fleet;
  module?: Module;
  training_program?: TrainingProgram;
}

export interface Notification {
  id?: string;
  user?: User;
  message?: string;
  is_read?: boolean;
  fleet?: Fleet;
  notification_type?: string;
  related_assignment?: Assignment;
}

export interface QuizQuestion {
  id?: string;
  question_text?: string;
  answer_options?: string;
  correct_answer?: string;
  lesson?: Lesson;
  sequence_order?: number;
}

export interface QuizResponse {
  id?: string;
  user?: User;
  answered_at?: Date | string;
  is_correct?: boolean;
  selected_answer?: string;
  quiz_question?: QuizQuestion;
  completion_record?: CompletionRecord;
}

export interface TrainingProgram {
  id?: string;
  description?: string;
  program_name?: string;
  fleet?: Fleet;
  is_recommended?: boolean;
}

export interface CompletionRecord {
  id?: string;
  user?: User;
  esignature?: string;
  quiz_score?: number;
  fleet?: Fleet;
  completed_date?: Date | string;
  lesson?: Lesson;
  module?: Module;
  esignature_timestamp?: Date | string;
  assignment?: Assignment;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Page route types
export type PageRoute = 
  | '/'
  | '/reset-pw'
  | '/404'
  | '/supervisor'
  | '/driver-dashboard'
  | '/training-builder'
  | '/user-management';

