import { describe, it, expect } from "vitest";
import { generateProjectData, getProjectById, projects } from "../data/mockData-old";

describe("mockData", () => {
    it("should generate deterministic project data", () => {
        const data1 = generateProjectData("p1", "Project 1");
        const data2 = generateProjectData("p1", "Project 1");

        expect(data1.id).toBe("p1");
        expect(data1.name).toBe("Project 1");
        expect(data1.overallProgress).toBe(45); // Specific override for p1
        expect(data1.phases).toHaveLength(10);

        // Check determinism (most values should be same for same ID)
        expect(data1.client).toBe(data2.client);
        expect(data1.lead).toBe(data2.lead);
    });

    it("should return a project by ID", () => {
        const project = getProjectById("p2");
        expect(project).toBeDefined();
        expect(project.id).toBe("p2");
        expect(project.overallProgress).toBe(72); // Specific override for p2
    });

    it("should generate a fallback project for unknown IDs", () => {
        const project = getProjectById("unknown");
        expect(project).toBeDefined();
        expect(project.name).toBe("Unknown Project");
    });

    it("should have pre-populated projects", () => {
        expect(Object.keys(projects).length).toBeGreaterThan(0);
        expect(projects["p1"]).toBeDefined();
    });
});
