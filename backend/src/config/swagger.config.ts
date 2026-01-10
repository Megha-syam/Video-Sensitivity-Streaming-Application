import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VideoConnect+ API Documentation',
      version: '1.0.0',
      description: 'Enterprise-grade video sharing platform with AI-powered sensitivity detection, role-based access control, and real-time collaboration features.',
      contact: {
        name: 'API Support',
        email: 'support@videoconnect.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://video-sensitivity-streaming-application.onrender.com'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login endpoint',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            mobile_number: { type: 'string', example: '+1234567890' },
            organization: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'TechCorp Inc.' },
            orgId: { type: 'string', example: 'TECHCORP' },
            email: { type: 'string', example: 'contact@techcorp.com' },
            description: { type: 'string' },
            address: { type: 'string' },
            mobile: { type: 'string' },
          },
        },
        Video: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            filename: { type: 'string' },
            filePath: { type: 'string' },
            videoType: { type: 'string', example: 'video/mp4' },
            videoName: { type: 'string', example: 'My Awesome Video' },
            videoDescription: { type: 'string' },
            status: { type: 'string', enum: ['processing', 'safe', 'flagged'] },
            uploadedBy: { type: 'string' },
            userType: { type: 'string', enum: ['user', 'organization'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            group_name: { type: 'string', example: 'Engineering Team' },
            description: { type: 'string' },
            users: { type: 'array', items: { type: 'string' } },
            created_by: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User and organization authentication endpoints' },
      { name: 'Videos', description: 'Video upload, management, and streaming' },
      { name: 'Groups', description: 'Group creation and management' },
      { name: 'Users', description: 'User profile and organization management' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
