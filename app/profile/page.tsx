"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usersApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { useAuth } from "@/lib/auth-context";
import Toast, { ToastType } from "@/components/Toast";
import Avatar from "@/components/Avatar";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const { user, setUser } = useAuth();

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "google_already_linked") {
      setToast({ type: "error", message: t("Tài khoản Google này đã được liên kết với một tài khoản khác.", "This Google account is already linked to another account.") });
      router.replace("/profile");
    }
  }, [searchParams]);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Google linking states
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkConfirmInput, setUnlinkConfirmInput] = useState("");
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const handleEditClick = () => {
    setEditUsername(user?.username || "");
    setEditFullName(user?.full_name || "");
    setUpdateError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdateError(null);
  };

  const handleSaveProfile = async () => {
    setUpdateError(null);
    setIsUpdating(true);
    try {
      const updates: any = {};
      if (editUsername && editUsername !== user?.username) {
        updates.username = editUsername;
      }
      if (editFullName && editFullName !== user?.full_name) {
        updates.full_name = editFullName;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await usersApi.updateProfile(updates);
      if (response.success && response.data) {
        setUser({
          ...response.data,
          isLoggedIn: true,
          isAdmin: response.data.role === "admin",
        });
        setIsEditing(false);
      } else {
        setUpdateError(t("Cập nhật thất bại", "Update failed"));
      }
    } catch (error: any) {
      console.error("Update error:", error);
      setUpdateError(error?.message || t("Có lỗi xảy ra", "An error occurred"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError(null);
  };

  const handleSavePassword = async () => {
    setPasswordError(null);

    if (passwordForm.new_password.length < 6) {
      setPasswordError(t("Mật khẩu mới phải ít nhất 6 ký tự", "New password must be at least 6 characters"));
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t("Mật khẩu không khớp", "Passwords do not match"));
      return;
    }

    if (user?.has_password && !passwordForm.current_password) {
      setPasswordError(t("Vui lòng nhập mật khẩu hiện tại", "Current password is required"));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const payload: any = {
        new_password: passwordForm.new_password,
      };
      if (user?.has_password && passwordForm.current_password) {
        payload.current_password = passwordForm.current_password;
      }

      const response = await usersApi.updatePassword(payload);
      if (response.success) {
        setUser({ ...user!, has_password: true });
        setIsChangingPassword(false);
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
        setShowPasswordFields(false);
        setToast({ type: "success", message: t("Đổi mật khẩu thành công!", "Password updated successfully!") });
      } else {
        setPasswordError(response.message || t("Đổi mật khẩu thất bại", "Password change failed"));
      }
    } catch (error: any) {
      setPasswordError(error?.message || t("Có lỗi xảy ra", "An error occurred"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      window.location.href = `/api/backend/auth/google?action=link`;
    } catch (error) {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    const expectedInput = `Delete_${user?.email}`;
    if (unlinkConfirmInput !== expectedInput) {
      setUnlinkError(t("Xác nhận không chính xác", "Confirmation does not match"));
      return;
    }
    setIsUnlinkingGoogle(true);
    try {
      const response = await usersApi.unlinkGoogle();
      if (response.success) {
        setUser({ ...user!, has_google: undefined });
        setShowUnlinkConfirm(false);
        setUnlinkConfirmInput("");
        setUnlinkError(null);
        setToast({ type: "success", message: t("Đã gỡ kết nối Google thành công!", "Google account unlinked successfully!") });
      } else {
        setUnlinkError(response.message || t("Gỡ kết nối thất bại", "Unlink failed"));
      }
    } catch (error: any) {
      console.error("Unlink Google error:", error);
      setUnlinkError(error?.message || t("Có lỗi xảy ra", "An error occurred"));
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  if (!user) {
    return null;
  }

  const initials = user.username?.slice(0, 2).toUpperCase() ?? "?";
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(t("vi-VN", "en-US"), { year: "numeric", month: "long" })
    : null;

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%), var(--bg-base)",
      }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Profile header card */}
        <div
          className="rounded-3xl overflow-hidden mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Banner */}
          <div
            className="h-36 relative z-10"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.3) 50%, rgba(16,185,129,0.2) 100%)",
            }}
          >
            {/* Mesh pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 mb-6">
              <div className="flex items-end gap-4 z-20">
                {/* Avatar */}
                <Avatar
                  src={user.avatar_url}
                  initials={initials}
                  className="shadow-xl"
                  style={{ border: "3px solid var(--bg-surface)" }}
                />
                <div className="mb-1">
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {user.full_name}
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:mb-1">
                {joinDate && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("Tham gia", "Joined")} {joinDate}
                  </span>
                )}
                <span
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("Hoạt động", "Active")}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6" style={{ height: "1.5px", background: "var(--border-default)" }} />

            {/* Account info section */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("Thông tin tài khoản", "Account Info")}
              </h2>
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {t("Chỉnh sửa", "Edit")}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* Full name input */}
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("Tên đầy đủ", "Full Name")}
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder={t("Nguyễn Văn A", "John Doe")}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#a78bfa";
                      e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Username input */}
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("Tên đăng nhập", "Username")}
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#a78bfa";
                      e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {t("Tối thiểu 3 ký tự", "Minimum 3 characters")}
                  </p>
                </div>

                {/* Error message */}
                {updateError && (
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {updateError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                  >
                    {isUpdating ? t("Đang lưu...", "Saving...") : t("Lưu", "Save")}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-80"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                  >
                    {t("Hủy", "Cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    label: t("Tên đầy đủ", "Full Name"), value: user?.full_name,
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
                  },
                  {
                    label: t("Tên đăng nhập", "Username"), value: user?.username,
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  },
                  {
                    label: "Email", value: user?.email,
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#a78bfa" }}>{icon}</svg>
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                    </div>
                    <span className="text-sm font-semibold max-w-[200px] truncate" style={{ color: "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Password & Security section (for all users) */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("Bảo mật", "Security")}
              </h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {user?.has_password ? t("Đổi mật khẩu", "Change Password") : t("Đặt mật khẩu", "Set Password")}
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="space-y-4">
                {/* Current password (only if user already has password) */}
                {user?.has_password && (
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                      {t("Mật khẩu hiện tại", "Current Password")}
                    </label>
                    <input
                      type={showPasswordFields ? "text" : "password"}
                      name="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#a78bfa";
                        e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--border-default)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                )}

                {/* New password */}
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {user?.has_password ? t("Mật khẩu mới", "New Password") : t("Mật khẩu", "Password")}
                  </label>
                  <input
                    type={showPasswordFields ? "text" : "password"}
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    placeholder={t("Ít nhất 6 ký tự", "At least 6 characters")}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#a78bfa";
                      e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("Xác nhận mật khẩu", "Confirm Password")}
                  </label>
                  <input
                    type={showPasswordFields ? "text" : "password"}
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#a78bfa";
                      e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Show password toggle */}
                <div className="flex items-center gap-2 select-none"
                  onClick={() => setShowPasswordFields((prev) => !prev)}
                >
                  <div
                    className="relative w-4 h-4 rounded border transition-all cursor-pointer"
                    style={{
                      backgroundColor: showPasswordFields ? "#7c3aed" : "var(--bg-elevated)",
                      borderColor: showPasswordFields ? "#7c3aed" : "var(--border-default)",
                    }}
                  >
                    {showPasswordFields && (
                      <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                        <path d="M4.89163 13.2687L9.16582 17.5427L18.7085 8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <label className="text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
                    {t("Hiện mật khẩu", "Show passwords")}
                  </label>
                </div>

                {/* Error message */}
                {passwordError && (
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {passwordError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSavePassword}
                    disabled={isUpdatingPassword}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                  >
                    {isUpdatingPassword ? t("Đang lưu...", "Saving...") : t("Lưu", "Save")}
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
                      setPasswordError(null);
                    }}
                    disabled={isUpdatingPassword}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-80"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                  >
                    {t("Hủy", "Cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {user?.has_password
                  ? t("Thay đổi mật khẩu của bạn để bảo vệ tài khoản", "Change your password to protect your account")
                  : t("Đặt mật khẩu để đăng nhập bằng email và tên đăng nhập", "Set a password to login with email or username")}
              </p>
            )}
          </div>

          {/* Connected accounts section */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              {t("Tài khoản được kết nối", "Connected Accounts")}
            </h2>

            {/* Google Account */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Google</p>
                  {user?.has_google ? (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("Đã kết nối", "Connected")}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("Chưa kết nối", "Not connected")}
                    </p>
                  )}
                </div>
              </div>
              {user?.has_google ? (
                <button
                  onClick={() => {
                    setShowUnlinkConfirm(true);
                    setUnlinkConfirmInput("");
                    setUnlinkError(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                >
                  {t("Gỡ kết nối", "Unlink")}
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {isLinkingGoogle ? t("Đang kết nối...", "Linking...") : t("Kết nối", "Link")}
                </button>
              )}
            </div>
          </div>

          {/* My Results Link */}
          <button
            onClick={() => router.push("/results")}
            className="rounded-2xl p-6 w-full text-left transition-all hover:border-opacity-100 hover:shadow-lg group"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  {t("Kết quả của tôi", "My Results")}
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("Xem chi tiết tất cả các bài đã làm", "View all your test attempts")}
                </p>
              </div>
              <svg 
                className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ color: "var(--accent-violet)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Unlink Google Confirmation Modal */}
      {showUnlinkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowUnlinkConfirm(false)}
        >
          <div
            className="rounded-2xl max-w-md w-full overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid rgba(244,63,94,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#f43f5e">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                    {t("Gỡ kết nối Google", "Unlink Google Account")}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("Hành động này không thể hoàn tác. Sau khi gỡ, bạn sẽ không thể đăng nhập bằng Google.", "This cannot be undone. You won't be able to sign in with this Google account.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  {t("Để xác nhận, hãy nhập đoạn sau:", "To confirm, type the following:")}
                </p>
                <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                  <p className="text-sm font-mono text-center select-all" style={{ color: "#f43f5e" }}>
                    Delete_{user?.email}
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={unlinkConfirmInput}
                onChange={(e) => {
                  setUnlinkConfirmInput(e.target.value);
                  if (unlinkError) setUnlinkError(null);
                }}
                placeholder={t("Nhập xác nhận...", "Enter confirmation...")}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f43f5e";
                  e.target.style.boxShadow = "0 0 0 3px rgba(244,63,94,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />

              {unlinkError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {unlinkError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowUnlinkConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
              >
                {t("Hủy", "Cancel")}
              </button>
              <button
                onClick={handleUnlinkGoogle}
                disabled={isUnlinkingGoogle || unlinkConfirmInput !== `Delete_${user?.email}`}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
              >
                {isUnlinkingGoogle ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t("Đang gỡ...", "Unlinking...")}
                  </span>
                ) : t("Gỡ kết nối", "Unlink")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
