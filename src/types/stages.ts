export type StageTaskFieldType =
  | 'checkbox'
  | 'text'
  | 'textarea'
  | 'multiple_choice'
  | 'rating'
  | 'number';

export interface StageTaskFieldConfig {
  options?: string[];
  allowMultiple?: boolean;
  min?: number;
  max?: number;
  labels?: string[];
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export interface StageTask {
  id: string;
  stage_template_id: string | null;
  description: string;
  order_number: number;
  field_type: StageTaskFieldType;
  field_config?: StageTaskFieldConfig | null;
  required: boolean | null;
  placeholder?: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface StageTemplate {
  id: string;
  instance_id: string;
  tenant_id: string;
  stage_number: number;
  title: string;
  description?: string | null;
  order_number: number;
  requires_previous_stage?: boolean | null;
  checklist_items?: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface StageTemplateWithTasks extends StageTemplate {
  tasks: StageTask[];
}

export interface GroupStageProgress {
  id: string;
  subgroup_id: string | null;
  stage_template_id: string | null;
  status: string;
  notes?: string | null;
  incident_flag?: boolean | null;
  completed_at?: string | null;
  completed_by?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GroupStageTaskCompletion {
  id: string;
  group_stage_progress_id: string | null;
  stage_task_id: string | null;
  completed: boolean | null;
  completed_at?: string | null;
  completed_by?: string | null;
  response_value?: string | null;
  response_data?: any;
  created_at: string | null;
}

export interface GroupStageParticipantStatus {
  id: string;
  group_stage_progress_id: string | null;
  participant_id: string | null;
  is_present: boolean | null;
  comment: string | null;
  updated_at: string | null;
}
