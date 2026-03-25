"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";
import { validateEmail } from "@/lib/utils";
import FormInput from "@/components/FormInput";
import Alert from "@/components/Alert";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Use proper login endpoint
      const response = await usersApi.login(formData.email, formData.password);

      console.log("Login response:", response);

      if (response.success && response.data) {
        // ⭐ Token is now in HttpOnly cookie (set by backend)
        // Only store user info in localStorage
        setStoredUser(response.data);
        setAlert({
          type: "success",
          message: "Login successful! Redirecting...",
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setAlert({
          type: "error",
          message: response.message || "Login failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please try again.";
      
      // Backend returns: { success: false, error: "code", message: "text" }
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Error from API validation (thrown in api.ts)
        errorMessage = error.message;
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Network error. Could not connect to server. Make sure the backend is running on http://localhost:8000";
      }

      setAlert({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4 pt-32">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎧</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to continue your learning journey</p>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.email
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.password
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="w-full block text-center py-3 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
