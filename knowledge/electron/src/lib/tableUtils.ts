
export const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "CRITICAL": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
        case "HIGH": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
        case "MEDIUM": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
        case "LOW": return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
        default: return "text-slate-600 bg-slate-100";
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "COMPLETED":
        case "RECEIVED": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
        case "IN PROGRESS":
        case "ORDERED": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
        case "BLOCKED":
        case "DELAYED": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
        case "NOT STARTED":
        case "PENDING": return "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
        default: return "text-slate-500";
    }
};
