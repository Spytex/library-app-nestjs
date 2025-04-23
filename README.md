# Library Management System - NestJS API

![NestJS](https://img.shields.io/badge/NestJS-11.0.1-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)

A comprehensive library management system API built with NestJS, providing functionality to manage books, users, loans, and reviews.

## 📚 Overview

This application serves as a backend for a library management system, allowing librarians and users to:

- Manage books (add, update, find, delete)
- Handle user registrations
- Process book loans and returns
- Track overdue books
- Manage book reviews

The system implements both standalone endpoints for direct resource management and integrated "Library" endpoints that provide more complex, business-logic driven operations.

## 🛠️ Technologies Used

- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework
- **Database ORM**:
  - [TypeORM](https://typeorm.io/)
  - [DrizzleORM](https://orm.drizzle.team/)
- **Validation**: class-validator, class-transformer
- **Error Tracking**: Sentry
- **Testing**: Jest, Supertest
- **API Documentation**: Postman Collection

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd library-app-nestjs
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a .env file based on the provided .env.example:

   ```
   DB_ORM_TYPE=typeorm # typeorm or drizzle
   NODE_ENV=development # development or production
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=library_db
   PORT=3000
   ```

4. Run database migrations:

   - For TypeORM:
     ```bash
     npm run typeorm:run
     ```
   - For DrizzleORM:
     ```bash
     npm run drizzle:migrate
     ```

5. Start the application:

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## 📋 API Structure

The API is organized into several resource groups:

### Users

- `POST /users` - Create a new user
- `GET /users` - List all users (with pagination and filters)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user details
- `DELETE /users/:id` - Remove a user

### Books

- `POST /books` - Add a new book
- `GET /books` - List all books (with pagination and filters)
- `GET /books/:id` - Get book details
- `PATCH /books/:id` - Update book information
- `DELETE /books/:id` - Remove a book

### Loans

- `GET /loans` - List all loans
- `GET /loans/:id` - Get loan details
- `GET /users/:userId/loans` - Get loans for a specific user
- `GET /books/:bookId/loans` - Get loans for a specific book
- `PATCH /loans/:id/extend` - Extend a loan's due date

### Library Management

- `POST /library/loans` - Create a new book booking
- `PATCH /library/loans/:id/pickup` - Mark a booked loan as active (picked up)
- `PATCH /library/loans/:id/return` - Return a borrowed book

### Reviews

- `POST /reviews` or `POST /library/reviews` - Create a book review
- `GET /reviews` - List all reviews
- `GET /reviews/:id` - Get review details
- `GET /users/:userId/reviews` - Get reviews by a specific user
- `GET /books/:bookId/reviews` - Get reviews for a specific book
- `DELETE /reviews/:id` - Remove a review

## 📑 API Documentation

A comprehensive Postman collection is included in the project, providing a ready-to-use interface for testing all API endpoints. The collection includes:

- Organized endpoint folders by resource
- Request examples with parameters
- Description for each endpoint
- Environment variables for easy configuration

To use the Postman collection:

1. Import the postman-collection.json file into Postman
2. Create an environment with the `baseUrl` variable set to your API URL (default: http://localhost:3000)
3. Use the provided requests to interact with the API

## 🧪 Testing

The application includes comprehensive test coverage:

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## 🔄 Database Migration

### TypeORM

```bash
# Generate migration
npm run typeorm:generate

# Run migrations
npm run typeorm:run

# Revert migrations
npm run typeorm:revert
```

### DrizzleORM

```bash
# Generate migration
npm run drizzle:generate

# Run migrations
npm run drizzle:migrate

# Explore database with DrizzleKit Studio
npm run drizzle:studio
```

## ✨ Features

- RESTful API design
- Comprehensive validation and error handling
- Database abstraction with support for multiple ORMs
- Pagination for list endpoints
- Filtering and searching capabilities
- Detailed API documentation via Postman collection
- Error tracking with Sentry
- Comprehensive test suite

---

Developed with ❤️ using [NestJS](https://nestjs.com/)
