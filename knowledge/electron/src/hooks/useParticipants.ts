// React Query hooks for participants
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParticipantsService } from '@/services/participants.service';
import type { Participant } from '@/types/database';

/**
 * Hook to fetch all participants with optional filtering
 */
/**
 * Hook to fetch all participants with optional filtering
 */
export function useParticipants(filtersOrInstanceId?: string | { instance_id?: string }, extraFilters = {}) {
    let finalFilters: any = {};

    if (typeof filtersOrInstanceId === 'string') {
        finalFilters = { instance_id: filtersOrInstanceId, ...extraFilters };
    } else if (filtersOrInstanceId) {
        finalFilters = { ...filtersOrInstanceId, ...extraFilters };
    }

    return useQuery({
        queryKey: ['participants', finalFilters],
        queryFn: () => ParticipantsService.getAll(finalFilters),
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to fetch a single participant with full details
 */
export function useParticipant(id: string) {
    return useQuery({
        queryKey: ['participant', id],
        queryFn: () => ParticipantsService.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook to get participant summary for an instance
 */
export function useParticipantsSummary(instance_id: string) {
    return useQuery({
        queryKey: ['participants-summary', instance_id],
        queryFn: () => ParticipantsService.getInstanceSummary(instance_id),
        enabled: !!instance_id,
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook to create a new participant
 */
export function useCreateParticipant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (participant: Partial<Participant>) => ParticipantsService.create(participant),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['participants', data.instance_id] });
            queryClient.invalidateQueries({ queryKey: ['participants-summary', data.instance_id] });
        },
    });
}

/**
 * Hook to update a participant
 */
export function useUpdateParticipant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Participant> }) =>
            ParticipantsService.update(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['participants'] });
            queryClient.invalidateQueries({ queryKey: ['participant', data.id] });
            queryClient.invalidateQueries({ queryKey: ['participants-summary', data.instance_id] });
        },
    });
}

/**
 * Hook to update participant location (on-site/off-site)
 */
export function useUpdateParticipantLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, instanceId, is_off_site, comment }: { id: string; instanceId: string; is_off_site: boolean; comment?: string }) =>
            ParticipantsService.updateLocation(id, instanceId, is_off_site, comment),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['participants'] }); // Global list
            queryClient.invalidateQueries({ queryKey: ['participants', variables.instanceId] }); // Instance list
            queryClient.invalidateQueries({ queryKey: ['participant', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['participants-summary', variables.instanceId] });
        },
    });
}

/**
 * Hook to assign participant to a group
 */
export function useAssignParticipantToGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, instanceId, super_group_id, sub_group_id }: { id: string; instanceId: string; super_group_id: string | null; sub_group_id: string | null }) =>
            ParticipantsService.assignToGroup(id, instanceId, super_group_id, sub_group_id),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['participants'] });
            queryClient.invalidateQueries({ queryKey: ['participants', variables.instanceId] });
            queryClient.invalidateQueries({ queryKey: ['participant', variables.id] });
        },
    });
}

/**
 * Hook to assign participant to housing
 */
export function useAssignParticipantToHousing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, instanceId, block_id, room_id, room_number }: { id: string; instanceId: string; block_id: string | null; room_id: string | null; room_number?: string }) =>
            ParticipantsService.assignToHousing(id, instanceId, block_id, room_id, room_number),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['participants'] });
            queryClient.invalidateQueries({ queryKey: ['participants', variables.instanceId] });
            queryClient.invalidateQueries({ queryKey: ['participant', variables.id] });
        },
    });
}
