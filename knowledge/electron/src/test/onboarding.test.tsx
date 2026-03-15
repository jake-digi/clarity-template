import { render, screen, fireEvent } from "@testing-library/react";
import Onboarding from "../pages/Onboarding";
import { AuthProvider } from "../components/auth-provider";
import { ThemeProvider } from "../components/theme-provider";
import { AccessibilityProvider } from "../components/accessibility-provider";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
        <QueryClientProvider client={new QueryClient()}>
            <ThemeProvider defaultTheme="light" storageKey="test-theme">
                <AccessibilityProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </AccessibilityProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </BrowserRouter>
);

// Mock QueryClient since it's used in some child components potentially
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("Onboarding Page", () => {
    it("should render the first step manually", () => {
        const queryClient = new QueryClient();
        render(
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider defaultTheme="light" storageKey="test-theme">
                        <AccessibilityProvider>
                            <AuthProvider>
                                <Onboarding />
                            </AuthProvider>
                        </AccessibilityProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </BrowserRouter>
        );

        expect(screen.getByText("Setup your profile")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    });

    it("should navigate through steps", async () => {
        const queryClient = new QueryClient();
        render(
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider defaultTheme="light" storageKey="test-theme">
                        <AccessibilityProvider>
                            <AuthProvider>
                                <Onboarding />
                            </AuthProvider>
                        </AccessibilityProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </BrowserRouter>
        );

        // Step 0 -> Step 1
        fireEvent.click(screen.getByText("Get Started"));
        expect(screen.getByText("Work Preferences")).toBeInTheDocument();

        // Step 1 -> Step 2
        fireEvent.click(screen.getByText("Continue"));
        expect(screen.getByText("Your Workspace")).toBeInTheDocument();

        // Step 2 -> Step 3
        fireEvent.click(screen.getByText("Continue"));
        expect(screen.getByText("You're all set!")).toBeInTheDocument();
        expect(screen.getByText("Explore Centrix")).toBeInTheDocument();
    });
});
