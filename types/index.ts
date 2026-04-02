// ==================== Test Types ====================
export interface TestOption {
  index: number;
  text: string;
}

export interface TestQuestion {
  id: number;
  testId: number;
  questionNumber: number;
  question: string;
  options: TestOption[];
  script: string;
  audioUrl: string;
  correctAnswerIndex?: number; // Optional - only after submission
}

export interface Test {
  id: number;
  title: string;
  description: string;
  totalQuestions?: number;
  total_questions?: number;
  duration?: number; // in seconds
  total_duration?: number;
  level: string; // e.g., "B1-B2"
  createdAt?: string;
  questions?: TestQuestion[];
}

// ==================== Part Types (Incremental API) ====================
export interface Option {
  id?: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id?: string;
  text: string;
  passage_id?: string;
  audio_url?: string;
  explanation?: string;
  options?: Option[];
}

export interface Passage {
  id?: string;
  title: string;
  content: string;
}

export interface Part {
  id: string;
  part_number: number;
  title: string;
  description?: string;
  audio_url?: string;
  passages?: Passage[];
  questions?: Question[];
}

// ==================== Result Types ====================
export interface DetailedResult {
  questionId: number;
  question: string;
  userAnswer: number;
  userAnswerText: string;
  correctAnswer: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

export interface Result {
  resultId: number;
  testId: number;
  userId?: number | null;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  timeSpent: number; // in seconds
  detailedResults: DetailedResult[];
  performanceLevel: "excellent" | "good" | "needsWork";
  submittedAt: string;
  answers?: Record<string, number>; // Question ID -> Answer Index
}

// ==================== User Types ====================
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  token?: string;
  has_password?: boolean;
  has_google?: boolean;
  avatar_url: string;
}

export interface UserResultsHistory {
  userId: number;
  username: string;
  totalTests: number;
  averageScore: number;
  bestScore: number;
  results: Array<{
    resultId: number;
    testId: number;
    score: number;
    percentage: number;
    submittedAt: string;
  }>;
}

// ==================== Statistics Types ====================
export interface QuestionDifficulty {
  questionId: number;
  question: string;
  correctCount: number;
  incorrectCount: number;
  difficulty: number; // 0-1 (percentage who got it right)
}

export interface PerformanceBreakdown {
  excellent: number; // 80-100%
  good: number; // 60-79%
  needsWork: number; // 0-59%
}

export interface Statistics {
  totalTests: number;
  totalResults: number;
  totalUsers: number;
  averageScore: number;
  questionDifficulty: QuestionDifficulty[];
  performanceBreakdown: PerformanceBreakdown;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  statusCode?: number;
  error?: string;
}

export interface TestsListResponse extends ApiResponse<Test[]> {}
export interface TestDetailResponse extends ApiResponse<Test> {}
export interface ResultsResponse extends ApiResponse<Result> {}
export interface ResultDetailResponse extends ApiResponse<Result> {}
export interface UserResultsHistoryResponse extends ApiResponse<UserResultsHistory> {}
export interface StatisticsResponse extends ApiResponse<Statistics> {}
