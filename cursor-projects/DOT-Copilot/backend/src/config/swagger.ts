import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOT Copilot API',
      version: '1.0.0',
      description: 'API documentation for DOT Copilot training management system',
      contact: {
        name: 'API Support',
        email: 'support@dot-copilot.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.dot-copilot.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['DRIVER', 'SUPERVISOR', 'ADMIN'] },
            fleetId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Fleet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyName: { type: 'string' },
            locations: { type: 'string', nullable: true },
            cargoType: { type: 'string', nullable: true },
            cdlStatus: { type: 'string', nullable: true },
            vehicleTypes: { type: 'string', nullable: true },
            keyRiskAreas: { type: 'string', nullable: true },
            operationType: { type: 'string', nullable: true },
            statesOfOperation: { type: 'string', nullable: true },
            onboardingCompleted: { type: 'boolean' },
            complianceProfileConfigured: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TrainingProgram: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            programName: { type: 'string' },
            description: { type: 'string', nullable: true },
            isRecommended: { type: 'boolean' },
            fleetId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            moduleName: { type: 'string' },
            description: { type: 'string', nullable: true },
            sequenceOrder: { type: 'integer' },
            fleetId: { type: 'string' },
            trainingProgramId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lessonName: { type: 'string' },
            content: { type: 'string', nullable: true },
            contentType: { type: 'string', nullable: true },
            fileUrl: { type: 'string', nullable: true },
            sequenceOrder: { type: 'integer' },
            requiresEsignature: { type: 'boolean' },
            fleetId: { type: 'string' },
            moduleId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            assignedDate: { type: 'string', format: 'date-time' },
            userId: { type: 'string' },
            fleetId: { type: 'string' },
            moduleId: { type: 'string', nullable: true },
            trainingProgramId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            message: { type: 'string' },
            notificationType: { type: 'string' },
            isRead: { type: 'boolean' },
            userId: { type: 'string' },
            fleetId: { type: 'string', nullable: true },
            relatedAssignmentId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string', nullable: true },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

