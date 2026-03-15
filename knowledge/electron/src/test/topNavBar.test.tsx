import { render, screen, fireEvent } from "@testing-library/react";
import TopNavBar from "../components/layout/TopNavBar";
import { AuthProvider } from "../components/auth-provider";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

describe("TopNavBar Component", () => {
    it("should call electron IPC when window controls are clicked", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <TopNavBar />
                </AuthProvider>
            </BrowserRouter>
        );

        // Verify minimize
        const minimizeBtn = screen.getByRole("button", { name: (content, element) => element?.innerHTML.includes('M1 6h10') || false });
        // Note: The buttons don't have aria-labels in the code, they have SVGs. 
        // I should find them by their click handlers or just query the buttons.
        // Let's use the fact that there are 3 window control buttons at the end.
        const buttons = screen.getAllByRole("button");
        const windowButtons = buttons.slice(-3); // Last 3 buttons are min, max, close

        fireEvent.click(windowButtons[0]);
        expect(window.ipcRenderer.send).toHaveBeenCalledWith("window-minimize");

        fireEvent.click(windowButtons[1]);
        expect(window.ipcRenderer.send).toHaveBeenCalledWith("window-maximize");

        fireEvent.click(windowButtons[2]);
        expect(window.ipcRenderer.send).toHaveBeenCalledWith("window-close");
    });

    it("should open command palette on Ctrl+K", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <TopNavBar />
                </AuthProvider>
            </BrowserRouter>
        );

        // Initial state: dialog should not be in the document or hidden
        // The CommandDialog typically renders even if closed but hidden/aria-hidden

        fireEvent.keyDown(document, { key: "k", ctrlKey: true });

        // Search for placeholder text in command input
        expect(screen.getByPlaceholderText(/Ask Centrix AI anything/i)).toBeInTheDocument();
    });
});
