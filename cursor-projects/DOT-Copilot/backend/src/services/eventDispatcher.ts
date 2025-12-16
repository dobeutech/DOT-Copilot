import prisma from '../db';
import { WebhookEventType } from '@prisma/client';

interface EventPayload {
  event: WebhookEventType;
  data: any;
  fleetId: string;
  userId?: string;
  timestamp?: Date;
}

interface WebhookDeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
}

class EventDispatcher {
  private maxRetries = 3;
  private retryDelayMs = 1000;

  /**
   * Dispatch an event to all registered webhooks
   */
  async dispatch(payload: EventPayload): Promise<WebhookDeliveryResult[]> {
    const { event, data, fleetId, userId, timestamp = new Date() } = payload;

    // Find all active webhooks for this fleet that are subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        fleetId,
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    if (webhooks.length === 0) {
      return [];
    }

    const results: WebhookDeliveryResult[] = [];

    // Dispatch to each webhook
    for (const webhook of webhooks) {
      const result = await this.deliverWebhook(webhook, {
        event,
        data,
        userId,
        timestamp: timestamp.toISOString(),
        webhookId: webhook.id,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Deliver a webhook with retry logic
   */
  private async deliverWebhook(
    webhook: any,
    payload: any
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    let lastError: string | undefined;
    let statusCode: number | undefined;
    let responseBody: string | undefined;

    for (let attempt = 1; attempt <= (webhook.maxRetries || this.maxRetries); attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Delivery-Id': `${webhook.id}-${Date.now()}`,
          ...(webhook.headers || {}),
        };

        // Add signature if secret is configured
        if (webhook.secret) {
          const signature = await this.generateSignature(
            JSON.stringify(payload),
            webhook.secret
          );
          headers['X-Webhook-Signature'] = signature;
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        statusCode = response.status;
        responseBody = await response.text();
        const responseTimeMs = Date.now() - startTime;

        const success = response.ok;

        // Record delivery
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: payload.event,
            payload,
            responseStatus: statusCode,
            responseBody: responseBody.substring(0, 1000), // Limit stored response
            responseTimeMs,
            success,
            attempts: attempt,
            errorMessage: success ? null : `HTTP ${statusCode}`,
          },
        });

        // Update webhook stats
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            successCount: success ? { increment: 1 } : undefined,
            failureCount: success ? undefined : { increment: 1 },
          },
        });

        if (success) {
          return {
            webhookId: webhook.id,
            success: true,
            statusCode,
            responseTimeMs,
          };
        }

        lastError = `HTTP ${statusCode}: ${responseBody.substring(0, 200)}`;
      } catch (error: any) {
        lastError = error.message;
        
        // If it's a timeout or network error, continue retry
        if (attempt < (webhook.maxRetries || this.maxRetries)) {
          await this.sleep((webhook.retryDelayMs || this.retryDelayMs) * attempt);
        }
      }
    }

    // All retries failed
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload,
        responseStatus: statusCode,
        success: false,
        attempts: webhook.maxRetries || this.maxRetries,
        errorMessage: lastError,
      },
    });

    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: { increment: 1 },
      },
    });

    return {
      webhookId: webhook.id,
      success: false,
      statusCode,
      error: lastError,
    };
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256=${hashHex}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // CONVENIENCE METHODS FOR COMMON EVENTS
  // ============================================

  async userCreated(user: any, fleetId: string) {
    return this.dispatch({
      event: 'USER_CREATED',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      fleetId,
      userId: user.id,
    });
  }

  async assignmentCreated(assignment: any, fleetId: string) {
    return this.dispatch({
      event: 'ASSIGNMENT_CREATED',
      data: {
        assignment: {
          id: assignment.id,
          userId: assignment.userId,
          trainingProgramId: assignment.trainingProgramId,
          moduleId: assignment.moduleId,
          dueDate: assignment.dueDate,
          status: assignment.status,
        },
      },
      fleetId,
      userId: assignment.userId,
    });
  }

  async trainingCompleted(completion: any, fleetId: string) {
    return this.dispatch({
      event: 'TRAINING_COMPLETED',
      data: {
        completion: {
          id: completion.id,
          userId: completion.userId,
          lessonId: completion.lessonId,
          moduleId: completion.moduleId,
          quizScore: completion.quizScore,
          completedDate: completion.completedDate,
        },
      },
      fleetId,
      userId: completion.userId,
    });
  }

  async quizSubmitted(response: any, fleetId: string, passed: boolean) {
    return this.dispatch({
      event: passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED',
      data: {
        quiz: {
          userId: response.userId,
          quizScore: response.quizScore,
          passed,
        },
      },
      fleetId,
      userId: response.userId,
    });
  }

  async documentExpiring(document: any, fleetId: string, daysUntilExpiration: number) {
    return this.dispatch({
      event: 'DOCUMENT_EXPIRING',
      data: {
        document: {
          id: document.id,
          userId: document.userId,
          documentType: document.documentType,
          expirationDate: document.expirationDate,
          daysUntilExpiration,
        },
      },
      fleetId,
      userId: document.userId,
    });
  }

  async documentExpired(document: any, fleetId: string) {
    return this.dispatch({
      event: 'DOCUMENT_EXPIRED',
      data: {
        document: {
          id: document.id,
          userId: document.userId,
          documentType: document.documentType,
          expirationDate: document.expirationDate,
        },
      },
      fleetId,
      userId: document.userId,
    });
  }

  async esignatureCaptured(record: any, fleetId: string) {
    return this.dispatch({
      event: 'ESIGNATURE_CAPTURED',
      data: {
        record: {
          id: record.id,
          userId: record.userId,
          lessonId: record.lessonId,
          esignatureTimestamp: record.esignatureTimestamp,
        },
      },
      fleetId,
      userId: record.userId,
    });
  }

  async assignmentOverdue(assignment: any, fleetId: string) {
    return this.dispatch({
      event: 'ASSIGNMENT_OVERDUE',
      data: {
        assignment: {
          id: assignment.id,
          userId: assignment.userId,
          trainingProgramId: assignment.trainingProgramId,
          dueDate: assignment.dueDate,
          daysPastDue: Math.floor(
            (Date.now() - new Date(assignment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      },
      fleetId,
      userId: assignment.userId,
    });
  }

  async btwSessionCompleted(session: any, fleetId: string) {
    return this.dispatch({
      event: 'BTW_SESSION_COMPLETED',
      data: {
        session: {
          id: session.id,
          traineeId: session.traineeId,
          trainerId: session.trainerId,
          totalMinutes: session.totalMinutes,
          routeType: session.routeType,
          sessionDate: session.sessionDate,
        },
      },
      fleetId,
      userId: session.traineeId,
    });
  }
}

export const eventDispatcher = new EventDispatcher();
export default eventDispatcher;
