import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstanceDocument {
  id: string;
  tenant_id: string;
  instance_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  category: string;
  description: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export function useDocuments(instanceId?: string) {
  return useQuery({
    queryKey: ["instance-documents", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instance_documents")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InstanceDocument[];
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      instanceId,
      tenantId,
      category,
      description,
      uploadedBy,
      uploadedByName,
    }: {
      file: File;
      instanceId: string;
      tenantId: string;
      category: string;
      description?: string;
      uploadedBy?: string;
      uploadedByName?: string;
    }) => {
      const filePath = `${tenantId}/${instanceId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("instance_documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("instance_documents").insert({
        tenant_id: tenantId,
        instance_id: instanceId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || null,
        category,
        description: description || null,
        uploaded_by: uploadedBy || null,
        uploaded_by_name: uploadedByName || null,
      });
      if (dbError) throw dbError;
      return instanceId;
    },
    onSuccess: (instanceId) => {
      qc.invalidateQueries({ queryKey: ["instance-documents", instanceId] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, instanceId }: { id: string; filePath: string; instanceId: string }) => {
      await supabase.storage.from("instance_documents").remove([filePath]);
      await supabase
        .from("instance_documents")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      return instanceId;
    },
    onSuccess: (instanceId) => {
      qc.invalidateQueries({ queryKey: ["instance-documents", instanceId] });
    },
  });
}

export function getDocumentUrl(filePath: string) {
  const { data } = supabase.storage.from("instance_documents").getPublicUrl(filePath);
  return data.publicUrl;
}
