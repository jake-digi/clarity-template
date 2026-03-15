export interface Phase {
    name: string;
    progress: number;
    color: string;
    status: string;
    date: string;
    leads: string[];
    template: string;
    notApplicable?: boolean;
}

export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "IN PROGRESS" | "NOT STARTED" | "BLOCKED" | "COMPLETED" | "REVIEW";

export interface Task {
    id: string;
    priority: TaskPriority;
    taskName: string;
    phase: string;
    assignees: string[];
    startDate: string;
    deadline: string;
    status: TaskStatus;
    estHours: number;
    loggedHours: number;
    completed: boolean;
}

export interface Risk {
    id: string;
    status: "OPEN" | "CLOSED";
    category: string;
    project: string;
    description: string;
    l: number; // Likelihood
    i: number; // Impact
    score: number; // L * I
    mitigation: string;
    lPost: number; // Likelihood Post
    iPost: number; // Impact Post
    scorePost: number; // Mitigated Score
    latestUpdate: string;
}

export interface Order {
    id: string; // PO Number
    description: string;
    supplier: string;
    orderedBy: string[];
    costCenter: string;
    amount: string;
    orderDate: string;
    expectedDelivery: string;
    status: "ORDERED" | "DELAYED" | "RECEIVED" | "PENDING";
    type: 'mechanical' | 'electrical' | 'robotics' | 'consumables';
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    initials: string;
    group: 'mgmt' | 'eng' | 'ops';
    status: 'active' | 'busy' | 'offline';
    workload: 'high' | 'medium' | 'low';
    activeTasks: number;
    loggedHours: number;
    issues: number;
    color: string;
}

export interface SystemHealth {
    metrics: { label: string; value: string; icon: string }[];
    services: { name: string; status: string; node: string }[];
}

export interface MockGanttTask {
    start: Date;
    end: Date;
    name: string;
    id: string;
    progress: number;
    displayProgress?: number;
    type: "project" | "task" | "milestone";
    hideChildren?: boolean;
    styles?: any;
    project?: string;
    dependencies?: string[];
}

export interface ProjectData {
    id: string;
    name: string;
    code: string;
    client: string;
    lead: string;
    leadRole: string;
    am: string;
    amRole: string;
    tech: string;
    techRole: string;
    status: string;
    overallProgress: number;
    phases: Phase[];
    tasks: Task[];
    stats: {
        tasks: { value: string; subValue: string; progress: number };
        budget: { value: string; subValue: string; progress: number };
        time: { value: string; subValue: string; progress: number };
    };
    financials: {
        totalBudget: string;
        spentToDate: string;
        spentToDateColor: string;
        remaining: string;
        remainingColor: string;
        budgetUtilization: number;
    };
    timeTracking: {
        estimatedHours: string;
        hoursLogged: string;
        hoursLoggedSub: string;
        hoursLoggedColor: string;
        remaining: string;
        remainingColor: string;
        burnRate: number;
    };
    recentActivity: {
        user: string;
        action: string;
        time: string;
        detail?: string;
    }[];
}

const PROJECT_NAMES = [
    'Base Sanding', 'SDM', 'CES Composites', 'Robot Palletizer', 'CNC Milling Station',
    'Robotic Welding Cell', 'Automated Assembly Line', 'Plasma Cutter Retrofit',
    'Laser Engraver Setup', 'Hydraulic Press PLC', 'Vision Inspection System',
    'Conveyor Grid Control', 'Smart Storage Rack', 'Mobile Robot Fleet', 'Scara Arm Install'
];

const CLIENTS = ['Manufacturing Co', 'Industrial Corp', 'Advanced Robotics Ltd', 'Global Parts Inc', 'Aerospace Systems'];
export const LEADS = ['Jason Barker', 'Alice Chen', 'Mike Johnson', 'Sarah Chen', 'Tom Wilson', 'Madina Barker'];
export const AMS = ['Max', 'Robert', 'Jennifer', 'David', 'Sophie'];
export const TECHS = ['Sarah', 'Mike', 'Tom', 'Alice', 'Jason'];

export const PHASE_NAMES = [
    'Concept', 'Design', 'Procurement', 'Mechanical Build', 'Electrical Build',
    'Integration & Testing', 'Testing & Commissioning', 'Shipping & Logistics',
    'Installation', 'Training & Handover'
];

const COLORS = ['bg-emerald-500', 'bg-blue-600', 'bg-indigo-600', 'bg-amber-600', 'bg-rose-600', 'bg-slate-500'];

const generateTasks = (projectId: string, phases: Phase[]): Task[] => {
    const tasks: Task[] = [];
    const taskTemplates = [
        'Order equipment', 'Source components', 'Design assembly', 'Fabricate brackets',
        'Wire circuits', 'Feasibility study', 'Review quotes', 'Programming',
        'HMI development', 'Integration', 'FAT preparation', 'Acceptance testing',
        'Commissioning', 'Installation'
    ];

    let taskId = 1;
    phases.forEach(phase => {
        const numTasks = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numTasks; i++) {
            const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
            const priority: TaskPriority = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as TaskPriority[])[Math.floor(Math.random() * 4)];
            const status: TaskStatus = phase.progress === 100 ? 'COMPLETED' :
                phase.progress === 0 ? 'NOT STARTED' :
                    (['IN PROGRESS', 'REVIEW', 'BLOCKED'] as TaskStatus[])[Math.floor(Math.random() * 3)];

            const estHours = Math.floor(Math.random() * 40) + 4;
            const loggedHours = status === 'COMPLETED' ? estHours : Math.floor(Math.random() * estHours);

            tasks.push({
                id: `${projectId}-t${taskId++}`,
                priority,
                taskName: `${taskTemplate}`,
                phase: phase.name,
                assignees: [LEADS[Math.floor(Math.random() * LEADS.length)]],
                startDate: '2026-01-01',
                deadline: '2026-02-01',
                status,
                estHours,
                loggedHours,
                completed: status === 'COMPLETED'
            });
        }
    });

    return tasks;
};

export const generateProjectData = (id: string, name: string): ProjectData => {
    // Deterministic random based on id string length/chars to keep it consistent-ish per session
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (max: number) => {
        const x = Math.sin(seed + max) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    const client = id === 'p1' ? 'Manufacturing Co' :
        id === 'p2' ? 'Tech Industries' :
            id === 'p3' ? 'Aerospace Ltd' :
                CLIENTS[random(CLIENTS.length)];
    const lead = LEADS[random(LEADS.length)];
    const am = AMS[random(AMS.length)];
    const tech = TECHS[random(TECHS.length)];

    const overallProgress = id === 'p1' ? 45 :
        id === 'p2' ? 72 :
            id === 'p3' ? 11 :
                random(100);

    const phases: Phase[] = PHASE_NAMES.map((phaseName, idx) => {
        let progress = 0;
        // Specific progress overrides for individual phases if needed
        if (id === 'p1') {
            const p1Phases = [100, 100, 60, 38, 33, 0, 0, 0, 0, 0];
            progress = p1Phases[idx] ?? 0;
        } else if (id === 'p2') {
            const p2Phases = [100, 100, 100, 100, 80, 50, 0, 0, 0, 0];
            progress = p2Phases[idx] ?? 0;
        } else if (id === 'p3') {
            const p3Phases = [100, 33, 0, 0, 0, 0, 0, 0, 0, 0];
            progress = p3Phases[idx] ?? 0;
        } else {
            if (overallProgress > (idx + 1) * 10) {
                progress = 100;
            } else if (overallProgress > idx * 10) {
                progress = (overallProgress - idx * 10) * 10;
            }
        }

        return {
            name: phaseName,
            progress: Math.min(100, progress),
            color: COLORS[idx % COLORS.length],
            status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending',
            date: '2026-02-15',
            leads: [lead],
            template: ['dashboard', 'gantt', 'table', 'kanban'][idx % 4],
            notApplicable: id !== 'p1' && idx > 5 && (idx + seed) % 4 === 0
        };
    });

    const tasks = generateTasks(id, phases);
    const completedTasks = tasks.filter(t => t.completed).length;

    const totalBudget = 50000 + random(200000);
    const spentToDate = Math.floor(totalBudget * (overallProgress / 100) * (0.8 + Math.random() * 0.4));
    const budgetUtilization = Math.floor((spentToDate / totalBudget) * 100);

    const estHoursTotal = tasks.reduce((acc, t) => acc + t.estHours, 0);
    const loggedHoursTotal = tasks.reduce((acc, t) => acc + t.loggedHours, 0);
    const burnRate = estHoursTotal > 0 ? Math.floor((loggedHoursTotal / estHoursTotal) * 100) : 0;

    return {
        id,
        name,
        code: id === 'p1' ? '2025301' : id === 'p2' ? '202331' : id === 'p3' ? '2025302' : `CNC-2026-${id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)}`,
        client,
        lead,
        leadRole: 'Project Lead',
        am,
        amRole: 'Account Manager',
        tech,
        techRole: 'Technical Designer',
        status: overallProgress === 100 ? 'Completed' : 'Active',
        overallProgress,
        phases,
        tasks,
        stats: {
            tasks: {
                value: `${completedTasks}/${tasks.length}`,
                subValue: `${Math.floor((completedTasks / tasks.length) * 100)}% Complete`,
                progress: Math.floor((completedTasks / tasks.length) * 100)
            },
            budget: {
                value: `${budgetUtilization}%`,
                subValue: `£${spentToDate.toLocaleString()} / £${totalBudget.toLocaleString()}`,
                progress: budgetUtilization
            },
            time: {
                value: `${loggedHoursTotal}h`,
                subValue: `Est: ${estHoursTotal}h (-${Math.max(0, estHoursTotal - loggedHoursTotal)}h)`,
                progress: burnRate
            },
        },
        financials: {
            totalBudget: `£${totalBudget.toLocaleString()}`,
            spentToDate: `£${spentToDate.toLocaleString()}`,
            spentToDateColor: budgetUtilization > 90 ? 'text-red-600' : budgetUtilization > 70 ? 'text-orange-600' : 'text-foreground',
            remaining: `£${(totalBudget - spentToDate).toLocaleString()}`,
            remainingColor: 'text-green-600',
            budgetUtilization
        },
        timeTracking: {
            estimatedHours: `${estHoursTotal}h`,
            hoursLogged: `${loggedHoursTotal}h`,
            hoursLoggedSub: `Tasks: ${Math.floor(loggedHoursTotal * 0.6)}h | Docs: ${Math.floor(loggedHoursTotal * 0.4)}h`,
            hoursLoggedColor: 'text-primary',
            remaining: `${Math.max(0, estHoursTotal - loggedHoursTotal)}h`,
            remainingColor: 'text-green-600',
            burnRate
        },
        recentActivity: [
            { user: lead, action: 'updated project status', time: '2h ago', detail: 'Moved to next phase' },
            { user: am, action: 'approved budget', time: '5h ago' },
            { user: tech, action: 'uploaded drawings', time: '1d ago', detail: 'Revision 2.1' },
            { user: 'System', action: 'automated backup', time: '2d ago' },
        ]
    };
};

export const activeProjectItems = [
    { id: 'p1', name: 'Base Sanding', color: '#10b981' }, // Emerald
    { id: 'p2', name: 'SDM', color: '#3b82f6' },         // Blue
    { id: 'p3', name: 'CES Composites', color: '#a855f7' }, // Purple
    { id: 'p4', name: 'Robot Palletizer', color: '#f59e0b' }, // Amber
    { id: 'p5', name: 'CNC Milling Station', color: '#ef4444' }, // Red
];

export const draftProjectItems = [
    { id: 'd1', name: 'Smart Conveyor v2', color: '#64748b' },
    { id: 'd2', name: 'Vision System AI', color: '#64748b' },
];

export const completedProjectItems = [
    { id: 'c1', name: 'Robotic Welding Cell', color: '#10b981' },
    { id: 'c2', name: 'Automated Assembly Line', color: '#10b981' },
    { id: 'c3', name: 'Plasma Cutter Retrofit', color: '#10b981' },
];

export const archivedProjectItems = [
    { id: 'a1', name: 'Old Conveyor System', color: '#94a3b8' },
    { id: 'a2', name: 'V1 Control Board', color: '#94a3b8' },
];

export interface InstanceItem {
    id: string;
    name: string;
    date: string;
    isDofe?: boolean;
}

export const activeInstanceItems: InstanceItem[] = [
    { id: 'inst-1', name: 'Summer Camp 2026', date: 'Jul 15 - Aug 10, 2026' },
    { id: 'inst-2', name: 'Winter Camp 2024', date: 'Dec 20 - Jan 05, 2027' },
    { id: 'inst-3', name: 'Leaders Weekend Summer 26', date: 'Aug 15 - Aug 17, 2026' },
    { id: 'inst-4', name: 'DofE JCOSS', date: 'May 10 - May 12, 2026', isDofe: true },
    { id: 'inst-5', name: 'DofE Yavneh Boys', date: 'Jun 05 - Jun 07, 2026', isDofe: true },
    { id: 'inst-6', name: 'DofE Yavneh Girls', date: 'Jun 12 - Jun 14, 2026', isDofe: true },
    { id: 'inst-7', name: 'DEMO', date: 'Jun 12 - Jun 14, 2026', isDofe: true },
];

export const draftInstanceItems: InstanceItem[] = [
    { id: 'id-1', name: 'Leaders Weekend Winter 26', date: 'Oct 2026' },
];

export const completedInstanceItems: InstanceItem[] = [
    { id: 'ic-1', name: 'Summer Camp 2025', date: 'Jul - Aug 2025' },
];

export const archivedInstanceItems: InstanceItem[] = [
    { id: 'ia-1', name: 'Winter Camp 2024', date: 'Dec 2024' },
];

export const allInstanceItems = [...activeInstanceItems, ...draftInstanceItems, ...completedInstanceItems, ...archivedInstanceItems];

export const getInstanceById = (id: string) => {
    return allInstanceItems.find(item => item.id === id);
};

const allProjectItems = [...activeProjectItems, ...draftProjectItems, ...completedProjectItems, ...archivedProjectItems];

export const projects: Record<string, ProjectData> = allProjectItems.reduce((acc, item) => {
    acc[item.id] = generateProjectData(item.id, item.name);
    return acc;
}, {} as Record<string, ProjectData>);

export const getProjectById = (id: string): ProjectData => {
    return projects[id] || generateProjectData(id, 'Unknown Project');
};

export const getAllTasks = (): Task[] => {
    return Object.values(projects).flatMap(p => p.tasks);
};

export const defaultProject: ProjectData = projects['p1'];

export interface ActivityLogEntry {
    id: string;
    type: 'user' | 'system' | 'incident';
    groupName: string;
    trackerId: string;
    observedTime: string;
    submittedTime: string;
    submittedBy: string;
    notes: string;
    locationSource: 'My Location' | 'Group Location' | 'Map Coordinate' | 'Staff Reported';
    infoSource: 'Direct Observation' | 'Reported By Staff' | 'Reported By Participant';
    isAcknowledged?: boolean;
    acknowledgedBy?: string;
    acknowledgedTime?: string;
}

export interface Participant {
    id: string;
    memberId: string;
    firstName: string;
    surname: string;
    fullName: string;
    schoolYear?: string;
    gender: string;
    pronouns?: string;
    rank: string;
    groupName?: string;
    superGroupId?: string;
    subGroupId?: string;
    blockId?: string;
    roomId?: string;
    arrivalDate?: string;
    departureDate?: string;
    institute?: string;
    isOffSite: boolean;
    offSiteComment?: string;
    medicalInfo?: {
        allergies: string[];
        conditions: string[];
        notes?: string;
    };
    dietaryNeeds?: {
        restrictions: string[];
        notes?: string;
    };
    profilePhotoUrl?: string;
    photoLink?: string;
    assignedCoachId?: string;
    coachNotes?: string;
    activeCaseIds: string[];
    hasActiveBehaviorCase: boolean;
    hasActiveWelfareCase: boolean;
    hasActiveCareplan: boolean;
    carePlanLink?: string;
    currentStrikeCount: number;
    lastCaseUpdate?: string;
    lastHappinessScore?: number;
    requiresWelfareCheckIn: boolean;
    welfareScores?: Array<{
        score: number;
        timestamp: string;
        notes?: string;
    }>;
}

export interface BaseGroup {
    id: string;
    name: string;
    description?: string;
    type?: string;
    purpose?: string;
    notifications?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Supergroup extends BaseGroup { }

export interface Subgroup extends BaseGroup {
    parentSupergroupId: string;
    members: string[]; // Participant IDs
}

export interface Block {
    id: string;
    name: string;
    description?: string;
    capacity?: number;
    type?: string;
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export interface Room {
    id: string;
    blockId: string;
    name: string;
    description?: string;
    capacity?: number;
    type?: string;
    occupants: string[];
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export interface AssignedInstance {
    instanceId: string;
    instanceName: string;
    role: string;
    addedAt: string;
}

export interface ProfilePhotoHistory {
    photoUrl: string;
    changedAt: string;
    changedBy: string;
}

export interface UserProfile {
    id: string;
    authId: string;
    email: string;
    firstName: string;
    surname?: string;
    lastName?: string;
    tenantId: string;
    status: 'pending_assignment' | 'active' | 'inactive';
    archiveStatus: 'active' | 'archived';
    roles: string[];
    assignedInstances: AssignedInstance[];
    createdAt: string;
    profilePhotoUrl?: string;
    profilePhotoHistory: ProfilePhotoHistory[];
    groups: string[];
    linkedParticipants: Record<string, any>;
}

export type SessionType = 'assembly' | 'academic' | 'meal' | 'bedtime' | 'activity' | 'other';

export interface TimetableSession {
    id?: string;
    title: string;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    location: string;
    type: SessionType;
    attendees: number;
    staff: string[];
    notes: string;
    daysOfWeek: string[];
    specificDate?: string;
    isRecurring: boolean;
    attendingGroups: string[];
    attendingSuperGroups: string[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    isActive: boolean;
}

export interface Announcement {
    id: string;
    title: string;
    body: string;
    status: 'warning' | 'info' | 'error';
    createdAt: string;
    pinned: boolean;
    featured: boolean;
    readByUsers: string[];
    likedBy: string[];
    likeCount: number;
    authorName: string;
    authorId?: string;
}

export interface StageChecklistItem {
    id: string;
    description: string;
    isCompleted: boolean;
}

export interface StageCompletion {
    id: string;
    groupId: string;
    groupName: string; // Helper for display
    stageNumber: number;
    title: string;
    checklistItems: StageChecklistItem[];
    generalNotes: string;
    participantNotes: Record<string, string>;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
    flaggedAsIncident: boolean;
}

export type CaseStatus = 'triage' | 'pending' | 'open' | 'inProgress' | 'resolved' | 'closed';
export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WelfareUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type CasePrivacyLevel = 'normal' | 'staffInvolved' | 'sensitive' | 'highly_sensitive';

export interface BaseCase {
    id: string;
    type: 'behavior' | 'welfare';
    participantId: string;
    participantName: string; // Helper for display
    title: string;
    raisedBy: string;
    timestamp: string;
    location?: string;
    overview: string;
    witnesses: string[];
    category: string;
    status: CaseStatus;
    assignedToId?: string;
    assignedToName?: string;
    actionIds: string[];
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    instanceId: string;
    involvesStaffMember: boolean;
    isSensitiveSafeguarding: boolean;
    privacyLevel: CasePrivacyLevel;
}

export interface BehaviorCase extends BaseCase {
    type: 'behavior';
    associatedStrikeId?: string;
    severityLevel: BehaviorSeverity;
    requiresImmediateAction: boolean;
    involvedStaff: string[];
    parentNotificationSent: boolean;
    parentNotificationDate?: string;
}

export interface WelfareCase extends BaseCase {
    type: 'welfare';
    urgencyLevel: WelfareUrgency;
    requiresExternalSupport: boolean;
    wellbeingMetrics: Record<string, any>;
    supportProviders: string[];
    checkInRequired: boolean;
    lastCheckIn?: string;
    happinessScoreAtRaise?: number;
    isSafeguardingIssue: boolean;
    checkInFrequency?: string;
    checkInInstructions?: string;
    checkInMonitorUntil?: string;
}

export type InstanceCase = BehaviorCase | WelfareCase;

export interface ParticipantInstanceAssignment {
    id: string;
    participantId: string;
    instanceId: string;
    superGroupId?: string;
    subGroupId?: string;
    blockId?: string;
    roomId?: string;
    arrivalDate?: string;
    departureDate?: string;
    isOffSite: boolean;
    offSiteComment?: string;
    createdAt?: string;
}

export const mockParticipantAssignments: ParticipantInstanceAssignment[] = [
    {
        id: 'assign-1',
        participantId: 'p-1',
        instanceId: 'inst-1',
        superGroupId: 'North',
        subGroupId: 'A1',
        blockId: 'Block A',
        roomId: 'A201',
        arrivalDate: '2026-07-15T09:00:00Z',
        departureDate: '2026-07-17T17:00:00Z',
        isOffSite: false
    },
    {
        id: 'assign-2',
        participantId: 'p-2',
        instanceId: 'inst-1',
        superGroupId: 'North',
        subGroupId: 'B1',
        blockId: 'Block B',
        roomId: 'B105',
        arrivalDate: '2026-07-15T09:00:00Z',
        departureDate: '2026-07-17T17:00:00Z',
        isOffSite: false
    },
    {
        id: 'assign-3',
        participantId: 'p-3',
        instanceId: 'inst-1',
        superGroupId: 'North',
        subGroupId: 'A2',
        blockId: 'Block A',
        roomId: 'A202',
        isOffSite: true,
        offSiteComment: 'Attending family wedding, returning tonight'
    },
    {
        id: 'assign-4',
        participantId: 'p-4',
        instanceId: 'inst-1',
        superGroupId: 'South',
        subGroupId: 'G1',
        blockId: 'Block C',
        roomId: 'C301',
        isOffSite: false
    },
    {
        id: 'assign-5',
        participantId: 'p-5',
        instanceId: 'inst-1',
        superGroupId: 'South',
        subGroupId: 'D1',
        blockId: 'Block D',
        roomId: 'D101',
        isOffSite: false
    },
    {
        id: 'assign-6',
        participantId: 'p-6',
        instanceId: 'inst-1',
        superGroupId: 'North',
        subGroupId: 'B2',
        blockId: 'Block B',
        roomId: 'B101',
        isOffSite: false
    },
    // Add duplicate participants in other instances for testing
    {
        id: 'assign-7', // James Wilson in Winter Camp
        participantId: 'p-1',
        instanceId: 'inst-2', // Winter Camp
        superGroupId: 'WinterGroup',
        isOffSite: false
    }
];

export const mockParticipants: Participant[] = [
    {
        id: 'p-1',
        memberId: 'M1001',
        firstName: 'James',
        surname: 'Wilson',
        fullName: 'James Wilson',
        schoolYear: 'Year 10',
        gender: 'Male',
        rank: 'Participant',
        institute: 'JCOSS',
        isOffSite: false, // Default/Fallback
        medicalInfo: {
            allergies: ['Peanuts'],
            conditions: ['Asthma'],
            notes: 'Carries inhaler at all times'
        },
        dietaryNeeds: {
            restrictions: ['Nut Free'],
            notes: 'Severe nut allergy'
        },
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-2',
        memberId: 'M1002',
        firstName: 'Sarah',
        surname: 'Abrahams',
        fullName: 'Sarah Abrahams',
        schoolYear: 'Year 11',
        gender: 'Female',
        rank: 'Group Leader',
        institute: 'Yavneh',
        isOffSite: false,
        dietaryNeeds: {
            restrictions: ['Vegetarian'],
        },
        activeCaseIds: ['case-123'],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: true,
        hasActiveCareplan: true,
        carePlanLink: '#',
        currentStrikeCount: 0,
        requiresWelfareCheckIn: true,
        lastHappinessScore: 8
    },
    {
        id: 'p-3',
        memberId: 'M1003',
        firstName: 'David',
        surname: 'Cohen',
        fullName: 'David Cohen',
        schoolYear: 'Year 10',
        gender: 'Male',
        rank: 'Participant',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 1,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-4',
        memberId: 'M1004',
        firstName: 'Rachel',
        surname: 'Levy',
        fullName: 'Rachel Levy',
        schoolYear: 'Year 9',
        gender: 'Female',
        rank: 'Participant',
        institute: 'Hasmonean',
        isOffSite: false,
        medicalInfo: {
            allergies: ['Penicillin'],
            conditions: ['Eczema'],
        },
        activeCaseIds: ['case-456'],
        hasActiveBehaviorCase: true,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 2,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-5',
        memberId: 'M1005',
        firstName: 'Michael',
        surname: 'Goldman',
        fullName: 'Michael Goldman',
        schoolYear: 'Year 12',
        gender: 'Male',
        rank: 'Assistant Leader',
        isOffSite: false,
        dietaryNeeds: {
            restrictions: ['Gluten-Free', 'Dairy-Free'],
        },
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-6',
        memberId: 'M1006',
        firstName: 'Hannah',
        surname: 'Stein',
        fullName: 'Hannah Stein',
        schoolYear: 'Year 10',
        gender: 'Female',
        rank: 'Participant',
        groupName: 'Beta',
        superGroupId: 'North',
        subGroupId: 'B2',
        blockId: 'Block B',
        roomId: 'B106',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-7',
        memberId: 'M1007',
        firstName: 'Joshua',
        surname: 'Katz',
        fullName: 'Joshua Katz',
        schoolYear: 'Year 11',
        gender: 'Male',
        rank: 'Participant',
        groupName: 'Epsilon',
        superGroupId: 'East',
        subGroupId: 'E1',
        isOffSite: false,
        medicalInfo: {
            allergies: [],
            conditions: ['Type 1 Diabetes'],
            notes: 'Monitors glucose levels with app'
        },
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: true,
        carePlanLink: '#',
        currentStrikeCount: 0,
        requiresWelfareCheckIn: true
    },
    {
        id: 'p-8',
        memberId: 'M1008',
        firstName: 'Leah',
        surname: 'Rosenberg',
        fullName: 'Leah Rosenberg',
        schoolYear: 'Year 9',
        gender: 'Female',
        rank: 'Participant',
        groupName: 'Gamma',
        superGroupId: 'South',
        subGroupId: 'G2',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-9',
        memberId: 'M1009',
        firstName: 'Daniel',
        surname: 'Friedman',
        fullName: 'Daniel Friedman',
        schoolYear: 'Year 10',
        gender: 'Male',
        rank: 'Participant',
        groupName: 'Zeta',
        superGroupId: 'East',
        subGroupId: 'Z1',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-10',
        memberId: 'M1010',
        firstName: 'Rebecca',
        surname: 'Miller',
        fullName: 'Rebecca Miller',
        schoolYear: 'Year 11',
        gender: 'Female',
        rank: 'Assistant Leader',
        groupName: 'Delta',
        superGroupId: 'South',
        subGroupId: 'D2',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-11',
        memberId: 'M1011',
        firstName: 'Samuel',
        surname: 'Glass',
        fullName: 'Samuel Glass',
        schoolYear: 'Year 10',
        gender: 'Male',
        rank: 'Participant',
        groupName: 'Theta',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-12',
        memberId: 'M1012',
        firstName: 'Miriam',
        surname: 'Schwartz',
        fullName: 'Miriam Schwartz',
        schoolYear: 'Year 12',
        gender: 'Female',
        rank: 'Senior Leader',
        groupName: 'HQ',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    },
    {
        id: 'p-13',
        memberId: 'M1013',
        firstName: 'Leo',
        surname: 'Kaufman',
        fullName: 'Leo Kaufman',
        schoolYear: 'Year 9',
        gender: 'Male',
        rank: 'Participant',
        groupName: '', // Unassigned
        superGroupId: '',
        subGroupId: '',
        institute: 'Hasmonean',
        isOffSite: false,
        activeCaseIds: [],
        hasActiveBehaviorCase: false,
        hasActiveWelfareCase: false,
        hasActiveCareplan: false,
        currentStrikeCount: 0,
        requiresWelfareCheckIn: false
    }
];

export const mockSupergroups: Supergroup[] = [
    {
        id: 'sg-1',
        name: 'Village Alpha',
        description: 'Main residential area for senior participants',
        type: 'Residential',
        purpose: 'Accommodation',
        notifications: true,
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'sg-2',
        name: 'Village Beta',
        description: 'Secondary residential area for junior participants',
        type: 'Residential',
        purpose: 'Accommodation',
        notifications: true,
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'sg-3',
        name: 'Staff Housing',
        description: 'Quarters for seasonal staff',
        type: 'Staff',
        purpose: 'Staff Housing',
        notifications: false,
        createdAt: '2026-01-01T00:00:00Z'
    }
];

export const mockSubgroups: Subgroup[] = [
    {
        id: 'sub-1',
        parentSupergroupId: 'sg-1',
        name: 'Alpha 1',
        description: 'Lead unit for Alpha senior participants',
        members: ['p-1', 'p-4'],
        type: 'Unit',
        createdAt: '2026-01-01T10:00:00Z'
    },
    {
        id: 'sub-2',
        parentSupergroupId: 'sg-1',
        name: 'Alpha 2',
        description: 'Support unit for Alpha',
        members: ['p-7'],
        type: 'Unit',
        createdAt: '2026-01-01T10:00:00Z'
    },
    {
        id: 'sub-3',
        parentSupergroupId: 'sg-2',
        name: 'Beta 1',
        description: 'Junior primary group',
        members: ['p-2', 'p-3'],
        type: 'Unit',
        createdAt: '2026-01-01T10:00:00Z'
    },
    {
        id: 'sub-4',
        parentSupergroupId: 'sg-2',
        name: 'Beta 2',
        description: 'Junior secondary group',
        members: ['p-5'],
        type: 'Unit',
        createdAt: '2026-01-01T10:00:00Z'
    },
    {
        id: 'sub-5',
        parentSupergroupId: 'sg-3',
        name: 'Welfare Team',
        description: 'Active welfare response unit',
        members: [],
        type: 'Service',
        createdAt: '2026-01-01T10:00:00Z'
    }
];

export const mockBlocks: Block[] = [
    {
        id: 'blk-1',
        name: 'Block A (Main)',
        description: 'Main residential block with large common room',
        capacity: 40,
        type: 'accommodation',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'blk-2',
        name: 'Block B (North)',
        description: 'Quiet block located near the forest edge',
        capacity: 24,
        type: 'accommodation',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'blk-3',
        name: 'Activity Center',
        description: 'Multi-purpose rooms and storage',
        capacity: 0,
        type: 'activity',
        createdAt: '2026-01-01T00:00:00Z'
    }
];

export const mockRooms: Room[] = [
    {
        id: 'rm-101',
        blockId: 'blk-1',
        name: 'Room 101',
        capacity: 4,
        type: 'bedroom',
        occupants: ['p-1', 'p-4'],
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'rm-102',
        blockId: 'blk-1',
        name: 'Room 102',
        capacity: 4,
        type: 'bedroom',
        occupants: ['p-7'],
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'rm-201',
        blockId: 'blk-2',
        name: 'Room 201',
        capacity: 2,
        type: 'bedroom',
        occupants: ['p-2', 'p-3'],
        createdAt: '2026-01-01T00:00:00Z'
    }
];

export const mockUserProfiles: UserProfile[] = [
    {
        id: 'user-1',
        authId: 'auth-1',
        email: 'sarah.jenkins@jlgb.org',
        firstName: 'Sarah',
        surname: 'Jenkins',
        tenantId: 'tenant-1',
        status: 'active',
        archiveStatus: 'active',
        roles: ['Admin', 'Welfare Lead'],
        assignedInstances: [
            { instanceId: 'inst-1', instanceName: 'Summer Camp 2026', role: 'Staff', addedAt: '2026-01-15T10:00:00Z' }
        ],
        createdAt: '2025-12-01T09:00:00Z',
        profilePhotoUrl: 'https://i.pravatar.cc/150?u=sarah',
        profilePhotoHistory: [],
        groups: ['Welfare Team', 'Admin'],
        linkedParticipants: {}
    },
    {
        id: 'user-2',
        authId: 'auth-2',
        email: 'mike.ross@jlgb.org',
        firstName: 'Mike',
        surname: 'Ross',
        tenantId: 'tenant-1',
        status: 'active',
        archiveStatus: 'active',
        roles: ['Activity Staff'],
        assignedInstances: [
            { instanceId: 'inst-1', instanceName: 'Summer Camp 2026', role: 'Leader', addedAt: '2026-02-01T14:30:00Z' }
        ],
        createdAt: '2026-01-10T11:00:00Z',
        profilePhotoUrl: 'https://i.pravatar.cc/150?u=mike',
        profilePhotoHistory: [],
        groups: ['Activity Team'],
        linkedParticipants: {}
    },
    {
        id: 'user-3',
        authId: 'auth-3',
        email: 'emma.wilson@jlgb.org',
        firstName: 'Emma',
        surname: 'Wilson',
        tenantId: 'tenant-1',
        status: 'pending_assignment',
        archiveStatus: 'active',
        roles: ['Volunteer'],
        assignedInstances: [],
        createdAt: '2026-02-15T16:45:00Z',
        profilePhotoHistory: [],
        groups: [],
        linkedParticipants: {}
    },
    {
        id: 'user-4',
        authId: 'auth-4',
        email: 'david.bond@jlgb.org',
        firstName: 'David',
        surname: 'Bond',
        tenantId: 'tenant-1',
        status: 'active',
        archiveStatus: 'active',
        roles: ['Logistics'],
        assignedInstances: [
            { instanceId: 'inst-1', instanceName: 'Summer Camp 2026', role: 'Staff', addedAt: '2026-01-20T08:30:00Z' }
        ],
        createdAt: '2025-11-20T10:00:00Z',
        profilePhotoUrl: 'https://i.pravatar.cc/150?u=david',
        profilePhotoHistory: [],
        groups: ['Logistics Team'],
        linkedParticipants: {}
    }
];

export const mockTimetableSessions: TimetableSession[] = [
    {
        id: 'sess-1',
        title: 'Morning Briefing',
        startTime: '08:30',
        endTime: '09:00',
        location: 'Main Hall',
        type: 'assembly',
        attendees: 120,
        staff: ['Sarah Jenkins'],
        notes: 'Daily update for all participants',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isRecurring: true,
        attendingGroups: [],
        attendingSuperGroups: ['sg-1', 'sg-2'],
        isActive: true
    },
    {
        id: 'sess-2',
        title: 'Lunch',
        startTime: '12:30',
        endTime: '13:30',
        location: 'Dining Hall',
        type: 'meal',
        attendees: 124,
        staff: ['David Bond'],
        notes: 'Staggered entry by groups',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isRecurring: true,
        attendingGroups: [],
        attendingSuperGroups: ['sg-1', 'sg-2', 'sg-3'],
        isActive: true
    },
    {
        id: 'sess-3',
        title: 'Archery Skills',
        startTime: '14:00',
        endTime: '15:30',
        location: 'West Field',
        type: 'activity',
        attendees: 40,
        staff: ['Mike Ross'],
        notes: 'Intermediate skills training',
        daysOfWeek: ['tuesday', 'thursday'],
        isRecurring: true,
        attendingGroups: ['sub-1', 'sub-2'],
        attendingSuperGroups: [],
        isActive: true
    },
    {
        id: 'sess-4',
        title: 'Safeguarding Refresher',
        startTime: '16:00',
        endTime: '17:00',
        location: 'Staff Lounge',
        type: 'academic',
        attendees: 12,
        staff: ['Sarah Jenkins'],
        notes: 'Mandatory for all new leaders',
        daysOfWeek: ['wednesday'],
        isRecurring: true,
        attendingGroups: ['sub-5'],
        attendingSuperGroups: [],
        isActive: true
    },
    {
        id: 'sess-5',
        title: 'Lights Out',
        startTime: '21:30',
        endTime: '22:00',
        location: 'Residential Blocks',
        type: 'bedtime',
        attendees: 124,
        staff: ['Night Watch'],
        notes: 'Quiet period begins',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isRecurring: true,
        attendingGroups: [],
        attendingSuperGroups: ['sg-1', 'sg-2'],
        isActive: true
    }
];

export const mockStageStages = [
    { number: 1, title: 'Safety Briefing' },
    { number: 2, title: 'On Route' },
    { number: 3, title: 'Checkpoint' },
    { number: 4, title: 'Campsite Arrival' },
    { number: 5, title: 'Debrief' }
];

export const mockStageCompletions: StageCompletion[] = [
    // Alpha 1 - Stage 3
    {
        id: 'sub-1_stage_1',
        groupId: 'sub-1',
        groupName: 'Alpha 1',
        stageNumber: 1,
        title: 'Safety Briefing',
        checklistItems: [
            { id: '1', description: 'Route map reviewed', isCompleted: true },
            { id: '2', description: 'Emergency contacts verified', isCompleted: true },
            { id: '3', description: 'First aid kit checked', isCompleted: true },
            { id: '4', description: 'Water bottles full', isCompleted: true },
            { id: '5', description: 'Weather briefing completed', isCompleted: true },
        ],
        generalNotes: 'All clear',
        participantNotes: {},
        completed: true,
        completedBy: 'Sarah Jenkins',
        completedAt: '2026-07-16T08:00:00Z',
        flaggedAsIncident: false
    },
    {
        id: 'sub-1_stage_2',
        groupId: 'sub-1',
        groupName: 'Alpha 1',
        stageNumber: 2,
        title: 'On Route',
        checklistItems: [
            { id: '1', description: 'Group departed checkpoint', isCompleted: true },
            { id: '2', description: 'All participants present', isCompleted: true },
            { id: '3', description: 'Route confirmed', isCompleted: true },
        ],
        generalNotes: '',
        participantNotes: {},
        completed: true,
        completedBy: 'Mike Ross',
        completedAt: '2026-07-16T10:00:00Z',
        flaggedAsIncident: false
    },
    {
        id: 'sub-1_stage_3',
        groupId: 'sub-1',
        groupName: 'Alpha 1',
        stageNumber: 3,
        title: 'Checkpoint',
        checklistItems: [
            { id: '1', description: 'Welfare check completed', isCompleted: false },
            { id: '2', description: 'All participants accounted for', isCompleted: true },
            { id: '3', description: 'Equipment status verified', isCompleted: true },
            { id: '4', description: 'Supplies replenished if needed', isCompleted: false },
        ],
        generalNotes: 'Participant p-1 feeling slightly fatigued.',
        participantNotes: { 'p-1': 'Tired but ok' },
        completed: false,
        flaggedAsIncident: false
    },
    // Alpha 2 - Stage 1
    {
        id: 'sub-2_stage_1',
        groupId: 'sub-2',
        groupName: 'Alpha 2',
        stageNumber: 1,
        title: 'Safety Briefing',
        checklistItems: [
            { id: '1', description: 'Route map reviewed', isCompleted: true },
            { id: '2', description: 'Emergency contacts verified', isCompleted: true },
            { id: '3', description: 'First aid kit checked', isCompleted: false },
            { id: '4', description: 'Water bottles full', isCompleted: false },
            { id: '5', description: 'Weather briefing completed', isCompleted: true },
        ],
        generalNotes: 'Missing one first aid kit, sourcing now.',
        participantNotes: {},
        completed: false,
        flaggedAsIncident: true
    },
    // Beta 1 - Stage 4
    {
        id: 'sub-4_stage_1',
        groupId: 'sub-4',
        groupName: 'Beta 1',
        stageNumber: 1,
        title: 'Safety Briefing',
        checklistItems: [{ id: '1', description: 'Safety briefing', isCompleted: true }],
        generalNotes: '',
        participantNotes: {},
        completed: true,
        flaggedAsIncident: false
    },
    {
        id: 'sub-4_stage_2',
        groupId: 'sub-4',
        groupName: 'Beta 1',
        stageNumber: 2,
        title: 'On Route',
        checklistItems: [{ id: '1', description: 'On Route', isCompleted: true }],
        generalNotes: '',
        participantNotes: {},
        completed: true,
        flaggedAsIncident: false
    },
    {
        id: 'sub-4_stage_3',
        groupId: 'sub-4',
        groupName: 'Beta 1',
        stageNumber: 3,
        title: 'Checkpoint',
        checklistItems: [{ id: '1', description: 'Checkpoint', isCompleted: true }],
        generalNotes: '',
        participantNotes: {},
        completed: true,
        flaggedAsIncident: false
    },
    {
        id: 'sub-4_stage_4',
        groupId: 'sub-4',
        groupName: 'Beta 1',
        stageNumber: 4,
        title: 'Campsite Arrival',
        checklistItems: [
            { id: '1', description: 'Group arrived at campsite', isCompleted: true },
            { id: '2', description: 'All participants present', isCompleted: true },
            { id: '3', description: 'Camp area set up', isCompleted: false },
            { id: '4', description: 'Safety briefing for campsite', isCompleted: false },
        ],
        generalNotes: 'Raining heavily.',
        participantNotes: {},
        completed: false,
        flaggedAsIncident: false
    }
];

export const mockCases: InstanceCase[] = [
    {
        id: 'case-1',
        type: 'behavior',
        participantId: 'p-4',
        participantName: 'Rachel Levy',
        title: 'Lunchroom Aggression',
        raisedBy: 'Sarah Jenkins',
        timestamp: '2026-07-15T14:30:00Z',
        location: 'Dining Hall',
        overview: 'Disruptive behavior and verbal aggression towards staff during lunch service.',
        witnesses: ['David Bond', 'Chef Mike'],
        category: 'Verbal Abuse',
        status: 'open',
        assignedToId: 'staff-1',
        assignedToName: 'Sarah Jenkins',
        actionIds: ['act-1'],
        metadata: {},
        createdAt: '2026-07-15T14:45:00Z',
        updatedAt: '2026-07-15T15:00:00Z',
        instanceId: 'inst-1',
        severityLevel: 'medium',
        requiresImmediateAction: false,
        involvedStaff: ['Sarah Jenkins'],
        parentNotificationSent: false,
        involvesStaffMember: false,
        isSensitiveSafeguarding: false,
        privacyLevel: 'normal'
    },
    {
        id: 'case-2',
        type: 'welfare',
        participantId: 'p-2',
        participantName: 'Sarah Abrahams',
        title: 'Severe Homesickness - Block B',
        raisedBy: 'System',
        timestamp: '2026-07-15T10:15:00Z',
        location: 'Block B',
        overview: 'Participant showing signs of severe homesickness and social withdrawal.',
        witnesses: [],
        category: 'Homesickness',
        status: 'inProgress',
        assignedToId: 'staff-2',
        assignedToName: 'Emma Wilson',
        actionIds: ['act-2', 'act-3'],
        metadata: {},
        createdAt: '2026-07-15T10:20:00Z',
        updatedAt: '2026-07-15T16:30:00Z',
        instanceId: 'inst-1',
        urgencyLevel: 'high',
        requiresExternalSupport: false,
        wellbeingMetrics: { happiness: 3 },
        supportProviders: ['Welfare Team'],
        checkInRequired: true,
        isSafeguardingIssue: false,
        involvesStaffMember: false,
        isSensitiveSafeguarding: false,
        privacyLevel: 'normal'
    },
    {
        id: 'case-3',
        type: 'behavior',
        participantId: 'p-7',
        participantName: 'Joshua Katz',
        title: 'Archery Safety Breach',
        raisedBy: 'Mike Ross',
        timestamp: '2026-07-16T09:00:00Z',
        location: 'Activity Field',
        overview: 'Repeated safety violations during archery session after multiple warnings.',
        witnesses: ['Activity Staff', 'Alpha Group'],
        category: 'Safety Violation',
        status: 'triage',
        actionIds: [],
        metadata: {},
        createdAt: '2026-07-16T09:15:00Z',
        updatedAt: '2026-07-16T09:15:00Z',
        instanceId: 'inst-1',
        severityLevel: 'high',
        requiresImmediateAction: true,
        involvedStaff: ['Mike Ross'],
        parentNotificationSent: false,
        involvesStaffMember: false,
        isSensitiveSafeguarding: false,
        privacyLevel: 'normal'
    },
    {
        id: 'case-4',
        type: 'welfare',
        participantId: 'p-1',
        participantName: 'James Wilson',
        title: 'Persistent Activity Anxiety',
        raisedBy: 'Emma Wilson',
        timestamp: '2026-07-16T11:00:00Z',
        location: 'First Aid Post',
        overview: 'Minor injury lead to revelation of persistent anxiety regarding group activities.',
        witnesses: [],
        category: 'Anxiety/Depression',
        status: 'open',
        actionIds: [],
        metadata: {},
        createdAt: '2026-07-16T11:30:00Z',
        updatedAt: '2026-07-16T11:30:00Z',
        instanceId: 'inst-1',
        urgencyLevel: 'medium',
        requiresExternalSupport: false,
        wellbeingMetrics: { anxiety: 7 },
        supportProviders: [],
        checkInRequired: true,
        isSafeguardingIssue: false,
        involvesStaffMember: false,
        isSensitiveSafeguarding: false,
        privacyLevel: 'normal'
    },
    {
        id: 'case-5',
        type: 'behavior',
        participantId: 'p-3',
        participantName: 'David Cohen',
        title: 'Post-Curfew Disruption',
        raisedBy: 'David Bond',
        timestamp: '2026-07-14T20:00:00Z',
        location: 'Residential Area',
        overview: 'Minor disruption after curfew. Resolved with verbal warning.',
        witnesses: ['Night Watch'],
        category: 'Minor Disruption',
        status: 'resolved',
        assignedToId: 'staff-4',
        assignedToName: 'David Bond',
        actionIds: [],
        metadata: {},
        createdAt: '2026-07-14T20:15:00Z',
        updatedAt: '2026-07-14T21:00:00Z',
        instanceId: 'inst-1',
        severityLevel: 'low',
        requiresImmediateAction: false,
        involvedStaff: ['David Bond'],
        parentNotificationSent: false,
        involvesStaffMember: false,
        isSensitiveSafeguarding: false,
        privacyLevel: 'normal'
    }
];

export const mockActivityLogs: ActivityLogEntry[] = [
    {
        id: 'log-1',
        type: 'incident',
        groupName: 'Alpha',
        trackerId: '#B01',
        observedTime: '14:15',
        submittedTime: '3m ago',
        submittedBy: 'Sarah Jenkins',
        notes: 'Participant John Smith has a minor blister on left heel. Cleaned and dressed. Group continuing at slower pace.',
        locationSource: 'Group Location',
        infoSource: 'Direct Observation',
        isAcknowledged: false
    },
    {
        id: 'log-2',
        type: 'system',
        groupName: 'Beta',
        trackerId: '#B03',
        observedTime: '14:05',
        submittedTime: '13m ago',
        submittedBy: 'System',
        notes: 'Checkpoint 4 reached. Average speed 3.2 kph.',
        locationSource: 'Map Coordinate',
        infoSource: 'Direct Observation'
    },
    {
        id: 'log-3',
        type: 'user',
        groupName: 'Gamma',
        trackerId: '#B05',
        observedTime: '13:45',
        submittedTime: '33m ago',
        submittedBy: 'Mike Ross',
        notes: 'Group Gamma looking tired but in good spirits. They have stopped for lunch at the edge of the woods.',
        locationSource: 'My Location',
        infoSource: 'Direct Observation'
    },
    {
        id: 'log-4',
        type: 'incident',
        groupName: 'Delta',
        trackerId: '#B07',
        observedTime: '13:20',
        submittedTime: '58m ago',
        submittedBy: 'Emma Wilson',
        notes: 'Missing compass reported by Group Leader. Group is using mobile backup for now. Need replacement at next checkpoint.',
        locationSource: 'Staff Reported',
        infoSource: 'Reported By Staff',
        isAcknowledged: true,
        acknowledgedBy: 'Expedition Lead (David Bond)',
        acknowledgedTime: '13:30'
    },
    {
        id: 'log-5',
        type: 'system',
        groupName: 'Alpha',
        trackerId: '#B01',
        observedTime: '13:00',
        submittedTime: '1h ago',
        submittedBy: 'System',
        notes: 'Departure from Base Camp confirmed.',
        locationSource: 'Map Coordinate',
        infoSource: 'Direct Observation'
    }
];

export const mockAnnouncements: Announcement[] = [
    {
        id: 'ann-1',
        title: 'Morning Briefing Location Change',
        body: 'The morning briefing will now take place in the Activity Field due to the heat.',
        status: 'info',
        createdAt: '2026-07-16T08:00:00Z',
        pinned: true,
        featured: true,
        readByUsers: ['user-1', 'user-2', 'user-4'],
        likedBy: ['user-2'],
        likeCount: 12,
        authorName: 'Sarah Jenkins',
        authorId: 'user-1'
    },
    {
        id: 'ann-2',
        title: 'URGENT: Water Supply Interruption',
        body: 'The main water line in Block A is undergoing emergency repairs. Use facilities in Block B.',
        status: 'error',
        createdAt: '2026-07-16T10:15:00Z',
        pinned: true,
        featured: false,
        readByUsers: ['user-1'],
        likedBy: [],
        likeCount: 0,
        authorName: 'System',
        authorId: 'system'
    },
    {
        id: 'ann-3',
        title: 'Evening Talent Show Signups',
        body: 'Reminder that signups for tonight\'s talent show close at 4 PM! See Mike at the hub.',
        status: 'info',
        createdAt: '2026-07-16T09:00:00Z',
        pinned: false,
        featured: false,
        readByUsers: ['user-1', 'user-2'],
        likedBy: ['user-2', 'user-4'],
        likeCount: 24,
        authorName: 'Mike Ross',
        authorId: 'user-2'
    },
    {
        id: 'ann-4',
        title: 'Weather Warning: High Winds',
        body: 'High winds expected this afternoon. Please secure all loose equipment in units.',
        status: 'warning',
        createdAt: '2026-07-15T18:00:00Z',
        pinned: false,
        featured: false,
        readByUsers: ['user-1', 'user-2', 'user-4'],
        likedBy: [],
        likeCount: 5,
        authorName: 'Logistics Team',
        authorId: 'user-4'
    }
];

export const announcements = mockAnnouncements; // Keeping it for compatibility with existing home page

export const risks: Risk[] = [
    {
        id: "RISK-001",
        status: "OPEN",
        category: "7. Supply Chain & Resources",
        project: "BASE SANDING",
        description: "KUKA robot delivery delayed by 3-4 weeks",
        l: 4, i: 5, score: 20,
        mitigation: "Expedited shipping arranged. Alternative supplier identified. Critical path activities rescheduled.",
        lPost: 2, iPost: 3, scorePost: 6,
        latestUpdate: "Confirmed delivery date: Jan 15. Installation team notified of schedule change."
    },
    {
        id: "RISK-002",
        status: "OPEN",
        category: "1. Technical & Integration",
        project: "BASE SANDING",
        description: "Integration compatibility issues between robot controller and existing PLC system",
        l: 3, i: 4, score: 12,
        mitigation: "Pre-commissioning integration testing scheduled. KUKA technical support on standby. Backup communication protocol identified.",
        lPost: 2, iPost: 2, scorePost: 4,
        latestUpdate: "Preliminary communication tests successful. Full integration test planned for Jan 20."
    },
    {
        id: "RISK-003",
        status: "CLOSED",
        category: "2. Schedule",
        project: "SDM",
        description: "Client facility shutdown during commissioning window",
        l: 3, i: 4, score: 12,
        mitigation: "Alternative commissioning dates identified. Weekend installation option discussed. Modular testing approach prepared.",
        lPost: 2, iPost: 3, scorePost: 6,
        latestUpdate: "Client confirmed facility will remain operational. Commissioning to proceed as scheduled."
    },
    {
        id: "RISK-004",
        status: "OPEN",
        category: "5. Safety & Compliance",
        project: "SDM",
        description: "Safety circuit certification delays due to updated machinery directive requirements",
        l: 2, i: 5, score: 10,
        mitigation: "Early engagement with certification body. Documentation prepared to new standards. Parallel certification process initiated.",
        lPost: 1, iPost: 3, scorePost: 3,
        latestUpdate: "Certification body confirmed compliant design. Final audit scheduled for Feb 1."
    },
    {
        id: "RISK-005",
        status: "OPEN",
        category: "6. Customer & Stakeholder",
        project: "CES Composites",
        description: "Customer design approval delays impacting procurement lead times",
        l: 4, i: 3, score: 12,
        mitigation: "Weekly design review meetings scheduled. Phased approval process implemented. Long-lead items identified for early procurement.",
        lPost: 2, iPost: 2, scorePost: 4,
        latestUpdate: "Customer approved 75% of design. Remaining items flagged for expedited review."
    },
    {
        id: "RISK-006",
        status: "CLOSED",
        category: "3. Cost & Commercial",
        project: "BASE SANDING",
        description: "Scope creep on end effector customization exceeding budget allocation",
        l: 3, i: 3, score: 9,
        mitigation: "Formal change control process implemented. Customer informed of cost implications. Alternative lower-cost solutions proposed.",
        lPost: 2, iPost: 2, scorePost: 4,
        latestUpdate: "Customer agreed to proceed with baseline scope. Additional features moved to Phase 2."
    },
    {
        id: "RISK-007",
        status: "OPEN",
        category: "4. Quality & Performance",
        project: "CES Composites",
        description: "Composite machining precision requirements exceed standard robot repeatability",
        l: 3, i: 4, score: 12,
        mitigation: "High-precision robot model specified. Fixturing design enhanced. Post-machining inspection process added.",
        lPost: 1, iPost: 2, scorePost: 2,
        latestUpdate: "Robot precision tests show ±0.05mm repeatability. Within required tolerance."
    }
];

export const demoTasks: Task[] = [
    { id: "1", priority: "CRITICAL", taskName: "Order KUKA robot KR210", phase: "Procurement", assignees: ["Sarah Chen"], startDate: "30 Nov 2025", deadline: "14 Dec 2025", status: "IN PROGRESS", estHours: 8, loggedHours: 5, completed: false },
    { id: "2", priority: "HIGH", taskName: "Source pneumatic components", phase: "Procurement", assignees: ["Tom Wilson"], startDate: "09 Dec 2025", deadline: "04 Jan 2026", status: "NOT STARTED", estHours: 6, loggedHours: 0, completed: false },
    { id: "3", priority: "CRITICAL", taskName: "Design custom end effector", phase: "Mechanical Build", assignees: ["Jason Barker"], startDate: "19 Nov 2025", deadline: "19 Dec 2025", status: "IN PROGRESS", estHours: 40, loggedHours: 28, completed: false },
    { id: "4", priority: "HIGH", taskName: "Fabricate mounting brackets", phase: "Mechanical Build", assignees: ["Tom Wilson"], startDate: "-", deadline: "09 Jan 2026", status: "BLOCKED", estHours: 16, loggedHours: 0, completed: false },
    { id: "5", priority: "CRITICAL", taskName: "Wire safety circuits", phase: "Electrical Build", assignees: ["Mike Johnson"], startDate: "04 Dec 2025", deadline: "17 Dec 2025", status: "IN PROGRESS", estHours: 24, loggedHours: 18, completed: false },
    { id: "6", priority: "MEDIUM", taskName: "Initial feasibility study", phase: "Concept", assignees: ["Madina Barker"], startDate: "28 Sept 2025", deadline: "14 Oct 2025", status: "COMPLETED", estHours: 20, loggedHours: 22, completed: true },
    { id: "7", priority: "HIGH", taskName: "Review supplier quotes", phase: "Procurement", assignees: [], startDate: "-", deadline: "07 Jan 2026", status: "NOT STARTED", estHours: 4, loggedHours: 0, completed: false },
    { id: "8", priority: "HIGH", taskName: "Robot programming", phase: "Software", assignees: ["Mike Johnson"], startDate: "04 Jan 2026", deadline: "19 Jan 2026", status: "NOT STARTED", estHours: 40, loggedHours: 0, completed: false },
    { id: "9", priority: "MEDIUM", taskName: "HMI development", phase: "Software", assignees: ["Mike Johnson"], startDate: "09 Jan 2026", deadline: "24 Jan 2026", status: "NOT STARTED", estHours: 24, loggedHours: 0, completed: false },
    { id: "10", priority: "CRITICAL", taskName: "System integration", phase: "Integration & Testing", assignees: ["Jason Barker"], startDate: "19 Jan 2026", deadline: "09 Feb 2026", status: "NOT STARTED", estHours: 60, loggedHours: 0, completed: false },
    { id: "11", priority: "HIGH", taskName: "FAT preparation", phase: "Testing & Commissioning", assignees: ["Sarah Chen"], startDate: "31 Jan 2026", deadline: "14 Feb 2026", status: "NOT STARTED", estHours: 32, loggedHours: 0, completed: false },
    { id: "12", priority: "CRITICAL", taskName: "Factory acceptance testing", phase: "Testing & Commissioning", assignees: ["Sarah Chen"], startDate: "09 Feb 2026", deadline: "19 Feb 2026", status: "NOT STARTED", estHours: 40, loggedHours: 0, completed: false },
    { id: "13", priority: "CRITICAL", taskName: "Site commissioning", phase: "Commissioning", assignees: ["Jason Barker"], startDate: "24 Feb 2026", deadline: "10 Mar 2026", status: "NOT STARTED", estHours: 80, loggedHours: 0, completed: false },
    { id: "14", priority: "CRITICAL", taskName: "Equipment installation", phase: "Install", assignees: ["Tom Wilson"], startDate: "28 Feb 2026", deadline: "14 Mar 2026", status: "NOT STARTED", estHours: 120, loggedHours: 0, completed: false },
];

export const orders: Order[] = [
    {
        id: "PO-2025-001", description: "KUKA KR210 Robot", supplier: "KUKA Robotics UK", orderedBy: ["Sarah Chen"], costCenter: "Robot", amount: "£65,000", orderDate: "14 Nov 2025", expectedDelivery: "19 Dec 2025", status: "RECEIVED", type: 'robotics'
    },
    {
        id: "PO-2025-002", description: "Pneumatic Components Kit", supplier: "SMC Pneumatics", orderedBy: ["Tom Wilson"], costCenter: "Mechanical", amount: "£8,500", orderDate: "19 Nov 2025", expectedDelivery: "09 Dec 2025", status: "DELAYED", type: 'mechanical'
    },
    {
        id: "PO-2025-003", description: "Safety Light Curtains", supplier: "Pilz UK", orderedBy: ["Mike Johnson"], costCenter: "Electrical", amount: "£12,000", orderDate: "24 Nov 2025", expectedDelivery: "14 Dec 2025", status: "RECEIVED", type: 'electrical'
    },
    {
        id: "PO-2025-008", description: "Cable Management Kit", supplier: "Igus", orderedBy: ["Sarah Chen"], costCenter: "Electrical", amount: "£3,200", orderDate: "04 Dec 2025", expectedDelivery: "11 Dec 2025", status: "DELAYED", type: 'electrical'
    },
    { id: 'PO-2025-004', description: 'Gripper End Effector', supplier: 'Schunk', orderedBy: ['Jason Barker'], costCenter: 'Mechanical', amount: '£2,100', orderDate: '2026-01-20', expectedDelivery: '2026-02-01', status: 'PENDING', type: 'mechanical' },
    { id: 'PO-2025-005', description: 'Cabling Kit', supplier: 'Lapp', orderedBy: ['Mike Johnson'], costCenter: 'Consumables', amount: '£850', orderDate: '2026-01-18', expectedDelivery: '2026-01-25', status: 'ORDERED', type: 'consumables' },
];

export const teamMembers: TeamMember[] = [
    {
        id: 'tm-1',
        name: 'Jason Barker',
        role: 'Project Lead',
        initials: 'JB',
        group: 'mgmt',
        status: 'active',
        workload: 'high',
        activeTasks: 4,
        loggedHours: 128,
        issues: 2,
        color: 'bg-blue-600'
    },
    {
        id: 'tm-2',
        name: 'Sarah Chen',
        role: 'Senior Engineer',
        initials: 'SC',
        group: 'eng',
        status: 'busy',
        workload: 'high',
        activeTasks: 6,
        loggedHours: 154,
        issues: 1,
        color: 'bg-emerald-500'
    },
    {
        id: 'tm-3',
        name: 'Mike Johnson',
        role: 'Controls Engineer',
        initials: 'MJ',
        group: 'eng',
        status: 'active',
        workload: 'medium',
        activeTasks: 3,
        loggedHours: 92,
        issues: 0,
        color: 'bg-indigo-600'
    },
    {
        id: 'tm-4',
        name: 'Tom Wilson',
        role: 'Mechanical Designer',
        initials: 'TW',
        group: 'eng',
        status: 'active',
        workload: 'medium',
        activeTasks: 2,
        loggedHours: 76,
        issues: 0,
        color: 'bg-amber-600'
    },
    {
        id: 'tm-5',
        name: 'Jennifer Wu',
        role: 'Operations Manager',
        initials: 'JW',
        group: 'mgmt',
        status: 'offline',
        workload: 'low',
        activeTasks: 1,
        loggedHours: 42,
        issues: 0,
        color: 'bg-rose-600'
    },
    {
        id: 'tm-6',
        name: 'Elena Rodriguez',
        role: 'QA Specialist',
        initials: 'ER',
        group: 'eng',
        status: 'active',
        workload: 'low',
        activeTasks: 2,
        loggedHours: 35,
        issues: 0,
        color: 'bg-slate-500'
    }
];

export const systemHealth: SystemHealth = {
    metrics: [
        { label: 'Latency', value: '14ms', icon: 'Wifi' },
        { label: 'Region', value: 'UK-WC', icon: 'Globe' },
        { label: 'Uptime', value: '99.9%', icon: 'Activity' },
    ],
    services: [
        { name: 'Edge Database', status: 'Healthy', node: 'DB-X1' },
        { name: 'Asset Repository', status: 'Healthy', node: 'STR-04' },
        { name: 'Realtime Gateway', status: 'Healthy', node: 'GW-02' },
        { name: 'AI Reasoning Engine', status: 'Healthy', node: 'AI-CORE' },
    ]
};

const getDate = (day: number, month: number, year: number = 2025) => {
    return new Date(year, month - 1, day);
};

export const ganttTasks: MockGanttTask[] = [
    // --- Concept Phase ---
    {
        start: getDate(22, 9),
        end: getDate(2, 2, 2026),
        name: "Concept",
        id: "Phase-Concept",
        progress: 100,
        displayProgress: 100,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#10b981", progressSelectedColor: "#059669", backgroundColor: "#10b981" }
    },
    {
        start: getDate(22, 9),
        end: getDate(6, 10),
        name: "Initial feasibility study",
        id: "Task-1",
        progress: 100,
        displayProgress: 100,
        type: "task",
        project: "Phase-Concept",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" } // Blue
    },

    // --- Procurement Phase ---
    {
        start: getDate(29, 9),
        end: getDate(5, 1, 2026),
        name: "Procurement",
        id: "Phase-Procurement",
        progress: 100,
        displayProgress: 45,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#a855f7", progressSelectedColor: "#9333ea", backgroundColor: "#a855f7" }
    },
    {
        start: getDate(29, 9),
        end: getDate(20, 10),
        name: "Order KUKA robot KR210 (LIVE)",
        id: "Task-2",
        progress: 100,
        displayProgress: 20,
        type: "task",
        project: "Phase-Procurement",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },
    {
        start: getDate(13, 10),
        end: getDate(27, 10),
        name: "Source pneumatic components",
        id: "Task-3",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Procurement",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },
    {
        start: getDate(27, 10),
        end: getDate(10, 11),
        name: "Review supplier quotes",
        id: "Task-4",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Procurement",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },

    // --- Mechanical Build Phase ---
    {
        start: getDate(3, 11),
        end: getDate(29, 12),
        name: "Mechanical Build",
        id: "Phase-Mech",
        progress: 100,
        displayProgress: 25,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#f59e0b", progressSelectedColor: "#d97706", backgroundColor: "#f59e0b" }
    },
    {
        start: getDate(3, 11),
        end: getDate(24, 11),
        name: "Design custom end effector",
        id: "Task-5",
        progress: 100,
        displayProgress: 60,
        type: "task",
        project: "Phase-Mech",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },
    {
        start: getDate(24, 11),
        end: getDate(8, 12),
        name: "Fabricate mounting brackets",
        id: "Task-6",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Mech",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },

    // --- Electrical Build Phase ---
    {
        start: getDate(1, 12),
        end: getDate(29, 12),
        name: "Electrical Build",
        id: "Phase-Elec",
        progress: 100,
        displayProgress: 10,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#ef4444", progressSelectedColor: "#dc2626", backgroundColor: "#ef4444" }
    },
    {
        start: getDate(1, 12),
        end: getDate(15, 12),
        name: "Wire safety circuits",
        id: "Task-7",
        progress: 100,
        displayProgress: 40,
        type: "task",
        project: "Phase-Elec",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },

    // --- Integration & Testing Phase ---
    {
        start: getDate(15, 12),
        end: getDate(12, 1, 2026),
        name: "Integration & Testing",
        id: "Phase-Int",
        progress: 100,
        displayProgress: 0,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#64748b", progressSelectedColor: "#475569", backgroundColor: "#64748b" }
    },
    {
        start: getDate(15, 12),
        end: getDate(5, 1, 2026),
        name: "System integration",
        id: "Task-8",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Int",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },

    // --- Testing & Commissioning Phase ---
    {
        start: getDate(5, 1, 2026),
        end: getDate(2, 2, 2026),
        name: "Testing & Commissioning",
        id: "Phase-Test",
        progress: 100,
        displayProgress: 0,
        type: "project",
        hideChildren: false,
        styles: { progressColor: "#64748b", progressSelectedColor: "#475569", backgroundColor: "#64748b" }
    },
    {
        start: getDate(5, 1, 2026),
        end: getDate(12, 1, 2026),
        name: "FAT preparation",
        id: "Task-9",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Test",
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },
    {
        start: getDate(12, 1, 2026),
        end: getDate(26, 1, 2026),
        name: "Factory acceptance testing",
        id: "Task-10",
        progress: 100,
        displayProgress: 0,
        type: "task",
        project: "Phase-Test",
        dependencies: ["Task-9"],
        styles: { progressColor: "#3b82f6", progressSelectedColor: "#2563eb", backgroundColor: "#3b82f6" }
    },
    {
        start: getDate(27, 1, 2026),
        end: getDate(27, 1, 2026),
        name: "Project Handover",
        id: "Milestone-1",
        progress: 0,
        type: "milestone",
        dependencies: ["Task-10"],
        styles: { progressColor: "#f59e0b", progressSelectedColor: "#d97706", backgroundColor: "#f59e0b" }
    },
];


