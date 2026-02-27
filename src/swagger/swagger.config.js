import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JobLoom API',
      description:
        'Rural Employment Platform API - A job matching system connecting rural workers with employers. ' +
        'Features user management, job postings with geospatial search, application tracking, and a review & rating system with trust scores.',
      version: '1.0.0',
      contact: {
        name: 'JobLoom Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check and monitoring endpoints' },
      { name: 'Users', description: 'User registration, authentication, and profile management' },
      { name: 'Jobs', description: 'Job postings, search, filters, and geospatial queries' },
      { name: 'Applications', description: 'Job application workflow and status management' },
      { name: 'Reviews', description: 'Review & rating system with trust scores and badges' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '675c9d4c8e9a1b2c3d4e5f60' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['job_seeker', 'employer', 'admin'] },
            phone: { type: 'string', example: '+94771234567' },
            location: {
              type: 'object',
              properties: {
                village: { type: 'string' },
                district: { type: 'string' },
                province: { type: 'string' },
              },
            },
            skills: { type: 'array', items: { type: 'string' } },
            experience: { type: 'string' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Job: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '675c9d4c8e9a1b2c3d4e5f61' },
            employerId: { type: 'string' },
            title: { type: 'string', example: 'Farm Helper Needed' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['farming', 'carpentry', 'tailoring', 'masonry', 'labor', 'other'],
            },
            location: {
              type: 'object',
              properties: {
                village: { type: 'string' },
                district: { type: 'string' },
                province: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            salaryType: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'contract'] },
            salaryAmount: { type: 'number' },
            currency: { type: 'string', default: 'LKR' },
            skillsRequired: { type: 'array', items: { type: 'string' } },
            positions: { type: 'number' },
            status: { type: 'string', enum: ['open', 'closed', 'filled'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '675c9d4c8e9a1b2c3d4e5f62' },
            jobId: { type: 'string', description: 'Reference to Job' },
            jobSeekerId: { type: 'string', description: 'Reference to User (applicant)' },
            employerId: { type: 'string', description: 'Reference to User (job owner)' },
            coverLetter: { type: 'string', maxLength: 1000 },
            resumeUrl: { type: 'string', description: 'URL to resume (HTTP/HTTPS)' },
            status: {
              type: 'string',
              enum: ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
            },
            appliedAt: { type: 'string', format: 'date-time' },
            reviewedAt: { type: 'string', format: 'date-time', nullable: true },
            notes: {
              type: 'string',
              maxLength: 500,
              description: 'Job seeker personal notes (private)',
            },
            employerNotes: {
              type: 'string',
              maxLength: 500,
              description: 'Employer internal notes (private)',
            },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: [
                      'pending',
                      'reviewed',
                      'shortlisted',
                      'accepted',
                      'rejected',
                      'withdrawn',
                    ],
                  },
                  changedAt: { type: 'string', format: 'date-time' },
                  changedBy: { type: 'string', description: 'Reference to User' },
                },
              },
            },
            interviewDate: { type: 'string', format: 'date-time', nullable: true },
            withdrawalReason: { type: 'string', maxLength: 500, nullable: true },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            jobId: { type: 'string' },
            reviewerId: { type: 'string' },
            revieweeId: { type: 'string' },
            reviewerType: { type: 'string', enum: ['job_seeker', 'employer'] },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            workQuality: { type: 'number', minimum: 1, maximum: 5 },
            communication: { type: 'number', minimum: 1, maximum: 5 },
            punctuality: { type: 'number', minimum: 1, maximum: 5 },
            paymentOnTime: { type: 'number', minimum: 1, maximum: 5 },
            wouldRecommend: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RatingStats: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            averageRating: { type: 'number', example: 4.5 },
            totalReviews: { type: 'number', example: 12 },
            ratingDistribution: {
              type: 'object',
              properties: {
                5: { type: 'number' },
                4: { type: 'number' },
                3: { type: 'number' },
                2: { type: 'number' },
                1: { type: 'number' },
              },
            },
            trustScore: { type: 'number', example: 95 },
            badge: {
              type: 'string',
              nullable: true,
              enum: ['Elite', 'Top Rated', 'Trusted', 'Rising Star', null],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  },
  apis: ['./src/swagger/*.swagger.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
