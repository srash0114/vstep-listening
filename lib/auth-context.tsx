"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { getStoredUser, setStoredUser, clearAuth } from "./auth";
import { usersApi } from "./api";

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoading: false,
    setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // null trên server, đọc localStorage sau khi mount để tránh hydration mismatch
    const [user, setUserState] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false); // true sau khi đọc localStorage

    useEffect(() => {
        // Restore từ localStorage ngay lập tức (đồng bộ, gần như tức thì)
        const stored = getStoredUser();
        if (stored) setUserState({ ...stored, isAdmin: stored.role === "admin" });
        setInitialized(true); // báo cho các page biết auth đã sẵn sàng

        // Verify session với server trong background
        usersApi.checkStatus()
            .then((res) => {
                if (res.success && res.data) {
                    const u = { ...res.data, isLoggedIn: true, isAdmin: res.data.role === "admin" };
                    setUserState(u);
                    setStoredUser(u);
                } else {
                    clearAuth();
                    setUserState(null);
                }
            })
            .catch(() => {
                clearAuth();
                setUserState(null);
            });
    }, []);

    const isLoading = !initialized;

    const setUser = (u: User | null) => {
        setUserState(u);
        if (!u) clearAuth();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
