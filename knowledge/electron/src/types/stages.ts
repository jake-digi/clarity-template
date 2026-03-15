// Enhanced Stage Task Types
// Supports various field types for rich data collection

export type StageTaskFieldType =
    | 'checkbox'      // Simple yes/no checkbox
    | 'text'          // Short text input
    | 'textarea'      // Long text input (comments)
    | 'multiple_choice' // Radio buttons or checkboxes for multiple selections
    | 'rating'        // Star ratings or numeric scale
    | 'number';       // Numeric input

export interface StageTaskFieldConfig {
    // For multiple_choice
    options?: string[];
    allowMultiple?: boolean; // Allow selecting multiple options

    // For rating
    min?: number;
    max?: number;
    labels?: string[]; // Labels for min/max values

    // For number
    minValue?: number;
    maxValue?: number;
    step?: number;
}

export interface StageTask {
    id: string;
    stage_template_id: string;
    description: string;
    order_number: number;
    field_type: StageTaskFieldType;
    field_config?: StageTaskFieldConfig;
    required: boolean;
    placeholder?: string;
    created_at: string;
    updated_at?: string;
}

export interface StageTaskResponse {
    id: string;
    group_stage_progress_id: string;
    stage_task_id: string;
    completed: boolean;
    response_value?: string; // For text/textarea/number fields
    response_data?: {
        selected?: string[]; // For multiple choice
        score?: number;      // For rating
        [key: string]: any;
    };
    completed_at?: string;
    completed_by?: string;
    created_at: string;
}

export interface StageTemplate {
    id: string;
    instance_id: string;
    title: string;
    description?: string;
    order_number: number;
    created_at: string;
    updated_at: string;
}

export interface StageTemplateWithTasks extends StageTemplate {
    tasks: StageTask[];
}

export interface GroupStageProgress {
    id: string;
    subgroup_id: string;
    stage_template_id: string;
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
    completed_at?: string;
    completed_by?: string;
    notes?: string;
    incident_flag: boolean;
    created_at: string;
    updated_at: string;
}

export interface GroupStageProgressWithDetails extends GroupStageProgress {
    stage_template: StageTemplate;
    task_completions: StageTaskResponse[];
}
