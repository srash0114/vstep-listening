"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { validateEmail, validatePassword } from "@/lib/utils";
import FormInput from "@/components/FormInput";
import Alert from "@/components/Alert";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || "";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
    // Clear error for this field
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
      const response = await usersApi.register(
        formData.username,
        formData.email,
        formData.password
      );

      console.log("Registration response:", response);

      if (response.success && response.data) {
        setAlert({
          type: "success",
          message: "Account created successfully! Redirecting to login...",
        });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setAlert({
          type: "error",
          message: response.message || "Registration failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      
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
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Join thousands of learners improving their English</p>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose your username"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.username
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
            </div>

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
                placeholder="At least 6 characters"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.password
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.confirmPassword
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="w-full block text-center py-3 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
