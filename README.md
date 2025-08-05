# AI Tutor - AI-Powered Tutoring Platform

An intelligent tutoring platform that provides personalized AI-powered educational assistance, designed to replace traditional online human tutors.

## Features

- **User Authentication**: Secure signup and login system
- **AI-Powered Tutoring**: Real-time conversational AI tutor
- **Multi-language Support**: Teach in the user's preferred language
- **File Upload**: Upload PDFs and slides for context-aware explanations
- **Real-time Chat**: Live interaction with the AI tutor
- **Session Management**: Track and manage tutoring sessions

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API framework
- **MongoDB** with **Mongoose** for database
- **Socket.io** for real-time communication
- **JWT** for authentication
- **OpenAI API** for AI responses

### Frontend (Coming Soon)
- **React.js** with **TypeScript**
- **Socket.io-client** for real-time features
- **Modern UI/UX** design

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** installed and running locally
- **OpenAI API Key** (for AI functionality)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_Tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-tutor
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start the development server**
   ```bash
   npm run server:dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile` - Get user profile

### Sessions
- `POST /api/session/start` - Start a new tutoring session
- `POST /api/session/message` - Send message to AI tutor

## Database Schema

### User Model
```typescript
{
  name: string,
  email: string,
  password: string (hashed),
  language: string,
  aiTutorName: string,
  isCustomTutor: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Development

### Available Scripts
- `npm run server:dev` - Start development server with hot reload
- `npm run server:build` - Build TypeScript to JavaScript
- `npm run server:start` - Start production server
- `npm run dev` - Start both backend and frontend (when frontend is ready)

### Project Structure
```
src/
├── config/
│   └── database.ts          # Database configuration
├── middleware/
│   ├── errorHandler.ts      # Error handling middleware
│   └── notFound.ts          # 404 handler
├── models/
│   └── User.ts              # User database model
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── user.ts              # User management routes
│   └── session.ts           # Session management routes
└── server.ts                # Main server file
```

## Current Status

### Completed
- Project structure and setup
- Basic Express server with TypeScript
- Database configuration and User model
- Authentication routes (register/login)
- Basic session management structure
- Error handling middleware

### In Progress
- Frontend React application
- AI integration with OpenAI
- Real-time chat functionality
- File upload capabilities

### Planned Features
- Custom AI tutor personalities
- Advanced session analytics
- Multi-language AI responses
- Document processing and analysis

## Contributing

This is a 3rd year BSc project in Artificial Intelligence and Computer Science. The project is designed to demonstrate full-stack development skills with AI integration.

## License

This project is created for educational purposes as part of a university degree program.

## Support

For questions or issues related to this project, please refer to the project documentation.