// Centralized translations management
type Lang = "vi" | "en";

interface Translation {
  vi: string;
  en: string;
}

const translations = {
  // Navigation & Auth
  signIn: { vi: "Đăng nhập", en: "Sign in" },
  getStarted: { vi: "Bắt đầu", en: "Get started" },
  signedInAs: { vi: "Đang đăng nhập", en: "Signed in as" },
  language: { vi: "Ngôn ngữ:", en: "Language:" },
  logout: { vi: "Đăng xuất", en: "Sign out" },

  tests: { vi: "đề thi", en: "exams" },
  myResults: { vi: "Kết quả của tôi", en: "My Results" },
  adminPanel: { vi: "Bảng quản trị", en: "Admin Panel" },

  // Ask Question Page
  askQuestion: { vi: "Đặt câu hỏi", en: "Ask Question" },
  askQuestionUnavailable: {
    vi: "Tính năng này không khả dụng trong ứng dụng luyện thi nghe tiếng Anh VSTEP.",
    en: "This feature is not available in the VSTEP English listening exam app.",
  },
  backHome: { vi: "Về trang chủ", en: "Back Home" },

  // Questions Pages
  questionNotFound: { vi: "Không tìm thấy", en: "Not Found" },
  questionDetail: {
    vi: "Trang chi tiết câu hỏi không khả dụng trong ứng dụng này.",
    en: "Question detail page is not available in this app.",
  },
  editQuestion: { vi: "Chỉnh sửa câu hỏi", en: "Edit Question" },
  editQuestionUnavailable: {
    vi: "Tính năng này không khả dụng trong ứng dụng luyện thi VSTEP.",
    en: "This feature is not available in the VSTEP exam app.",
  },

  // Test Page
  noPermission: { vi: "Không có quyền truy cập", en: "No Permission" },
  loginRequired: {
    vi: "Bạn cần đăng nhập để vào trang quản trị",
    en: "You need to sign in to access the admin panel",
  },

  // Admin Panel
  adminDashboard: { vi: "Bảng quản trị", en: "Admin Dashboard" },
  deleteConfirm: {
    vi: 'Xóa "{title}"? Tất cả phần, câu hỏi và đáp án sẽ bị xóa.',
    en: 'Delete "{title}"? All parts, questions and answers will be deleted.',
  },
  loading: { vi: "Đang tải...", en: "Loading..." },
  loadingExams: { vi: "Đang tải đề thi...", en: "Loading exams..." },
  
  // Admin Dashboard Strings
  noExamsYet: { vi: "Chưa có đề thi nào", en: "No exams yet" },
  createFirstExam: { 
    vi: "Tạo đề thi đầu tiên của bạn để bắt đầu", 
    en: "Create your first exam to get started" 
  },
  totalExams: { vi: "Tổng đề thi", en: "Total Exams" },
  deleteExamError: { vi: "Không thể xóa đề thi", en: "Cannot delete exam" },
  aiImport: { vi: "✨ AI Import", en: "✨ AI Import" },
  createNewExam: { vi: "+ Tạo đề mới", en: "+ Create New Exam" },
  allExams: { vi: "Tất cả đề thi", en: "All Exams" },
  manage: { vi: "Quản lý", en: "Manage" },
  deleting: { vi: "Đang xóa...", en: "Deleting..." },
  adminDescription: { vi: "Quản lý đề thi VSTEP Listening", en: "Manage VSTEP Listening exams" },
  questions: { vi: "câu", en: "questions" },
  minutes: { vi: "phút", en: "minutes" },

  // Workflow Steps
  step1: { vi: "Tạo đề thi – tiêu đề, trình độ, thời gian", en: "Create exam – title, level, duration" },
  step2: { vi: "Thêm 3 Part – kèm audio URL", en: "Add 3 Parts – with audio URL" },
  step3: { vi: "Thêm Passage – Part 2 & 3 (3 đoạn mỗi part)", en: "Add Passages – Part 2 & 3 (3 passages each)" },
  step4: { vi: "Thêm câu hỏi – 8 / 12 / 15 câu mỗi part", en: "Add Questions – 8 / 12 / 15 per part" },
  step5: { vi: "Thêm đáp án – A, B, C, D mỗi câu", en: "Add Options – A, B, C, D each question" },
  workflowTitle: { vi: "Quy trình tạo đề", en: "Exam Creation Workflow" },

  // VSTEP Structure
  vstepStructure: { vi: "Cấu trúc VSTEP", en: "VSTEP Structure" },
  part1Label: { vi: "Part 1: Thông báo ngắn", en: "Part 1: Short Announcements" },
  part1Sub: { vi: "8 câu · 1 audio · Không có passage", en: "8 questions · 1 audio · No passages" },
  part2Label: { vi: "Part 2: Hội thoại", en: "Part 2: Conversations" },
  part2Sub: { vi: "12 câu · 3 passage × 4 câu", en: "12 questions · 3 passages × 4 q" },
  part3Label: { vi: "Part 3: Bài giảng", en: "Part 3: Lectures" },
  part3Sub: { vi: "15 câu · 3 passage × 5 câu", en: "15 questions · 3 passages × 5 q" },
  vstepTotal: { vi: "Tổng: 35 câu · 140 đáp án · 7 file audio", en: "Total: 35 q · 140 options · 7 audio files" },

  // Forms & Validations
  invalidEmail: { vi: "Email không hợp lệ", en: "Invalid email" },
  passwordRequired: { vi: "Vui lòng nhập mật khẩu", en: "Please enter your password" },
  usernameRequired: { vi: "Tên đăng nhập là bắt buộc", en: "Username is required" },
  passwordMismatch: { vi: "Mật khẩu không khớp", en: "Passwords do not match" },

  // Messages
  loginSuccess: { vi: "Đăng nhập thành công! Đang chuyển hướng...", en: "Sign in successful! Redirecting..." },
  loginFailed: { vi: "Đăng nhập thất bại.", en: "Sign in failed." },
  registerSuccess: {
    vi: "Tài khoản đã được tạo! Đang chuyển đến trang đăng nhập...",
    en: "Account created! Redirecting to login...",
  },
  registerFailed: { vi: "Đăng ký thất bại.", en: "Registration failed." },
  loadExamsFailed: {
    vi: "Không tải được danh sách đề thi",
    en: "Failed to load exams",
  },
  examNotFound: { vi: "Không tìm thấy đề thi", en: "Exam not found" },
  cannotLoadExam: { vi: "Không thể tải đề thi", en: "Cannot load exam" },
  cannotDeleteExam: { vi: "Không thể xóa đề thi", en: "Cannot delete exam" },
  errorOccurred: { vi: "Đã xảy ra lỗi", en: "An error occurred" },
  cannotCreateExam: { vi: "Không thể tạo đề thi", en: "Cannot create exam" },

  // Exam Related
  examLevel: { vi: "Cấp độ", en: "Level" },
  duration: { vi: "Thời lượng", en: "Duration" },
  totalQuestions: { vi: "Tổng câu hỏi", en: "Total Questions" },

  // Parts
  part1: { vi: "Part 1", en: "Part 1" },
  part2: { vi: "Part 2", en: "Part 2" },
  part3: { vi: "Part 3", en: "Part 3" },
  part1Announcements: {
    vi: "Part 1: Thông báo & Tin nhắn ngắn",
    en: "Part 1: Announcements & Short Messages",
  },
  part2Conversations: {
    vi: "Part 2: Hội thoại dài",
    en: "Part 2: Long Conversations",
  },
  part3Lectures: {
    vi: "Part 3: Bài giảng & Diễn thuyết",
    en: "Part 3: Lectures & Talks",
  },

  // Common Actions
  save: { vi: "Lưu", en: "Save" },
  delete: { vi: "Xóa", en: "Delete" },
  edit: { vi: "Chỉnh sửa", en: "Edit" },
  cancel: { vi: "Hủy", en: "Cancel" },
  submit: { vi: "Gửi", en: "Submit" },
  back: { vi: "Quay lại", en: "Back" },
  next: { vi: "Tiếp theo", en: "Next" },
  previous: { vi: "Trước đó", en: "Previous" },
  createExam: { vi: "Tạo đề thi", en: "Create Exam" },

  // Test/Exam Submission
  confirmSubmission: { vi: "Xác nhận nộp bài", en: "Confirm Submission" },
  answered: { vi: "Đã trả lời", en: "Answered" },
  unansweredQuestions: { vi: "câu chưa trả lời", en: "unanswered questions" },
  doYouWantToSubmit: { vi: "Bạn vẫn muốn nộp bài?", en: "Do you still want to submit?" },
  continueDoingTest: { vi: "Tiếp tục làm bài", en: "Continue" },
  submitNow: { vi: "Nộp bài ngay", en: "Submit Now" },
  skipped: { vi: "Bỏ qua", en: "Skipped" },
  youHave: { vi: "Còn", en: "You have" },
} as const;

/**
 * Get translation string based on current language
 * @param key - Translation key
 * @param lang - Current language ('vi' or 'en')
 * @returns Translated string
 */
export function getTranslation(
  key: keyof typeof translations,
  lang: Lang
): string {
  return translations[key]?.[lang] || translations[key]?.vi || key;
}

/**
 * Get all translations for a given language
 * @param lang - Language to get translations for
 * @returns Object with all translations for the language
 */
export function getTranslationsByLang(lang: Lang) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(translations)) {
    result[key] = value[lang] || value.vi;
  }
  return result;
}

/**
 * Type-safe translation keys
 */
export type TranslationKey = keyof typeof translations;

export default translations;
