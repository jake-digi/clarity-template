import { supabase } from '@/lib/supabase';
import type {
    StageTemplate,
    StageTask,
    GroupStageProgress,
    GroupStageTaskCompletion,
    Database
} from '@/types/database';

export type StageTemplateWithTasks = StageTemplate & {
    tasks: StageTask[];
};

export type GroupStageProgressWithDetails = GroupStageProgress & {
    task_completions: GroupStageTaskCompletion[];
    participant_statuses?: GroupStageParticipantStatus[];
    template?: StageTemplate;
};

export interface GroupStageParticipantStatus {
    id: string;
    group_stage_progress_id: string;
    participant_id: string;
    is_present: boolean;
    comment: string | null;
    updated_at: string;
    participant?: {
        first_name: string;
        surname: string;
        rank: string | null;
    };
}

export class StagesService {

    // --- Templates & Tasks ---

    static async getStageTemplates(instanceId: string): Promise<StageTemplateWithTasks[]> {
        const { data: templates, error } = await supabase
            .from('stage_templates')
            .select(`
                *,
                tasks:stage_tasks(*)
            `)
            .eq('instance_id', instanceId)
            .order('order_number', { ascending: true });

        if (error) throw error;

        // Sort tasks by order_number
        const result = (templates as any[]).map(t => ({
            ...t,
            tasks: (t.tasks || []).sort((a: StageTask, b: StageTask) => a.order_number - b.order_number)
        }));

        return result as StageTemplateWithTasks[];
    }

    static async createStageTemplate(template: Database['public']['Tables']['stage_templates']['Insert']) {
        const { data, error } = await supabase
            .from('stage_templates')
            .insert(template)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateStageTemplate(id: string, updates: Database['public']['Tables']['stage_templates']['Update']) {
        const { data, error } = await supabase
            .from('stage_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteStageTemplate(id: string) {
        const { error } = await supabase
            .from('stage_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async createStageTask(task: Database['public']['Tables']['stage_tasks']['Insert']) {
        const { data, error } = await supabase
            .from('stage_tasks')
            .insert(task)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteStageTask(id: string) {
        const { error } = await supabase
            .from('stage_tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // --- Progress & Tracking ---

    static async getGroupProgressForInstance(instanceId: string): Promise<GroupStageProgressWithDetails[]> {
        // We first need to get all subgroups for this instance to query their progress
        // Or we can query group_stage_progress filtering by stage_templates belonging to this instance
        // But simpler:

        // 1. Get templates for this instance IDs
        const { data: templates } = await supabase
            .from('stage_templates')
            .select('id')
            .eq('instance_id', instanceId);

        if (!templates?.length) return [];

        const templateIds = templates.map(t => t.id);

        const { data: progress, error } = await supabase
            .from('group_stage_progress')
            .select(`
                *,
                task_completions:group_stage_task_completions(*)
            `)
            .in('stage_template_id', templateIds);

        if (error) throw error;
        return progress as GroupStageProgressWithDetails[];
    }

    static async startStage(subgroupId: string, stageTemplateId: string) {
        // Create a progress record
        const { data, error } = await supabase
            .from('group_stage_progress')
            .insert({
                subgroup_id: subgroupId,
                stage_template_id: stageTemplateId,
                status: 'in_progress',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async completeTask(progressId: string, taskId: string, completed: boolean = true) {
        // Check if completion record exists
        const { data: existing } = await supabase
            .from('group_stage_task_completions')
            .select('id')
            .eq('group_stage_progress_id', progressId)
            .eq('stage_task_id', taskId)
            .single();

        let error;
        if (existing) {
            const res = await supabase
                .from('group_stage_task_completions')
                .update({
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                })
                .eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('group_stage_task_completions')
                .insert({
                    group_stage_progress_id: progressId,
                    stage_task_id: taskId,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                });
            error = res.error;
        }

        if (error) throw error;
    }

    static async updateStageStatus(progressId: string, status: 'in_progress' | 'completed' | 'locked', notes?: string) {
        const updates: any = { status };
        if (status === 'completed') {
            updates.completed_at = new Date().toISOString();
        }
        if (notes !== undefined) {
            updates.notes = notes;
        }

        const { error } = await supabase
            .from('group_stage_progress')
            .update(updates)
            .eq('id', progressId);

        if (error) throw error;
    }

    static async updateTaskCompletion(progressId: string, taskId: string, response: any) {
        // Check if completion record exists
        const { data: existing } = await supabase
            .from('group_stage_task_completions')
            .select('id')
            .eq('group_stage_progress_id', progressId)
            .eq('stage_task_id', taskId)
            .single();

        const completionData = {
            completed: response.completed || false,
            completed_at: response.completed ? new Date().toISOString() : null,
            response_value: response.response_value || null,
            response_data: response.response_data || null,
        };

        let error;
        if (existing) {
            const res = await supabase
                .from('group_stage_task_completions')
                .update(completionData)
                .eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('group_stage_task_completions')
                .insert({
                    ...completionData,
                    group_stage_progress_id: progressId,
                    stage_task_id: taskId,
                });
            error = res.error;
        }

        if (error) throw error;
    }

    static async updateStageProgress(progressId: string, updates: { notes?: string; incident_flag?: boolean }) {
        const { error } = await supabase
            .from('group_stage_progress')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', progressId);

        if (error) throw error;
    }

    static async completeStage(progressId: string, data?: { notes?: string; incident_flag?: boolean }) {
        const { error } = await supabase
            .from('group_stage_progress')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                notes: data?.notes,
                incident_flag: data?.incident_flag || false,
                updated_at: new Date().toISOString()
            })
            .eq('id', progressId);

        if (error) throw error;
    }

    // --- Participant Attendance ---

    static async getParticipantStatuses(progressId: string): Promise<GroupStageParticipantStatus[]> {
        const { data, error } = await supabase
            .from('group_stage_participant_status')
            .select(`
                *,
                participant:participants(first_name, surname, rank)
            `)
            .eq('group_stage_progress_id', progressId);

        if (error) throw error;
        return data as GroupStageParticipantStatus[];
    }

    static async updateParticipantStatus(progressId: string, participantId: string, updates: { is_present?: boolean; comment?: string }) {
        // Upsert logic
        const { data: existing } = await supabase
            .from('group_stage_participant_status')
            .select('id')
            .eq('group_stage_progress_id', progressId)
            .eq('participant_id', participantId)
            .single();

        let error;
        const statusData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        if (existing) {
            const res = await supabase
                .from('group_stage_participant_status')
                .update(statusData)
                .eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('group_stage_participant_status')
                .insert({
                    ...statusData,
                    group_stage_progress_id: progressId,
                    participant_id: participantId
                });
            error = res.error;
        }

        if (error) throw error;
    }
}
