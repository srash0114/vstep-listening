# Q&A System - Frontend

A modern, full-featured Question & Answer web application built with Next.js 16, React 19, TypeScript, and Tailwind CSS. Connects to a PHP REST API backend for data management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Key Features Documentation](#key-features-documentation)
- [API Integration](#api-integration)
- [Development](#development)
- [Deployment](#deployment)

## ✨ Features

### User Authentication
- User registration with email validation
- Secure login with JWT token
- Token persistence in localStorage
- Automatic logout on token expiration
- Protected routes for authenticated users

### Questions Management
- Browse all questions with pagination (10 per page)
- Create new questions with title, description, category, and tags
- View detailed question information
- Edit own questions
- Delete own questions
- Track view count and answer count

### Answers System
- Post answers to questions
- View all answers with sorting options (newest, oldest, most voted)
- Vote on answers (upvote/downvote)
- Edit own answers
- Delete own answers
- Real-time answer count updates

### User Profiles
- View own profile with statistics
- Track posted questions and answers
- View total votes received
- Display join date and user information
- User-friendly profile layout

### UI/UX
- Responsive design (mobile, tablet, desktop)
- Clean and intuitive interface
- Error handling with user-friendly messages
- Loading states for all API calls
- Alert notifications for actions
- Form validation with helpful feedback

## 🛠 Tech Stack

- **Framework**: [Next.js 16.2.0](https://nextjs.org/)
- **UI Library**: [React 19.2.4](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Routing**: Next.js App Router
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Clone or navigate to the project
cd vstep-listening

# Install dependencies
npm install

# Configure environment
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the application.

### Available Commands

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Check code quality
npm run lint
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Home - Questions list
│   ├── layout.tsx               # Root layout with Navbar
│   ├── not-found.tsx            # 404 page
│   ├── globals.css              # Global styles
│   ├── register/page.tsx        # User registration
│   ├── login/page.tsx           # User login
│   ├── ask/page.tsx             # Create question (protected)
│   ├── profile/page.tsx         # User profile (protected)
│   └── questions/
│       └── [id]/
│           ├── page.tsx         # Question detail with answers
│           └── edit/page.tsx    # Edit question (protected)
│
├── components/                   # Reusable React components
│   ├── Navbar.tsx               # Navigation bar
│   ├── Alert.tsx                # Alert/notification
│   ├── FormInput.tsx            # Text input field
│   ├── Textarea.tsx             # Textarea field
│   ├── Pagination.tsx           # Pagination controls
│   ├── VoteButton.tsx           # Vote controls
│   └── CircularLoading.tsx      # Loading spinner
│
├── lib/                          # Utilities and API client
│   ├── api.ts                   # Axios API client
│   ├── auth.ts                  # Auth helpers (tokens, storage)
│   └── utils.ts                 # Utility functions (formatters, validators)
│
├── types/                        # TypeScript types
│   └── index.ts                 # All type definitions
│
├── public/                       # Static assets
├── .env.local                   # Environment variables
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.ts               # Next.js config
└── tailwind.config.mjs          # Tailwind CSS config
```

## 📚 Key Features Documentation

### Authentication
- Tokens stored in `localStorage` with key `token`
- User data cached in `localStorage` with key `user`
- Automatic token injection in API requests
- Redirect to login on 401 errors
- See `lib/auth.ts` for helper functions

### API Client
- Centralized API configuration in `lib/api.ts`
- Automatic request/response interceptors
- Error handling with user feedback
- All endpoints properly typed with TypeScript

### Form Validation
- Email validation with regex
- Password strength requirements (minimum 6 characters)
- Real-time error display
- Form submission validation
- See `lib/utils.ts` for validators

### Responsive Design
- Mobile-first approach
- Tailwind CSS responsive utilities
- Flexible grid layouts
- Touch-friendly buttons and inputs
- Optimized for all screen sizes

## 🔗 API Integration

### Authentication Endpoints
```
POST /auth/register
POST /auth/login
GET /auth/profile
```

### Question Endpoints
```
GET /questions?page=1&limit=10
GET /questions/detail?id=<id>
POST /questions
PUT /questions
DELETE /questions?id=<id>
```

### Answer Endpoints
```
GET /answers?question_id=<id>
POST /answers
PUT /answers
DELETE /answers?id=<id>
POST /answers/<id>/vote
```

For detailed API documentation, see `SETUP_GUIDE.md`

## 👨‍💻 Development

### Adding New Features

1. Create components in `components/` directory
2. Create pages in `app/` following Next.js App Router conventions
3. Add API calls in `lib/api.ts`
4. Add types in `types/index.ts`

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add comments for complex logic
- Use React hooks for state management
- Keep components small and reusable

### Testing Guidelines

1. Test all CRUD operations
2. Verify error handling
3. Test responsive design
4. Check authentication flows
5. Test form validation

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup
Set `NEXT_PUBLIC_API_URL` to your production API URL

### Hosting Options
- **Vercel** (recommended): `vercel deploy`
- **Netlify**: Connect GitHub repository
- **AWS Amplify**: Deploy from GitHub
- **Self-hosted**: Use `npm start` with Node.js server

## 📖 Documentation

- [FRONTEND_README.md](./FRONTEND_README.md) - Detailed feature documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Installation and configuration guide
- [AGENTS.md](./AGENTS.md) - Project agent rules

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection fails | Ensure backend is running on http://localhost:8000 |
| CORS errors | Configure backend CORS headers |
| Token cleared on refresh | Check localStorage is enabled |
| Page not updating | Verify React useEffect dependencies |
| Build errors | Run `npm install` and check Node.js version |

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## 📄 License

MIT License - feel free to use this project as a template

## 📞 Support

For questions or issues:
1. Check the documentation files
2. Review code comments and types
3. Check browser console for errors
4. Verify backend API is responding
#   v s t e p - l i s t e n i n g  
 