import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../components/auth-provider";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signInWithPassword: vi.fn(),
            signInWithOAuth: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
        }
    }
}));

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should initialize with no user", async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it("should call supabase login with native credentials", async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        // Mock success response
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { user: { email: "test@example.com" }, session: {} },
            error: null
        });

        await act(async () => {
            await result.current.login("native", { email: "test@example.com", password: "password" });
        });

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password"
        });
    });

    it("should call supabase logout", async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        (supabase.auth.signOut as any).mockResolvedValue({ error: null });

        await act(async () => {
            await result.current.logout();
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
    });
});
