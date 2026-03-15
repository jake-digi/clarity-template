// Instances Service - CRUD operations for camps/events
import { supabase } from '@/lib/supabase';
import type { Instance, InstanceWithDetails } from '@/types/database';

interface InstanceFilters {
    status?: string[];
    tenant_id?: string;
    includeDeleted?: boolean;
}

export class InstancesService {
    /**
     * Get all instances with optional filtering
     */
    static async getAll(filters: InstanceFilters = {}) {
        let query = supabase
            .from('instances')
            .select('*')
            .order('start_date', { ascending: false });

        // Apply filters
        if (filters.status && filters.status.length > 0) {
            query = query.in('status', filters.status);
        }

        // Apply tenant filter only if we have a valid UUID
        if (filters.tenant_id && filters.tenant_id.length > 5) {
            query = query.eq('tenant_id', filters.tenant_id);
        } else {
            console.log('ℹ️ No tenant_id provided, fetching all available instances');
        }

        if (!filters.includeDeleted) {
            query = query.is('deleted_at', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Database error fetching instances:', error);
            throw error;
        }

        console.log('📦 Raw DB results:', data?.length, data);
        return data as Instance[];
    }

    /**
     * Get active instances grouped by status
     */
    static async getGroupedByStatus(tenant_id?: string) {
        console.log('🔍 Fetching instances for tenant:', tenant_id);
        const instances = await this.getAll({ tenant_id });
        console.log('📊 Found instances:', instances.length, instances);

        const grouped = {
            active: instances.filter(i => i.status === 'active' || i.status === 'ongoing' || i.status === 'inactive'),
            upcoming: instances.filter(i => i.status === 'upcoming'),
            draft: instances.filter(i => i.status === 'draft'),
            completed: instances.filter(i => i.status === 'completed'),
            archived: instances.filter(i => i.deleted_at !== null),
        };

        console.log('✅ Grouped instances:', {
            active: grouped.active.length,
            upcoming: grouped.upcoming.length,
            draft: grouped.draft.length,
            completed: grouped.completed.length,
            archived: grouped.archived.length
        });

        return grouped;
    }

    /**
     * Get a single instance by ID with full details
     */
    static async getById(id: string): Promise<InstanceWithDetails | null> {
        const { data, error } = await supabase
            .from('instances')
            .select(`
        *,
        blocks (*),
        rooms (*),
        supergroups (*),
        subgroups (*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching instance:', error);
            throw error;
        }

        // Fetch participant counts for each subgroup
        if (data && data.subgroups && data.subgroups.length > 0) {
            const subgroupIds = data.subgroups.map((sg: any) => sg.id);

            const { data: assignments, error: assignmentError } = await supabase
                .from('participant_instance_assignments')
                .select('sub_group_id')
                .eq('instance_id', id)
                .in('sub_group_id', subgroupIds);

            if (!assignmentError && assignments) {
                // Count participants per subgroup
                const countsBySubgroup = assignments.reduce((acc: Record<string, number>, assignment: any) => {
                    if (assignment.sub_group_id) {
                        acc[assignment.sub_group_id] = (acc[assignment.sub_group_id] || 0) + 1;
                    }
                    return acc;
                }, {});

                // Add member count to each subgroup
                data.subgroups = data.subgroups.map((subgroup: any) => ({
                    ...subgroup,
                    memberCount: countsBySubgroup[subgroup.id] || 0
                }));
            }
        }

        return data as InstanceWithDetails;
    }

    /**
     * Create a new instance
     */
    static async create(instance: Partial<Instance>) {
        const { data, error } = await supabase
            .from('instances')
            .insert([{
                ...instance,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating instance:', error);
            throw error;
        }

        return data as Instance;
    }

    /**
     * Update an existing instance
     */
    static async update(id: string, updates: Partial<Instance>) {
        const { data, error } = await supabase
            .from('instances')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating instance:', error);
            throw error;
        }

        return data as Instance;
    }

    /**
     * Soft delete an instance
     */
    static async delete(id: string) {
        const { error } = await supabase
            .from('instances')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Error deleting instance:', error);
            throw error;
        }
    }

    static async createSupergroup(supergroup: any) {
        const { data, error } = await supabase
            .from('supergroups')
            .insert(supergroup)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async createSubgroup(subgroup: any) {
        const { data, error } = await supabase
            .from('subgroups')
            .insert(subgroup)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get participant count for an instance
     */
    static async getParticipantCount(instance_id: string) {
        const { count, error } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('instance_id', instance_id);

        if (error) {
            console.error('Error counting participants:', error);
            throw error;
        }

        return count || 0;
    }

    /**
     * Get statistics for an instance
     */
    static async getStats(instance_id: string) {
        const [participantCount, blockCount, roomCount, groupCount] = await Promise.all([
            this.getParticipantCount(instance_id),
            supabase.from('blocks').select('*', { count: 'exact', head: true }).eq('instance_id', instance_id),
            supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('instance_id', instance_id),
            supabase.from('supergroups').select('*', { count: 'exact', head: true }).eq('instance_id', instance_id),
        ]);

        return {
            participants: participantCount,
            blocks: blockCount.count || 0,
            rooms: roomCount.count || 0,
            groups: groupCount.count || 0,
        };
    }
}
