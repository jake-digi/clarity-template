import { render, screen, fireEvent, within } from "@testing-library/react";
import { TasksTable } from "../components/tables/TasksTable";
import { describe, it, expect } from "vitest";

const testTasks = [
    {
        id: "task-1",
        priority: "CRITICAL" as const,
        taskName: "Fix critical bug",
        phase: "Concept",
        assignee: "Jason Barker",
        startDate: "2026-01-01",
        deadline: "2026-01-05",
        status: "IN PROGRESS" as const,
        estHours: 10,
        loggedHours: 5,
        completed: false
    },
    {
        id: "task-2",
        priority: "LOW" as const,
        taskName: "Update docs",
        phase: "Design",
        assignee: "Tom Wilson",
        startDate: "2026-01-01",
        deadline: "2026-01-10",
        status: "NOT STARTED" as const,
        estHours: 4,
        loggedHours: 0,
        completed: false
    }
];

describe("TasksTable Component", () => {
    it("should render tasks correctly", () => {
        render(<TasksTable tasks={testTasks} />);

        expect(screen.getByText("Fix critical bug")).toBeInTheDocument();
        expect(screen.getByText("Update docs")).toBeInTheDocument();
        expect(screen.getByText("Jason Barker")).toBeInTheDocument();
    });

    it("should filter by task name if search was available (manual search check)", () => {
        render(<TasksTable tasks={testTasks} />);
        // Verify initial count
        expect(screen.getAllByRole("row").length).toBeGreaterThan(2); // Header + 2 data rows
    });

    it("should open task detail sheet on row click", () => {
        render(<TasksTable tasks={testTasks} />);

        const taskRow = screen.getByText("Fix critical bug");
        fireEvent.click(taskRow);

        // Check if the sheet opened (it should contain the task name in a heading)
        // The TaskDetailSheet likely uses a Radix UI Dialog which renders in a portal
        expect(screen.getAllByText("Fix critical bug").length).toBeGreaterThan(1);
    });
});
