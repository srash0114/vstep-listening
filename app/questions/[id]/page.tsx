"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStoredUser, isLoggedIn } from "@/lib/auth";
import Alert from "@/components/Alert";
import Textarea from "@/components/Textarea";
import { formatDate } from "@/lib/utils";

export default function QuestionDetail() {
  const params = useParams();
  const questionId = parseInt(params.id as string);

  const [question, setQuestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostVoted">("newest");

  const user = getStoredUser();
  const isAuthed = isLoggedIn();

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      // Placeholder - not implemented for listening test API
      setError("Question detail page is not available for the English Listening Test application");
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Placeholder - not implemented for listening test API
    setAlert({
      type: "error",
      message: "This feature is not available for the English Listening Test application",
    });
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm("Are you sure you want to delete this answer?")) {
      return;
    }

    // Placeholder - not implemented for listening test API
    setAlert({
      type: "error",
      message: "This feature is not available for the English Listening Test application",
    });
  };

  const getSortedAnswers = () => {
    if (!question?.answers) return [];

    const answers = [...question.answers];
    switch (sortBy) {
      case "oldest":
        return answers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "mostVoted":
        return answers.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      case "newest":
      default:
        return answers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading question...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" message={error || "Question not found"} />
        <Link href="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Back to Questions
        </Link>
      </div>
    );
  }

  const sortedAnswers = getSortedAnswers();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Question Section */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
          {user && question.author_id === user.id && (
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm">
                Edit
              </button>
              <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm">
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          <span>
            Asked by{" "}
            <Link href={`/profile/${question.author?.id}`} className="font-semibold text-blue-600 hover:text-blue-700">
              {question.author?.username}
            </Link>
          </span>
          <span>{formatDate(question.created_at)}</span>
          {question.updated_at && <span>Edited {formatDate(question.updated_at)}</span>}
          <span>{question.views} views</span>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="text-gray-800 whitespace-pre-wrap">{question.description}</p>
        </div>

        {question.tags && question.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {question.tags.map((tag: any) => (
              <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answers Section */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {sortedAnswers.length} Answer{sortedAnswers.length !== 1 ? "s" : ""}
          </h2>
          {sortedAnswers.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="mostVoted">Most Voted</option>
            </select>
          )}
        </div>

        {sortedAnswers.length === 0 ? (
          <p className="text-gray-600">No answers yet. Be the first to answer!</p>
        ) : (
          <div className="space-y-6">
            {sortedAnswers.map((answer) => (
              <div key={answer.id} className="border-l-4 border-gray-300 pl-6 py-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link
                      href={`/profile/${answer.author?.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {answer.author?.username}
                    </Link>
                    <p className="text-sm text-gray-500">{formatDate(answer.created_at)}</p>
                  </div>
                  {user && answer.author_id === user.id && (
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                      <button
                        onClick={() => handleDeleteAnswer(answer.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 whitespace-pre-wrap mb-4">{answer.content}</p>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
                    ↑ {answer.votes || 0}
                  </button>
                  <button className="text-gray-600 hover:text-red-600 transition">
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Answer Section */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h3>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {!isAuthed ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">You must be logged in to post an answer.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Login to Answer
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePostAnswer}>
            <Textarea
              label="Your Answer"
              name="answer"
              value={answerText}
              onChange={(e) => {
                setAnswerText(e.target.value);
                setAnswerError(null);
              }}
              placeholder="Write your answer here..."
              required
              error={answerError || undefined}
              rows={6}
            />
            <button
              type="submit"
              disabled={submittingAnswer}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submittingAnswer ? "Posting..." : "Post Answer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
