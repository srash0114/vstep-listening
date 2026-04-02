import axios, { AxiosInstance, AxiosError } from "axios";
import {
  ApiResponse,
  Test,
  Result,
  TestsListResponse,
  TestDetailResponse,
  ResultsResponse,
  ResultDetailResponse,
  UserResultsHistoryResponse,
  StatisticsResponse,
  User,
} from "@/types";

/**
 * API Configuration
 * Base URL includes /api suffix per backend specification
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Base URL for all API requests
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // ⭐ IMPORTANT: Enable cookies in requests
});

/**
 * Request Interceptor - HttpOnly Cookie Authentication
 * ⭐ Cookies are sent automatically with withCredentials: true
 * NO need to manually add Authorization header
 */
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically included by the browser when withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle Errors & Auth
 * - Handle 401 (Unauthorized) by clearing auth and redirecting to login
 * - Handle 403 (Forbidden) for insufficient permissions
 * - Handle 500 (Server errors) gracefully
 */
api.interceptors.response.use(
  (response) => {
    // Success response
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      // Network error
      const networkError = {
        success: false,
        error: "network_error",
        message: "Cannot connect to the server. Please check your connection.",
        statusCode: 0,
      };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    const errorData = data as any;

    // Handle specific status codes
    switch (status) {
      case 401:
        // Unauthorized - Cookie expired or invalid
        if (typeof window !== "undefined") {
          localStorage.removeItem("user"); // Clear stored user info
          // Only redirect if NOT already on login page (prevent infinite loop)
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        break;

      case 403:
        // Forbidden - User doesn't have permission
        console.warn("Access forbidden:", errorData.message);
        break;

      case 404:
        // Not found
        console.warn("Resource not found:", errorData.message);
        break;

      case 500:
        // Server error
        console.error("Server error:", errorData.message);
        break;
    }

    return Promise.reject(errorData || error);
  }
);


// ==================== Tests API ====================
/**
 * Tests API - Manage listening tests
 * - Fetch available tests
 * - Get test details with questions
 * - Create, update, delete tests (admin)
 */
export const testsApi = {
  /**
   * Get all available tests
   * GET /tests
   */
  getAll: async (): Promise<TestsListResponse> => {
    const response = await api.get<TestsListResponse>("/v1/exams");
    return response.data;
  },

  /**
   * Get specific exam with all details
   * GET /v1/admin/exams/{id}
   */
  AdminGetById: async (id: number | string): Promise<TestDetailResponse> => {
    if (!id || (typeof id === "number" && id <= 0)) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid exam ID",
        statusCode: 400,
      };
    }
    const response = await api.get<TestDetailResponse>(`/v1/admin/exams/${id}`);
    return response.data;
  },

  /**
   * Get specific exam with all details
   * GET /v1/exams/{id}
   */
  getById: async (id: number | string): Promise<TestDetailResponse> => {
    if (!id || (typeof id === "number" && id <= 0)) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid exam ID",
        statusCode: 400,
      };
    }
    const response = await api.get<TestDetailResponse>(`/v1/exams/${id}`);
    return response.data;
  },

  /**
   * Get exam content for taking (no is_correct, script, difficulty)
   * GET /v1/exams/{id}?for_taking=1
   */
  getForTaking: async (id: number | string): Promise<any> => {
    const response = await api.get(`/v1/exams/${id}`, { params: { for_taking: 1 } });
    return response.data;
  },

  /**
    * Get test history for a user (GET /v1/users/exams/history)
    * Returns list of tests taken by the user with scores and dates
    * Requires authentication (cookie-based)
    */
  getUserHistory: async (): Promise<UserResultsHistoryResponse> => {  
    const response = await api.get<UserResultsHistoryResponse>("/v1/users/exams/history");
    return response.data;
  },

  /**
   * Create new exam (Admin only)
   * POST /v1/admin/exams
   */
  create: async (data: {
    title: string;
    description?: string;
    level?: string;
    total_duration?: number;
  }): Promise<ApiResponse<any>> => {
    if (!data.title) {
      throw {
        success: false,
        error: "missing_fields",
        message: "Title is required",
        statusCode: 400,
      };
    }
    const response = await api.post("/v1/admin/exams", data);
    return response.data;
  },

  /**
   * Update test (Admin only)
   * PUT /tests?id=1
   */
  update: async (id: number, title: string, description: string, level: string, duration: number) => {
    if (!id || !title || !description) {
      throw {
        success: false,
        error: "missing_fields",
        message: "Missing required fields",
        statusCode: 400,
      };
    }
    const response = await api.put("/tests", { id, title, description, level, duration }, {
      params: { id },
    });
    return response.data;
  },

  /**
   * Delete test (Admin only)
   * DELETE /tests?id=1
   */
  delete: async (id: number) => {
    if (!id || id <= 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid test ID",
        statusCode: 400,
      };
    }
    const response = await api.delete(`/v1/admin/exams/${id}`);
    return response.data;
  },

  /**
   * Get full exam structure with parts, passages, questions and options
   * GET /v1/exams/{id}
   */
  getFullStructure: async (examId: number | string): Promise<any> => {
    if (!examId || (typeof examId === "number" && examId <= 0)) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid exam ID",
        statusCode: 400,
      };
    }
    const response = await api.get(`/v1/exams/${examId}`);
    return response.data;
  },

  /**
   * Get all parts for an exam
   * GET /v1/exams/{id}  — extract parts array
   */
  getParts: async (examId: number | string): Promise<any> => {
    if (!examId || (typeof examId === "number" && examId <= 0)) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid exam ID",
        statusCode: 400,
      };
    }
    const response = await api.get(`/v1/admin/exams/${examId}`);
    const raw = response.data?.data;
    // data can be the exam object (with .parts) or the array directly
    const parts = raw?.parts || (Array.isArray(raw) ? raw : []);
    return {
      success: response.data?.success !== false,
      data: parts,
    };
  },

  /**
   * Get specific part with questions
   * GET /v1/admin/exams/{examId}/parts/{partId}
   */
  getPartDetail: async (examId: number | string, partId: number | string): Promise<any> => {
    if (!examId || !partId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid exam ID or part ID",
        statusCode: 400,
      };
    }
    const response = await api.get(`/v1/admin/exams/${examId}/parts/${partId}`);
    return response.data;
  },

  /**
   * Create complete test with parts and questions
   * POST /tests/create-complete
   * Handles file uploads with multipart/form-data
   */
  createComplete: async (testData: any, audioFiles: File[]): Promise<any> => {
    if (!testData.title || !testData.parts || testData.parts.length === 0) {
      throw {
        success: false,
        error: "missing_fields",
        message: "Title and parts array are required",
        statusCode: 400,
      };
    }

    const formData = new FormData();
    
    // Append form fields
    formData.append("title", testData.title);
    formData.append("level", testData.level || "B1");
    formData.append("duration", testData.duration?.toString() || "3600");
    formData.append("parts", JSON.stringify(testData.parts));
    
    // Append audio files
    audioFiles.forEach((file, index) => {
      formData.append(`part_${index + 1}_audio`, file);
    });

    // Post FormData directly - axios will auto-detect and set multipart/form-data with boundary
    // Do NOT specify Content-Type - let axios handle it
    const response = await api.post("/tests/create-complete", formData);
    return response.data;
  },

  /**
   * Upload audio for specific part
   * POST /parts/{partId}/upload-audio
   */
  /**
   * Upload audio for specific part
   * POST /parts/{partId}/upload-audio
   */
  uploadPartAudio: async (partId: number, audioFile: File): Promise<any> => {
    if (!partId || !audioFile) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Part ID and audio file are required",
        statusCode: 400,
      };
    }
    const formData = new FormData();
    formData.append("audio", audioFile);

    const response = await api.post(`/v1/admin/parts/${partId}/upload-audio`, formData, {
      transformRequest: [(data: any, headers: any) => {
        // Remove default Content-Type so axios auto-sets multipart/form-data with boundary
        delete headers["Content-Type"];
        return data;
      }],
    });
    return response.data;
  },

  /**
   * Create batch questions for a part
   * POST /tests/create-questions-batch
   */
  createQuestionsBatch: async (testId: number, partId: number, questions: any[]): Promise<any> => {
    if (!testId || !partId || !questions || questions.length === 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Test ID, Part ID, and questions are required",
        statusCode: 400,
      };
    }
    const response = await api.post("/tests/create-questions-batch", {
      testId,
      partId,
      questions,
    });
    return response.data;
  },

  /**
   * Bulk create exam with complete structure
   * POST /admin/exams/bulk-create
   * Accepts JSON with exam, parts, passages, questions, and options
   */
  bulkCreateExam: async (examData: any): Promise<any> => {
    if (!examData || !examData.exam || !examData.exam.title || !examData.exam.parts) {
      throw {
        success: false,
        error: "invalid_structure",
        message: "Invalid exam structure. Required: exam.title, exam.parts[]",
        statusCode: 400,
      };
    }
    const response = await api.post("/admin/exams/bulk-create", examData);
    return response.data;
  },

  /**
   * Bulk create exam with audio file uploads to Firebase
   * POST /admin/exams/bulk-create (multipart/form-data)
   * Accepts exam JSON + audio files
   * Audio files are uploaded to Firebase Storage, URLs auto-injected
   */
  bulkCreateExamWithAudio: async (
    examData: any,
    audioFiles: Record<string, File>
  ): Promise<any> => {
    if (!examData || !examData.exam || !examData.exam.title || !examData.exam.parts) {
      throw {
        success: false,
        error: "invalid_structure",
        message: "Invalid exam structure. Required: exam.title, exam.parts[]",
        statusCode: 400,
      };
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add JSON data
    formData.append("exam_json", JSON.stringify(examData));

    // Add audio files
    Object.entries(audioFiles).forEach(([fieldName, file]) => {
      if (file) {
        formData.append(fieldName, file);
      }
    });

    // Create a temporary axios instance without JSON content-type
    // Let the browser/axios set multipart/form-data with boundary
    const response = await api.post("/admin/exams/bulk-create", formData, {
      headers: {
        // Remove Content-Type - let axios auto-detect multipart/form-data
      },
    });

    return response.data;
  },

  /**
   * Bulk update questions for existing exam
   * POST /admin/exams/{exam_id}/bulk-update-questions
   */
  bulkUpdateQuestions: async (examId: number, questionsData: any): Promise<any> => {
    if (!examId || !questionsData || !questionsData.questions) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID and questions array are required",
        statusCode: 400,
      };
    }
    const response = await api.post(
      `/admin/exams/${examId}/bulk-update-questions`,
      questionsData
    );
    return response.data;
  },

  // ==================== Incremental API Methods ====================
  /**
   * Create a part for an exam
   * POST /v1/admin/exams/{exam_id}/parts
   * Note: Backend expects exam_id, part_number, and title in request body
   */
  createPart: async (
    examId: string,
    data: {
      part_number: number;
      title: string;
      duration: number;
      audio_url: string;
    }
  ): Promise<any> => {
    if (!examId || !data.part_number || !data.title) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID, part number, and title are required",
        statusCode: 400,
      };
    }
    const requestData = {
      exam_id: examId,
      part_number: data.part_number,
      title: data.title,
      duration: data.duration,
      audio_url: data.audio_url,
    };
    const response = await api.post(`/v1/admin/exams/${examId}/parts`, requestData);
    return response.data;
  },

  /**
   * Update a part
   * PUT /v1/admin/exams/{exam_id}/parts/{part_id}
   */
  updatePart: async (
    examId: string,
    partId: string,
    data: {
      title?: string;
      duration?: number;
      audio_url?: string;
    }
  ): Promise<any> => {
    if (!examId || !partId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID and part ID are required",
        statusCode: 400,
      };
    }
    const response = await api.put(`/v1/admin/exams/${examId}/parts/${partId}`, data);
    return response.data;
  },

  /**
   * Create a passage for a part
   * POST /v1/admin/exams/{exam_id}/parts/{part_id}/passages
   * Supports multipart form data with audio upload
   */
  createPassage: async (
    examId: string,
    partId: string,
    data: {
      title: string;
      script: string;
      audio_url?: string;
      audio_file?: File;
      passage_order?: number;
    }
  ): Promise<any> => {
    if (!examId || !partId || !data.title) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID, part ID, and title are required",
        statusCode: 400,
      };
    }

    // If audio file is provided, use multipart form data
    if (data.audio_file) {
      const formData = new FormData();
      formData.append("passage_json", JSON.stringify({
        exam_id: examId,
        part_id: partId,
        title: data.title,
        script: data.script,
        passage_order: data.passage_order || 1,
      }));
      formData.append("audio", data.audio_file);

      const response = await api.post(
        `/v1/admin/exams/${examId}/parts/${partId}/passages`,
        formData
      );
      return response.data;
    }

    // Otherwise, use JSON with audio URL
    const response = await api.post(
      `/v1/admin/exams/${examId}/parts/${partId}/passages`,
      {
        exam_id: examId,
        part_id: partId,
        title: data.title,
        script: data.script,
        audio_url: data.audio_url,
        passage_order: data.passage_order || 1,
      }
    );
    return response.data;
  },

  /**
   * Update a passage
   * PUT /v1/admin/exams/{exam_id}/parts/{part_id}/passages/{passage_id}
   * Supports multipart form data with audio upload
   */
  updatePassage: async (
    examId: string,
    partId: string,
    passageId: string,
    data: {
      title?: string;
      script?: string;
      audio_url?: string;
      audio_file?: File;
    }
  ): Promise<any> => {
    if (!examId || !partId || !passageId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID, part ID, and passage ID are required",
        statusCode: 400,
      };
    }

    // If audio file is provided, use multipart form data
    if (data.audio_file) {
      const formData = new FormData();
      formData.append("passage_json", JSON.stringify({
        title: data.title,
        script: data.script,
      }));
      formData.append("audio", data.audio_file);

      const response = await api.put(
        `/v1/admin/exams/${examId}/parts/${partId}/passages/${passageId}`,
        formData
      );
      return response.data;
    }

    // Otherwise, use JSON
    const response = await api.put(
      `/v1/admin/exams/${examId}/parts/${partId}/passages/${passageId}`,
      {
        title: data.title,
        script: data.script,
        audio_url: data.audio_url,
      }
    );
    return response.data;
  },

  /**
   * Delete a passage
   * DELETE /v1/admin/exams/{exam_id}/parts/{part_id}/passages/{passage_id}
   */
  deletePassage: async (
    examId: string,
    partId: string,
    passageId: string
  ): Promise<any> => {
    if (!examId || !partId || !passageId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID, part ID, and passage ID are required",
        statusCode: 400,
      };
    }
    const response = await api.delete(
      `/v1/admin/exams/${examId}/parts/${partId}/passages/${passageId}`
    );
    return response.data;
  },

  /**
   * Create a question for a part
   * POST /v1/admin/exams/{exam_id}/questions
   * Supports multipart form data with audio upload
   */
  createQuestion: async (
    examId: string,
    partId: string,
    data: {
      part_id: number;
      passage_id?: number;
      content: string;
      difficulty_level?: string;
      script?: string;
      audio_url?: string;
      audio_file?: File;
      order_index?: number;
      question_number?: number;
    }
  ): Promise<any> => {
    if (!examId || !data.part_id || !data.content) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID, part ID, and question content are required",
        statusCode: 400,
      };
    }

    // If audio file is provided, use multipart form data
    if (data.audio_file) {
      const formData = new FormData();
      formData.append("question_json", JSON.stringify({
        exam_id: examId,
        part_id: data.part_id,
        passage_id: data.passage_id,
        content: data.content,
        difficulty_level: data.difficulty_level || "3",
        script: data.script,
        order_index: data.order_index || 1,
        question_number: data.question_number,
      }));
      formData.append("audio", data.audio_file);

      const response = await api.post(
        `/v1/admin/exams/${examId}/questions`,
        formData
      );
      return response.data;
    }

    // Otherwise, use JSON
    const response = await api.post(
      `/v1/admin/exams/${examId}/questions`,
      {
        exam_id: examId,
        part_id: data.part_id,
        passage_id: data.passage_id,
        content: data.content,
        difficulty_level: data.difficulty_level || "3",
        script: data.script,
        audio_url: data.audio_url,
        order_index: data.order_index || 1,
        question_number: data.question_number,
      }
    );
    return response.data;
  },

  /**
   * Update a question
   * PUT /v1/admin/exams/{exam_id}/questions/{question_id}
   */
  updateQuestion: async (
    examId: string,
    questionId: string,
    data: {
      content?: string;
      difficulty_level?: string;
      script?: string;
      audio_url?: string;
      audio_file?: File;
    }
  ): Promise<any> => {
    if (!examId || !questionId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID and question ID are required",
        statusCode: 400,
      };
    }

    // If audio file is provided, use multipart form data
    if (data.audio_file) {
      const formData = new FormData();
      formData.append("question_json", JSON.stringify({
        content: data.content,
        difficulty_level: data.difficulty_level,
        script: data.script,
      }));
      formData.append("audio", data.audio_file);

      const response = await api.put(
        `/v1/admin/exams/${examId}/questions/${questionId}`,
        formData
      );
      return response.data;
    }

    // Otherwise, use JSON
    const response = await api.put(
      `/v1/admin/exams/${examId}/questions/${questionId}`,
      {
        content: data.content,
        difficulty_level: data.difficulty_level,
        script: data.script,
        audio_url: data.audio_url,
      }
    );
    return response.data;
  },

  /**
   * Delete a question (cascade deletes options)
   * DELETE /v1/admin/exams/{exam_id}/questions/{question_id}
   */
  deleteQuestion: async (examId: string, questionId: string): Promise<any> => {
    if (!examId || !questionId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Exam ID and question ID are required",
        statusCode: 400,
      };
    }
    const response = await api.delete(`/v1/admin/exams/${examId}/questions/${questionId}`);
    return response.data;
  },

  /**
   * Create an option for a question
   * POST /v1/admin/exams/{exam_id}/questions/{question_id}/options
   */
  createOption: async (
    examId: string,
    questionId: string,
    data: {
      content: string;
      option_label: string;
      is_correct: boolean;
    }
  ): Promise<any> => {
    if (!examId || !questionId || !data.content || !data.option_label === undefined || data.is_correct === undefined) {
      throw {
        success: false,
        error: "invalid_request",
        message: "All fields are required",
        statusCode: 400,
      };
    }
    const requestData = {
      exam_id: examId,
      question_id: questionId,
      content: data.content,
      option_label: data.option_label,
      is_correct: data.is_correct,
    };
    const response = await api.post(
      `/v1/admin/exams/${examId}/questions/${questionId}/options`,
      requestData
    );
    return response.data;
  },

  /**
   * Update an option
   * PUT /v1/admin/exams/{exam_id}/questions/{question_id}/options/{option_id}
   */
  updateOption: async (
    examId: string,
    questionId: string,
    optionId: string,
    data: {
      content?: string;
      option_label?: string;
      is_correct?: boolean;
    }
  ): Promise<any> => {
    if (!examId || !questionId || !optionId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "All IDs are required",
        statusCode: 400,
      };
    }
    const response = await api.put(
      `/v1/admin/exams/${examId}/questions/${questionId}/options/${optionId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an option
   * DELETE /v1/admin/exams/{exam_id}/questions/{question_id}/options/{option_id}
   */
  deleteOption: async (
    examId: string,
    questionId: string,
    optionId: string
  ): Promise<any> => {
    if (!examId || !questionId || !optionId) {
      throw {
        success: false,
        error: "invalid_request",
        message: "All IDs are required",
        statusCode: 400,
      };
    }
    const response = await api.delete(
      `/v1/admin/exams/${examId}/questions/${questionId}/options/${optionId}`
    );
    return response.data;
  },
};

// ==================== Results API ====================
/**
 * Results API - Manage test submissions and scores
 * - Submit test answers and get score
 * - Get individual results
 * - Get statistics
 */
export const resultsApi = {
  /**
   * Submit test answers and get score
   * POST /results
   */
  submit: async (
    testId: number,
    answers: Record<string, number>,
    timeSpent: number,
    userId?: number | null
  ): Promise<ResultsResponse> => {
    if (!testId || !answers || Object.keys(answers).length === 0 || timeSpent < 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid test submission data",
        statusCode: 400,
      };
    }
    const response = await api.post<ResultsResponse>("/results", {
      testId,
      userId: userId || null,
      answers,
      timeSpent,
    });
    return response.data;
  },

  /**
   * Get a specific result
   * GET /results/detail?id=1
   */
  getById: async (id: number): Promise<ResultDetailResponse> => {
    if (!id || id <= 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid result ID",
        statusCode: 400,
      };
    }
    const response = await api.get<ResultDetailResponse>("/results/detail", {
      params: { id },
    });
    return response.data;
  },

  /**
   * Get results list with pagination
   * GET /results?page=1&limit=10
   */
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get("/results", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get statistics for a test
   * GET /results/stats?testId=1
   */
  getStats: async (testId?: number): Promise<StatisticsResponse> => {
    const response = await api.get<StatisticsResponse>("/results/stats", {
      params: testId ? { testId } : undefined,
    });
    return response.data;
  },
};

// ==================== User Exams API ====================
export const userExamsApi = {
  /** POST /v1/exams/{examId}/start → returns { data: { id, user_id, exam_id, ... } } */
  start: async (examId: number | string): Promise<any> => {
    const response = await api.post(`/v1/exams/${examId}/start`);
    return response.data;
  },

  /** POST /v1/user-exams/{userExamId}/answer */
  saveAnswer: async (userExamId: number, questionId: number, selectedOptionId: number): Promise<any> => {
    const response = await api.post(`/v1/user-exams/${userExamId}/answer`, {
      question_id: questionId,
      selected_option_id: selectedOptionId,
    });
    return response.data;
  },

  /** POST /v1/user-exams/{userExamId}/submit */
  submit: async (userExamId: number, timeSpent: number): Promise<any> => {
    const response = await api.post(`/v1/user-exams/${userExamId}/submit`, { time_spent: timeSpent });
    return response.data;
  },

  /** GET /v1/user-exams/{userExamId}/result */
  getResult: async (userExamId: number): Promise<any> => {
    const response = await api.get(`/v1/user-exams/${userExamId}/result`);
    return response.data;
  },

  /** POST /v1/user-exams/{userExamId}/pause */
  pause: async (
    userExamId: number,
    data: { time_spent: number; answers: { question_id: number; selected_option_id: number | null }[] }
  ): Promise<any> => {
    const response = await api.post(`/v1/user-exams/${userExamId}/pause`, data);
    return response.data;
  },

  /** DELETE /v1/user-exams/{userExamId} */
  delete: async (userExamId: number): Promise<any> => {
    const response = await api.delete(`/v1/user-exams/${userExamId}`);
    return response.data;
  },
};

// ==================== Users API ====================
/**
 * Users API - User management and authentication
 * - Register new users
 * - Login users
 * - Get user profile
 * - Get user test history
 *
 * Authentication Flow:
 * 1. Register or Login returns token
 * 2. Token is stored in localStorage
 * 3. Token is automatically added to all requests via interceptor
 * 4. Backend validates token on protected endpoints
 * 5. Invalid/expired tokens trigger 401 error, clearing auth
 */
export const usersApi = {
  /**
   * Register new user
   * POST /users/register
   */
  register: async (
    username: string,
    email: string,
    full_name: string,
    password: string
  ): Promise<ApiResponse<User>> => {
    // Validation
    if (!username || username.trim().length < 3) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Username must be at least 3 characters",
        statusCode: 400,
      };
    }
    if (!full_name || full_name.trim().length < 2) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Full name is required",
        statusCode: 400,
      };
    }
    if (!email || !email.includes("@")) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid email address",
        statusCode: 400,
      };
    }
    if (!password || password.length < 6) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Password must be at least 6 characters",
        statusCode: 400,
      };
    }

    const response = await api.post<ApiResponse<User>>("/users/register", {
      username,
      email,
      full_name,
      password,
    });
    return response.data;
  },

  /**
   * Login user
   * POST /users/login
   */
  login: async (identifier: string, password: string, mode: "email" | "username" = "email"): Promise<ApiResponse<User>> => {
    if (!identifier) {
      throw { success: false, error: "invalid_request", message: "Vui lòng nhập email hoặc tên đăng nhập", statusCode: 400 };
    }
    if (!password) {
      throw { success: false, error: "invalid_request", message: "Password is required", statusCode: 400 };
    }

    const payload = mode === "email"
      ? { email: identifier, password }
      : { username: identifier, password };

    const response = await api.post<ApiResponse<User>>("/users/login", payload);
    return response.data;
  },

  /**
   * Get user profile
   * GET /users?id=1
   */
  getById: async (userId: number): Promise<ApiResponse<User>> => {
    if (!userId || userId <= 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid user ID",
        statusCode: 400,
      };
    }
    const response = await api.get<ApiResponse<User>>("/users", {
      params: { id: userId },
    });
    return response.data;
  },

  /**
   * Get user's test history and results
   * GET /users/results?userId=1
   */
  getResults: async (userId: number): Promise<UserResultsHistoryResponse> => {
    if (!userId || userId <= 0) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Invalid user ID",
        statusCode: 400,
      };
    }
    const response = await api.get<UserResultsHistoryResponse>("/users/results", {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Check login status - Verify HttpOnly cookie is valid
   * GET /users/check-status
   * 
   * ⭐ IMPORTANT: HttpOnly cookie is automatically sent with credentials: 'include'
   * by axios config (withCredentials: true).
   * 
   * NO manual Authorization header needed!
   * 
   * Returns current user info if cookie is valid
   * Returns 401 error if cookie is invalid/expired
   */
  checkStatus: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>("/users/check-status");
    return response.data;
  },

  /**
   * Logout user - Clear HttpOnly cookie
   * POST /users/logout
   * 
   * ⭐ Backend will clear the auth_token HttpOnly cookie
   * Browser automatically handles cookie deletion
   */
  logout: async (): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>("/users/logout", {});
    return response.data;
  },

  /**
   * Update user profile
   * PUT /users/profile
   * 
   * ⭐ HttpOnly cookie is automatically sent with credentials
   * Updates username and/or full_name (both optional)
   * 
   * @param updates - Object containing optional username and/or full_name
   * @returns Updated user data
   */
  updateProfile: async (updates: {
    username?: string;
    full_name?: string;
  }): Promise<ApiResponse<User>> => {
    // Validation
    if (updates.username !== undefined && updates.username.trim().length < 3) {
      throw {
        success: false,
        error: "invalid_request",
        message: "Username must be at least 3 characters",
        statusCode: 400,
      };
    }

    const response = await api.put<ApiResponse<User>>("/users/profile", updates);
    return response.data;
  },

  /**
   * Update or set password
   * PUT /users/password
   * - has_password=true: { current_password, new_password }
   * - has_password=false (Google user): { new_password }
   */
  updatePassword: async (payload: {
    current_password?: string;
    new_password: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>("/users/password", payload);
    return response.data;
  },

  /**
   * Unlink Google account (only when has_password = true)
   * POST /users/unlink-google
   */
  unlinkGoogle: async (): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>("/users/unlink-google", {});
    return response.data;
  },
};

// ==================== Statistics API ====================
/**
 * Statistics API - Get aggregate data
 * - Overall test statistics
 * - Performance analytics
 * - Question difficulty metrics
 */
export const statsApi = {
  /**
   * Get overall statistics
   * GET /stats?testId=1 (optional filter by test)
   */
  get: async (testId?: number): Promise<StatisticsResponse> => {
    const response = await api.get<StatisticsResponse>("/stats", {
      params: testId ? { testId } : undefined,
    });
    return response.data;
  },
};

export default api;
