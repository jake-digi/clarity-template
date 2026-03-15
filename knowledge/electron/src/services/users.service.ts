
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

export class UsersService {
    static async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .is('deleted_at', null)
            .order('first_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data as User[];
    }

    static async getById(id: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            throw error;
        }

        return data as User;
    }

    static async assignMultipleToInstance(userIds: string[], instanceId: string) {
        const assignments = userIds.map(userId => ({
            user_id: userId,
            instance_id: instanceId,
            added_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('user_instance_assignments')
            .insert(assignments);

        if (error) {
            console.error('Error assigning users to instance:', error);
            throw error;
        }
    }

    static async getByInstance(instanceId: string) {
        const { data, error } = await supabase
            .from('user_instance_assignments')
            .select(`
                *,
                user:users (*)
            `)
            .eq('instance_id', instanceId);

        if (error) {
            console.error('Error fetching instance users:', error);
            throw error;
        }

        return data.map((row: any) => ({
            ...row.user,
            ...row,
            id: row.user.id,
            user: undefined
        }));
    }
}
