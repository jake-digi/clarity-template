// React Query hooks for instances
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InstancesService } from '@/services/instances.service';
import type { Instance } from '@/types/database';

/**
 * Hook to fetch all instances grouped by status
 */
export function useInstances(tenant_id?: string) {
    return useQuery({
        queryKey: ['instances', tenant_id],
        queryFn: () => InstancesService.getGroupedByStatus(tenant_id),
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to fetch a single instance with full details
 */
export function useInstance(id: string) {
    return useQuery({
        queryKey: ['instance', id],
        queryFn: () => InstancesService.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook to fetch instance statistics
 */
export function useInstanceStats(id: string) {
    return useQuery({
        queryKey: ['instance-stats', id],
        queryFn: () => InstancesService.getStats(id),
        enabled: !!id,
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook to create a new instance
 */
export function useCreateInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (instance: Partial<Instance>) => InstancesService.create(instance),
        onSuccess: () => {
            // Invalidate instances query to refetch
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
    });
}

/**
 * Hook to update an existing instance
 */
export function useUpdateInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Instance> }) =>
            InstancesService.update(id, updates),
        onSuccess: (data) => {
            // Invalidate both list and individual instance
            queryClient.invalidateQueries({ queryKey: ['instances'] });
            queryClient.invalidateQueries({ queryKey: ['instance', data.id] });
        },
    });
}

/**
 * Hook to delete an instance
 */
export function useDeleteInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => InstancesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
    });
}
