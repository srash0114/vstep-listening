# 📚 Q&A System - Frontend

> A modern, full-featured Question & Answer web application built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS**. Connects to a PHP REST API backend for seamless data management.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [📚 Key Features Documentation](#-key-features-documentation)
- [🔗 API Integration](#-api-integration)
- [👨‍💻 Development](#-development)
- [🚢 Deployment](#-deployment)
- [🔧 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## ✨ Features

### 🔐 User Authentication
- User registration with email validation
- Secure login with JWT token
- Token persistence in localStorage
- Automatic logout on token expiration
- Protected routes for authenticated users

### 📝 Questions Management
- Browse all questions with pagination (10 per page)
- Create new questions with title, description, category, and tags
- View detailed question information
- Edit own questions
- Delete own questions
- Track view count and answer count

### 💬 Answers System
- Post answers to questions
- View all answers with sorting options (newest, oldest, most voted)
- Vote on answers (upvote/downvote)
- Edit own answers
- Delete own answers
- Real-time answer count updates

### 👤 User Profiles
- View own profile with statistics
- Track posted questions and answers
- View total votes received
- Display join date and user information
- User-friendly profile layout

### 🎨 UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Clean and intuitive interface
- ✅ Error handling with user-friendly messages
- ✅ Loading states for all API calls
- ✅ Alert notifications for actions
- ✅ Form validation with helpful feedback

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16.2.0](https://nextjs.org/) |
| **UI Library** | [React 19.2.4](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Routing** | Next.js App Router |
| **Package Manager** | npm |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on http://localhost:8000

### Installation

```bash
# Navigate to the project directory
cd vstep-listening

# Install dependencies
npm install

# Configure environment variables
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using the application.

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

---

## 📁 Project Structure

```
vstep-listening/
├── app/                              # Next.js App Router pages
│   ├── page.tsx                      # Home - Questions list
│   ├── layout.tsx                    # Root layout with Navbar
│   ├── not-found.tsx                 # 404 page
│   ├── globals.css                   # Global styles
│   ├── register/page.tsx             # User registration
│   ├── login/page.tsx                # User login
│   ├── ask/page.tsx                  # Create question (protected)
│   ├── profile/page.tsx              # User profile (protected)
│   ├── questions/
│   │   └── [id]/
│   │       ├── page.tsx              # Question detail with answers
│   │       └── edit/page.tsx         # Edit question (protected)
│   └── admin/                        # Admin panel pages
│
├── components/                       # Reusable React components
│   ├── Navbar.tsx                    # Navigation bar
│   ├── Alert.tsx                     # Alert/notification
│   ├── FormInput.tsx                 # Text input field
│   ├── Textarea.tsx                  # Textarea field
│   ├── Pagination.tsx                # Pagination controls
│   ├── VoteButton.tsx                # Vote controls
│   └── CircularLoading.tsx           # Loading spinner
│
├── lib/                              # Utilities and API client
│   ├── api.ts                        # Axios API client configuration
│   ├── auth.ts                       # Authentication helpers
│   └── utils.ts                      # Utility functions
│
├── types/                            # TypeScript type definitions
│   └── index.ts                      # All type definitions
│
├── public/                           # Static assets
├── .env.local                        # Environment variables (create this)
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
└── tailwind.config.mjs               # Tailwind CSS configuration
```

---

## 📚 Key Features Documentation

### 🔐 Authentication
- Tokens stored in localStorage with key `token`
- User data cached in localStorage with key `user`
- Automatic token injection in all API requests
- Redirect to login on 401 errors
- Helper functions available in lib/auth.ts

### 🌐 API Client
- Centralized API configuration in lib/api.ts
- Automatic request/response interceptors
- Comprehensive error handling with user feedback
- All endpoints properly typed with TypeScript
- Base URL configurable via environment variables

### ✅ Form Validation
- Email validation with regex patterns
- Password strength requirements (minimum 6 characters)
- Real-time error display during user input
- Form submission validation
- Validators available in lib/utils.ts

### 📱 Responsive Design
- Mobile-first approach
- Tailwind CSS responsive utilities
- Flexible grid layouts
- Touch-friendly buttons and inputs
- Optimized for all screen sizes (320px and up)

---

## 🔗 API Integration

### Authentication Endpoints
```
POST   /auth/register              # User registration
POST   /auth/login                 # User login
GET    /auth/profile               # Get current user profile
```

### Question Endpoints
```
GET    /questions?page=1&limit=10  # Get paginated questions
GET    /questions/detail?id=<id>   # Get question details
POST   /questions                   # Create new question
PUT    /questions                   # Update question
DELETE /questions?id=<id>          # Delete question
```

### Answer Endpoints
```
GET    /answers?question_id=<id>   # Get answers for a question
POST   /answers                     # Create new answer
PUT    /answers                     # Update answer
DELETE /answers?id=<id>            # Delete answer
POST   /answers/<id>/vote          # Vote on answer
```

---

## 👨‍💻 Development

### Adding New Features

1. **Create Components**: Add reusable components in components/ directory
2. **Create Pages**: Add pages in app/ following Next.js App Router conventions
3. **Add API Calls**: Update lib/api.ts with new endpoints
4. **Add Types**: Define types in types/index.ts
5. **Style**: Use Tailwind CSS classes for styling

### Code Style Guidelines

- ✅ Use TypeScript for type safety
- ✅ Follow existing naming conventions
- ✅ Add comments for complex logic
- ✅ Use React hooks for state management
- ✅ Keep components small and reusable
- ✅ PropTypes or TypeScript interfaces for props

### Testing Guidelines

- [ ] Test all CRUD operations
- [ ] Verify error handling scenarios
- [ ] Test responsive design across devices
- [ ] Check authentication flows
- [ ] Validate form validation logic

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Environment Configuration
Set NEXT_PUBLIC_API_URL environment variable to your production API URL

### Hosting Options

| Platform | Command/Steps |
|----------|---------------|
| **Vercel** (Recommended) | vercel deploy |
| **Netlify** | Connect GitHub repository in dashboard |
| **AWS Amplify** | Deploy from GitHub integration |
| **Self-hosted** | Use npm start with Node.js server |

---

## 📱 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **API connection fails** | Ensure backend is running on http://localhost:8000 |
| **CORS errors** | Configure backend CORS headers to allow frontend origin |
| **Token cleared on refresh** | Verify localStorage is enabled in browser |
| **Page not updating** | Check React useEffect dependencies are correct |
| **Build errors** | Run npm install and verify Node.js version (18+) |
| **Styling not applied** | Clear .next folder and rebuild |

---

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

MIT License - Feel free to use this project as a template or for learning purposes.

---

## 📞 Support

For questions or issues:
1. ✅ Check the documentation files
2. ✅ Review code comments and type definitions
3. ✅ Check browser console for error messages
4. ✅ Verify backend API is responding
5. ✅ Ensure Node.js version is 18+

---

**Made with ❤️ by the Development Team**
