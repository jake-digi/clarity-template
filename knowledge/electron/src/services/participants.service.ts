// Participants Service - CRUD operations for participants (directory)
import { supabase } from '@/lib/supabase';
import type { Participant, ParticipantWithDetails } from '@/types/database';

interface ParticipantFilters {
    instance_id?: string;
    status?: string[];
    super_group_id?: string;
    sub_group_id?: string;
    block_id?: string;
    room_id?: string;
    is_off_site?: boolean;
    search?: string;
}

export class ParticipantsService {
    /**
     * Get all participants with optional filtering
     */
    /**
     * Get all participants with optional filtering
     */
    static async getAll(filters: ParticipantFilters = {}) {
        let data: any[] = [];
        let error: any = null;

        // If filtering by instance or instance-specific fields, query the assignments table
        if (filters.instance_id || filters.super_group_id || filters.sub_group_id || filters.block_id || filters.room_id || filters.is_off_site !== undefined) {
            let query = supabase
                .from('participant_instance_assignments')
                .select(`
                    *,
                    participant:participants!participant_id (*),
                    supergroup:supergroups(name),
                    subgroup:subgroups(name),
                    block:blocks(name),
                    room:rooms(room_number, name)
                `);

            if (filters.instance_id) query = query.eq('instance_id', filters.instance_id);
            if (filters.super_group_id) query = query.eq('super_group_id', filters.super_group_id);
            if (filters.sub_group_id) query = query.eq('sub_group_id', filters.sub_group_id);
            if (filters.block_id) query = query.eq('block_id', filters.block_id);
            if (filters.room_id) query = query.eq('room_id', filters.room_id);
            if (filters.is_off_site !== undefined) query = query.eq('is_off_site', filters.is_off_site);

            try {
                const result = await query;
                if (result.error) {
                    console.error('Database query error (assignments):', result.error);
                    throw result.error;
                }

                if (!result.data) return [];

                // Flatten the result to match the Participant interface expected by UI
                return result.data.map((row: any) => {
                    if (!row.participant) {
                        console.warn('Assignment found without participant record:', row.id);
                        return null;
                    }
                    return {
                        ...row.participant,
                        // Override/Add instance specific fields from the assignment row
                        ...row,
                        id: row.participant.id, // Ensure we keep the participant ID
                        participant: undefined, // Remove nested object
                        assignment_id: row.id, // Keep track of assignment ID if needed

                        // Helper fields for UI
                        super_group_name: row.supergroup?.name,
                        sub_group_name: row.subgroup?.name,
                        block_name: row.block?.name,
                        room_name: row.room?.name || row.room?.room_number
                    };
                }).filter(Boolean);
            } catch (err) {
                console.error('Failed to fetch filtered participants:', err);
                throw err;
            }
        } else {
            // Global fetch (no instance context)
            try {
                let query = supabase
                    .from('participants')
                    .select('*')
                    .order('full_name', { ascending: true });

                if (filters.status && filters.status.length > 0) {
                    query = query.in('status', filters.status);
                }

                if (filters.search) {
                    query = query.or(`full_name.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%`);
                }

                const result = await query;
                if (result.error) {
                    console.error('Database query error (global):', result.error);
                    throw result.error;
                }
                data = result.data || [];
            } catch (err) {
                console.error('Failed to fetch global participants:', err);
                throw err;
            }
        }

        // Apply client-side search if we fetched via assignments (as the search would be on the nested participant)
        if (filters.search && (filters.instance_id || filters.super_group_id)) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter((p: any) =>
                p.full_name?.toLowerCase().includes(searchLower) ||
                p.first_name?.toLowerCase().includes(searchLower) ||
                p.surname?.toLowerCase().includes(searchLower)
            );
        }

        return data as Participant[];
    }

    /**
     * Get a single participant by ID with full details including medical/dietary info
     */
    /**
     * Get a single participant by ID with full details including medical/dietary info and instance assignments
     */
    static async getById(id: string, instanceId?: string): Promise<ParticipantWithDetails | null> {
        // Base query for participant info
        let query = supabase
            .from('participants')
            .select(`
                *,
                medical_info:participant_medical_info (*),
                dietary_needs:participant_dietary_needs (*),
                assignments:participant_instance_assignments (
                    *,
                    block:blocks (*),
                    room:rooms (*),
                    supergroup:supergroups (*),
                    subgroup:subgroups (*)
                )
            `)
            .eq('id', id)
            .single();

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching participant:', error);
            throw error;
        }

        if (!data) return null;

        let participant = { ...data };

        // If instanceId is provided, flatten that specific assignment into the top level
        // to maintain backward compatibility with components expecting direct access
        if (instanceId && data.assignments) {
            const assignment = data.assignments.find((a: any) => a.instance_id === instanceId);
            if (assignment) {
                participant = {
                    ...participant,
                    ...assignment,
                    id: participant.id, // Ensure ID is preserved
                    // Assignments field is kept for full history access if needed
                };
            }
        }

        return participant as ParticipantWithDetails;
    }

    /**
     * Create a new participant
     */
    /**
     * Create a new participant, optionally assigning them to an instance
     */
    static async create(participantData: Partial<Participant> & Partial<any>) {
        // Separate core participant fields from assignment fields
        // Note: We use 'any' for input because the Participant type might still have old fields or not have new ones depending on update status
        const {
            instance_id,
            super_group_id,
            sub_group_id,
            block_id,
            room_id,
            room_number,
            is_off_site,
            off_site_comment,
            arrival_date,
            departure_date,
            ...coreParticipant
        } = participantData;

        // 1. Create the participant record
        const { data: newParticipant, error: participantError } = await supabase
            .from('participants')
            .insert([{
                ...coreParticipant,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (participantError) {
            console.error('Error creating participant:', participantError);
            throw participantError;
        }

        // 2. If instance_id is provided, create the assignment
        if (instance_id && newParticipant) {
            const { error: assignmentError } = await supabase
                .from('participant_instance_assignments')
                .insert([{
                    participant_id: newParticipant.id,
                    instance_id,
                    super_group_id: super_group_id || null,
                    sub_group_id: sub_group_id || null,
                    block_id: block_id || null,
                    room_id: room_id || null,
                    room_number: room_number || null,
                    is_off_site: is_off_site || false,
                    off_site_comment: off_site_comment || null,
                    arrival_date: arrival_date || null,
                    departure_date: departure_date || null,
                    created_at: new Date().toISOString()
                }]);

            if (assignmentError) {
                console.error('Error assigning participant to instance:', assignmentError);
                // We should probably rollback or at least warn, but for now we throw
                throw assignmentError;
            }

            // Return merged data to mimic what getAll would return
            return {
                ...newParticipant,
                instance_id,
                super_group_id,
                sub_group_id,
                block_id,
                room_id,
                room_number,
                is_off_site,
                off_site_comment
            } as any;
        }

        return newParticipant as Participant;
    }

    /**
     * Update an existing participant
     */
    static async update(id: string, updates: Partial<Participant>) {
        const { data, error } = await supabase
            .from('participants')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating participant:', error);
            throw error;
        }

        return data as Participant;
    }

    /**
     * Update participant's location (off-site status) for a specific instance
     */
    static async updateLocation(participantId: string, instanceId: string, is_off_site: boolean, comment?: string) {
        const { data, error } = await supabase
            .from('participant_instance_assignments')
            .update({
                is_off_site,
                off_site_comment: comment || null,
            })
            .match({ participant_id: participantId, instance_id: instanceId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Assign participant to a group in a specific instance
     */
    static async assignToGroup(participantId: string, instanceId: string, super_group_id: string | null, sub_group_id: string | null) {
        const { data, error } = await supabase
            .from('participant_instance_assignments')
            .update({
                super_group_id,
                sub_group_id,
            })
            .match({ participant_id: participantId, instance_id: instanceId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Assign participant to housing in a specific instance
     */
    static async assignToHousing(participantId: string, instanceId: string, block_id: string | null, room_id: string | null, room_number?: string) {
        const { data, error } = await supabase
            .from('participant_instance_assignments')
            .update({
                block_id,
                room_id,
                room_number: room_number || null,
            })
            .match({ participant_id: participantId, instance_id: instanceId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get participants grouped by status
     */
    static async getGroupedByStatus(instance_id: string) {
        const participants = await this.getAll({ instance_id });

        return {
            active: participants.filter(p => p.status === 'active'),
            inactive: participants.filter(p => p.status === 'inactive'),
            pending: participants.filter(p => p.status === 'pending'),
        };
    }

    /**
     * Get participants for a specific instance with counts by group
     */
    static async getInstanceSummary(instance_id: string) {
        const participants = await this.getAll({ instance_id, status: ['active'] });

        // Group by supergroup
        const bySupergroup = participants.reduce((acc, p) => {
            const key = p.super_group_id || 'unassigned';
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {} as Record<string, Participant[]>);

        // Count off-site
        const offSiteCount = participants.filter(p => p.is_off_site).length;

        return {
            total: participants.length,
            onSite: participants.length - offSiteCount,
            offSite: offSiteCount,
            bySupergroup,
        };
    }

    static async assignMultipleToInstance(participantIds: string[], instanceId: string) {
        const assignments = participantIds.map(participantId => ({
            participant_id: participantId,
            instance_id: instanceId,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('participant_instance_assignments')
            .insert(assignments);

        if (error) {
            console.error('Error assigning participants to instance:', error);
            throw error;
        }
    }

    /**
     * Create multiple participants from bulk upload and assign them to an instance
     */
    /**
     * Bulk remove participants from an instance (deletes their assignments only, not the participant records)
     */
    static async bulkRemoveFromInstance(participantIds: string[], instanceId: string) {
        if (!participantIds || participantIds.length === 0) return 0;

        const { error, count } = await supabase
            .from('participant_instance_assignments')
            .delete()
            .in('participant_id', participantIds)
            .eq('instance_id', instanceId);

        if (error) {
            console.error('Bulk remove from instance error:', error);
            throw error;
        }

        return count || participantIds.length;
    }

    /**
     * Create multiple participants from bulk upload and assign them to an instance.
     * Auto-creates any supergroups/subgroups found in the CSV that don't yet exist.
     */
    static async bulkCreateAndAssign(participantsData: any[], instanceId: string, tenantId: string) {
        if (!participantsData || participantsData.length === 0) return;

        // ── 1. Collect unique group names from CSV ────────────────────────────
        const csvSupergroupNames = new Set<string>();
        const csvSubgroupNames = new Set<string>();  // keyed "subgroupName|supergroupName"

        const DEFAULT_SUPERGROUP = "General Village";

        for (const row of participantsData) {
            const rawSg = (row['Supergroup'] || row['supergroup'] || '').toString().trim();
            const sub = (row['Subgroup'] || row['subgroup'] || '').toString().trim();
            const sg = rawSg || DEFAULT_SUPERGROUP;

            csvSupergroupNames.add(sg);
            if (sub) csvSubgroupNames.add(`${sub}|||${sg}`);

            // Stash resolved names back onto row for later use
            row['_resolvedSg'] = sg;
            row['_resolvedSub'] = sub;
        }

        // ── 2. Fetch existing supergroups & subgroups ─────────────────────────
        const { data: existingSupergroups } = await supabase
            .from('supergroups')
            .select('id, name')
            .eq('instance_id', instanceId)
            .eq('tenant_id', tenantId);

        const { data: existingSubgroups } = await supabase
            .from('subgroups')
            .select('id, name, parent_supergroup_id')
            .eq('instance_id', instanceId)
            .eq('tenant_id', tenantId);

        // Build lookup maps (lowercase names → record)
        const supergroupMap = new Map<string, any>();
        (existingSupergroups || []).forEach(sg => supergroupMap.set(sg.name.toLowerCase(), sg));

        const subgroupMap = new Map<string, any>();
        (existingSubgroups || []).forEach(sub => subgroupMap.set(sub.name.toLowerCase(), sub));

        // ── 3. Auto-create missing supergroups ───────────────────────────────
        for (const sgName of csvSupergroupNames) {
            if (!supergroupMap.has(sgName.toLowerCase())) {
                const newId = self.crypto.randomUUID();
                const { data: created, error } = await supabase
                    .from('supergroups')
                    .insert({
                        id: newId,
                        name: sgName,
                        instance_id: instanceId,
                        tenant_id: tenantId,
                        notifications: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (error) console.warn(`Failed to create supergroup "${sgName}":`, error);
                else if (created) supergroupMap.set(sgName.toLowerCase(), created);
            }
        }

        // ── 4. Auto-create missing subgroups ─────────────────────────────────
        for (const key of csvSubgroupNames) {
            const [subName, sgName] = key.split('|||');
            if (!subgroupMap.has(subName.toLowerCase())) {
                const parentSg = sgName ? supergroupMap.get(sgName.toLowerCase()) : null;
                if (!parentSg) {
                    console.warn(`Skipping subgroup "${subName}" — parent supergroup "${sgName}" not found`);
                    continue;
                }
                const newId = self.crypto.randomUUID();
                const { data: created, error } = await supabase
                    .from('subgroups')
                    .insert({
                        id: newId,
                        name: subName,
                        parent_supergroup_id: parentSg.id,
                        instance_id: instanceId,
                        tenant_id: tenantId,
                        notifications: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (error) console.warn(`Failed to create subgroup "${subName}":`, error);
                else if (created) subgroupMap.set(subName.toLowerCase(), created);
            }
        }

        // ── 5. Prepare participant records ────────────────────────────────────
        const participantsToInsert = participantsData.map(row => {
            const first_name = (row['Firstname'] || row['first_name'] || '').toString();
            const surname = (row['Surname'] || row['surname'] || '').toString();
            const rawDob = row['DOB'] || row['date_of_birth'] || null;
            const gender = row['Gender'] || row['gender'] || null;

            let formattedDob = null;
            if (rawDob) {
                try {
                    const rawStr = rawDob.toString().trim();
                    if (rawStr) {
                        let dob = new Date(rawStr);
                        if (isNaN(dob.getTime()) && rawStr.includes('/')) {
                            const parts = rawStr.split('/');
                            if (parts.length === 3) {
                                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                                const month = parts[1].padStart(2, '0');
                                const day = parts[0].padStart(2, '0');
                                dob = new Date(`${year}-${month}-${day}`);
                            }
                        }
                        if (!isNaN(dob.getTime())) {
                            formattedDob = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse date:', rawDob);
                }
            }

            const pId = self.crypto.randomUUID();
            return {
                id: pId,
                user_id: pId,
                first_name: first_name.trim(),
                surname: surname.trim(),
                full_name: `${first_name.trim()} ${surname.trim()}`.trim(),
                date_of_birth: formattedDob,
                gender,
                tenant_id: tenantId,
                instance_id: instanceId,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }).filter(p => p.first_name || p.surname);

        if (participantsToInsert.length === 0) return 0;

        const { data: insertedParticipants, error: insertError } = await supabase
            .from('participants')
            .insert(participantsToInsert)
            .select();

        if (insertError) {
            console.error('Bulk insert participant error:', insertError);
            throw insertError;
        }

        if (!insertedParticipants || insertedParticipants.length === 0) return 0;

        // ── 6. Prepare assignment records with resolved group IDs ─────────────
        const assignmentsToInsert = insertedParticipants.map((p, index) => {
            const sourceRow = participantsData[index];
            const sgName = sourceRow['_resolvedSg'];
            const subName = sourceRow['_resolvedSub'];

            const matchedSg = sgName ? supergroupMap.get(sgName.toLowerCase()) : null;
            const matchedSub = subName ? subgroupMap.get(subName.toLowerCase()) : null;

            return {
                participant_id: p.id,
                instance_id: instanceId,
                super_group_id: matchedSg?.id || matchedSub?.parent_supergroup_id || null,
                sub_group_id: matchedSub?.id || null,
                is_off_site: false,
                created_at: new Date().toISOString(),
            };
        });

        const { error: assignError } = await supabase
            .from('participant_instance_assignments')
            .insert(assignmentsToInsert);

        if (assignError) {
            console.error('Bulk assign participants error:', assignError);
            throw assignError;
        }

        return insertedParticipants.length;
    }
}
