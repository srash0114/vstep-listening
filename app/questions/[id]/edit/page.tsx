"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getStoredUser, isLoggedIn } from "@/lib/auth";
import FormInput from "@/components/FormInput";
import Textarea from "@/components/Textarea";
import Alert from "@/components/Alert";

export default function EditQuestion() {
  const router = useRouter();
  const params = useParams();
  const questionId = parseInt(params.id as string);

  const [question, setQuestion] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const user = getStoredUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    fetchQuestion();
  }, [questionId, router]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // For now, we'll show a message
      setAlert({
        type: "error",
        message: "Edit functionality requires API endpoint implementation",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      // Placeholder - not implemented for listening test API
      setAlert({
        type: "error",
        message: "This feature is not available for the English Listening Test application",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return;
    }

    // Placeholder - not implemented for listening test API
    setAlert({
      type: "error",
      message: "This feature is not available for the English Listening Test application",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <Link href={`/questions/${questionId}`} className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
        ← Back to Question
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Edit Question
      </h1>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Question Title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="What's your question?"
          required
          error={errors.title}
        />

        <FormInput
          label="Category"
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Web Development, Database, etc."
          error={errors.category}
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Provide detailed information about your question..."
          required
          error={errors.description}
          rows={8}
        />

        <FormInput
          label="Tags"
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Separate tags with commas"
          error={errors.tags}
        />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete Question
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
