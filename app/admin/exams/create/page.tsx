"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";

export default function CreateExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "B1",
    total_duration: 35,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_duration" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await testsApi.create(formData);
      if (response.success && response.data) {
        // Redirect to exam detail page
        router.push(`/admin/exams/${response.data.id}`);
      } else {
        setError(response.message || "Failed to create exam");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Exam</h1>
          <p className="text-gray-600">Step 1 of 6: Setup basic exam information</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className={`flex-1 h-2 rounded-full ${step === 1 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            ))}
          </div>
          <p className="text-sm text-gray-600">Step 1: Basic Information</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., VSTEP Listening Test - Practice 1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description for this exam"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Total Duration (minutes) *
              </label>
              <input
                type="number"
                name="total_duration"
                value={formData.total_duration}
                onChange={handleChange}
                min="1"
                max="120"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Standard VSTEP: 35 minutes</p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Link href="/admin" className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {isLoading ? "Creating..." : "Create Exam & Continue"}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📝 What happens next?</h3>
            <p className="text-sm text-blue-800">
              After creating the exam, you'll add 3 parts with their audio files, then add passages (for parts 2 & 3), questions, and answer options.
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Complete Workflow</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>
              <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-full text-center text-xs font-bold mr-2">1</span>
              <strong>Create Exam</strong> (you are here)
            </li>
            <li>
              <span className="inline-block w-6 h-6 bg-gray-400 text-white rounded-full text-center text-xs font-bold mr-2">2</span>
              Add Parts (1, 2, 3)
            </li>
            <li>
              <span className="inline-block w-6 h-6 bg-gray-400 text-white rounded-full text-center text-xs font-bold mr-2">3</span>
              Add Passages (Part 2 & 3)
            </li>
            <li>
              <span className="inline-block w-6 h-6 bg-gray-400 text-white rounded-full text-center text-xs font-bold mr-2">4</span>
              Add Questions
            </li>
            <li>
              <span className="inline-block w-6 h-6 bg-gray-400 text-white rounded-full text-center text-xs font-bold mr-2">5</span>
              Add Options (A, B, C, D)
            </li>
            <li>
              <span className="inline-block w-6 h-6 bg-gray-400 text-white rounded-full text-center text-xs font-bold mr-2">6</span>
              Review & Publish
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
