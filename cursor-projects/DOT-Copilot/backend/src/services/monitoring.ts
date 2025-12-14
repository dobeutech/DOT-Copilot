import { trackEvent, trackMetric, trackException } from './applicationInsights';
import { logInfo, logError } from './logger';

/**
 * Monitoring service for tracking custom metrics and events
 */

// =============================================================================
// User Events
// =============================================================================

export function trackUserLogin(userId: string, role: string) {
  trackEvent('UserLogin', { userId, role });
  logInfo('User logged in', { userId, role });
}

export function trackUserLogout(userId: string) {
  trackEvent('UserLogout', { userId });
  logInfo('User logged out', { userId });
}

export function trackPasswordReset(email: string) {
  trackEvent('PasswordResetRequested', { email: email.substring(0, 3) + '***' });
  logInfo('Password reset requested');
}

// =============================================================================
// Training Events
// =============================================================================

export function trackLessonCompleted(userId: string, lessonId: string, timeSpentSeconds: number) {
  trackEvent('LessonCompleted', { userId, lessonId });
  trackMetric('LessonCompletionTime', timeSpentSeconds);
  logInfo('Lesson completed', { userId, lessonId, timeSpentSeconds });
}

export function trackQuizSubmitted(userId: string, lessonId: string, score: number, passed: boolean) {
  trackEvent('QuizSubmitted', { userId, lessonId, passed: String(passed) });
  trackMetric('QuizScore', score);
  logInfo('Quiz submitted', { userId, lessonId, score, passed });
}

export function trackModuleCompleted(userId: string, moduleId: string) {
  trackEvent('ModuleCompleted', { userId, moduleId });
  logInfo('Module completed', { userId, moduleId });
}

export function trackProgramCompleted(userId: string, programId: string) {
  trackEvent('ProgramCompleted', { userId, programId });
  logInfo('Training program completed', { userId, programId });
}

// =============================================================================
// Assignment Events
// =============================================================================

export function trackAssignmentCreated(assignmentId: string, userId: string, assignedBy: string) {
  trackEvent('AssignmentCreated', { assignmentId, userId, assignedBy });
  logInfo('Assignment created', { assignmentId, userId, assignedBy });
}

export function trackAssignmentCompleted(assignmentId: string, userId: string) {
  trackEvent('AssignmentCompleted', { assignmentId, userId });
  logInfo('Assignment completed', { assignmentId, userId });
}

export function trackAssignmentOverdue(assignmentId: string, userId: string) {
  trackEvent('AssignmentOverdue', { assignmentId, userId });
  logInfo('Assignment became overdue', { assignmentId, userId });
}

// =============================================================================
// File Upload Events
// =============================================================================

export function trackFileUploaded(userId: string, fileType: string, sizeBytes: number) {
  trackEvent('FileUploaded', { userId, fileType });
  trackMetric('FileUploadSize', sizeBytes);
  logInfo('File uploaded', { userId, fileType, sizeBytes });
}

// =============================================================================
// Performance Metrics
// =============================================================================

export function trackApiLatency(endpoint: string, method: string, durationMs: number) {
  trackMetric('ApiLatency', durationMs);
  if (durationMs > 1000) {
    logInfo('Slow API request', { endpoint, method, durationMs });
  }
}

export function trackDatabaseQueryTime(operation: string, durationMs: number) {
  trackMetric('DatabaseQueryTime', durationMs);
  if (durationMs > 500) {
    logInfo('Slow database query', { operation, durationMs });
  }
}

// =============================================================================
// Error Tracking
// =============================================================================

export function trackApiError(error: Error, context: Record<string, string>) {
  trackException(error, context);
  logError('API error', error, context);
}

export function trackAuthError(error: Error, userId?: string) {
  trackException(error, { type: 'auth', userId: userId || 'unknown' });
  logError('Authentication error', error, { userId });
}

export function trackValidationError(endpoint: string, errors: string[]) {
  trackEvent('ValidationError', { endpoint, errorCount: String(errors.length) });
  logInfo('Validation error', { endpoint, errors });
}

// =============================================================================
// Business Metrics
// =============================================================================

export function trackActiveUsers(count: number) {
  trackMetric('ActiveUsers', count);
}

export function trackCompletionRate(fleetId: string, rate: number) {
  trackMetric('CompletionRate', rate);
  trackEvent('CompletionRateCalculated', { fleetId, rate: String(rate) });
}

export function trackOverdueAssignments(fleetId: string, count: number) {
  trackMetric('OverdueAssignments', count);
  if (count > 10) {
    logInfo('High number of overdue assignments', { fleetId, count });
  }
}

