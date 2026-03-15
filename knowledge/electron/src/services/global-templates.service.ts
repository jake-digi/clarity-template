import { supabase } from '@/lib/supabase';

export interface GlobalStageTemplate {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
    template_data: {
        stages: Array<{
            title: string;
            order_number: number;
            description?: string;
            tasks: Array<{
                description: string;
                field_type: string;
                required: boolean;
                placeholder?: string;
                field_config?: any;
                order_number: number;
            }>;
        }>;
    };
}

export class GlobalTemplatesService {
    /**
     * Get all global templates for the current tenant
     */
    static async getAll(tenantId: string): Promise<GlobalStageTemplate[]> {
        const { data, error } = await supabase
            .from('global_stage_templates')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as GlobalStageTemplate[];
    }

    /**
     * Get a specific global template by ID
     */
    static async getById(id: string): Promise<GlobalStageTemplate | null> {
        const { data, error } = await supabase
            .from('global_stage_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as GlobalStageTemplate;
    }

    /**
     * Save current instance stages as a global template
     */
    static async saveAsTemplate(
        tenantId: string,
        name: string,
        description: string | undefined,
        stagesData: any[],
        createdBy?: string
    ): Promise<GlobalStageTemplate> {
        // Transform stages data into template format
        const templateData = {
            stages: stagesData.map((stage: any) => ({
                title: stage.title,
                order_number: stage.order_number,
                description: stage.description,
                tasks: (stage.tasks || []).map((task: any) => ({
                    description: task.description,
                    field_type: task.field_type || 'checkbox',
                    required: task.required || false,
                    placeholder: task.placeholder,
                    field_config: task.field_config,
                    order_number: task.order_number,
                })),
            })),
        };

        const { data, error } = await supabase
            .from('global_stage_templates')
            .insert({
                tenant_id: tenantId,
                name,
                description,
                created_by: createdBy,
                template_data: templateData,
            })
            .select()
            .single();

        if (error) throw error;
        return data as GlobalStageTemplate;
    }

    /**
     * Apply a global template to an instance
     * Creates stages and tasks based on the template
     */
    static async applyTemplate(
        templateId: string,
        instanceId: string,
        tenantId: string
    ): Promise<void> {
        // Get the template
        const template = await this.getById(templateId);
        if (!template) throw new Error('Template not found');

        // Import stages dynamically to avoid circular dependency
        const { StagesService } = await import('./stages.service');

        // Create each stage and its tasks
        for (const stageData of template.template_data.stages) {
            // Create the stage template
            const createdStage = await StagesService.createStageTemplate({
                instance_id: instanceId,
                tenant_id: tenantId,
                title: stageData.title,
                description: stageData.description,
                order_number: stageData.order_number,
                stage_number: stageData.order_number,
            } as any);

            // Create each task
            for (const taskData of stageData.tasks) {
                await StagesService.createStageTask({
                    stage_template_id: createdStage.id,
                    description: taskData.description,
                    order_number: taskData.order_number,
                    field_type: taskData.field_type,
                    required: taskData.required,
                    placeholder: taskData.placeholder,
                    field_config: taskData.field_config,
                } as any);
            }
        }
    }

    /**
     * Update a global template
     */
    static async update(
        id: string,
        updates: {
            name?: string;
            description?: string;
            template_data?: any;
        }
    ): Promise<GlobalStageTemplate> {
        const { data, error } = await supabase
            .from('global_stage_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as GlobalStageTemplate;
    }

    /**
     * Delete a global template
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('global_stage_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
