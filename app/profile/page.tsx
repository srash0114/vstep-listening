"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import Alert from "@/components/Alert";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // ⭐ Verify token with backend
        const statusResponse = await usersApi.checkStatus();
        
        if (statusResponse.success && statusResponse.data) {
          // ✅ Token is valid, set user
          setUser({
            ...statusResponse.data,
            isLoggedIn: true,
          });
        } else {
          // Invalid response
          clearAuth();
          router.push("/login");
        }
      } catch (error: any) {
        // ❌ Token verify failed
        console.error("Profile auth verification failed:", error);
        clearAuth();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>

        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xl font-bold -mt-16 border-4 border-white">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.createdAt && (
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Edit Profile
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-gray-600">Questions</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-gray-600">Answers</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-gray-600">Total Votes</p>
            </div>
          </div>

          {/* My Questions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Questions</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">You haven't asked any questions yet.</p>
              <Link
                href="/ask"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Ask a Question
              </Link>
            </div>
          </div>

          {/* My Answers */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Answers</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">You haven't answered any questions yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
