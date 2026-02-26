import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/db';
import type { Project } from '@/types';

// ── Query Keys ────────────────────────────────────────────────
export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
};

// ── Queries ───────────────────────────────────────────────────

/** Fetch all projects from Supabase. */
export function useProjects() {
    return useQuery({
        queryKey: projectKeys.all,
        queryFn: () => projectService.getAll(),
    });
}

/** Fetch a single project by its ID. */
export function useProject(id: string | undefined) {
    return useQuery({
        queryKey: projectKeys.detail(id!),
        queryFn: () => projectService.getById(id!),
        enabled: !!id,
    });
}

// ── Mutations with Optimistic UI ──────────────────────────────

/**
 * Create a new project with optimistic UI update.
 * The new project appears in the list immediately while the
 * RPC call processes in the background.
 */
export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (project: Project) => projectService.create(project),
        onMutate: async (newProject) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await qc.cancelQueries({ queryKey: projectKeys.all });

            // Snapshot the previous value
            const previous = qc.getQueryData<Project[]>(projectKeys.all);

            // Optimistically add the new project to the list
            qc.setQueryData<Project[]>(projectKeys.all, (old = []) => [newProject, ...old]);

            return { previous };
        },
        onError: (_err, _newProject, context) => {
            // Roll back to the previous state on error
            if (context?.previous) {
                qc.setQueryData(projectKeys.all, context.previous);
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure consistency
            qc.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

/**
 * Update an existing project with optimistic UI update.
 * The changes appear immediately — if the RPC fails, they're rolled back.
 */
export function useUpdateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
            projectService.update(id, updates),
        onMutate: async ({ id, updates }) => {
            await qc.cancelQueries({ queryKey: projectKeys.all });
            await qc.cancelQueries({ queryKey: projectKeys.detail(id) });

            // Snapshot both caches
            const previousAll = qc.getQueryData<Project[]>(projectKeys.all);
            const previousDetail = qc.getQueryData<Project | undefined>(projectKeys.detail(id));

            // Optimistically update the list
            qc.setQueryData<Project[]>(projectKeys.all, (old = []) =>
                old.map((p) => (p.id === id ? { ...p, ...updates } : p))
            );

            // Optimistically update the detail
            if (previousDetail) {
                qc.setQueryData<Project>(projectKeys.detail(id), { ...previousDetail, ...updates });
            }

            return { previousAll, previousDetail, id };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousAll) {
                qc.setQueryData(projectKeys.all, context.previousAll);
            }
            if (context?.previousDetail) {
                qc.setQueryData(projectKeys.detail(context.id), context.previousDetail);
            }
        },
        onSettled: (_data, _error, variables) => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
            qc.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
        },
    });
}

/**
 * Delete a project with optimistic UI update.
 * The project disappears immediately from the list.
 */
export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => projectService.delete(id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: projectKeys.all });

            const previous = qc.getQueryData<Project[]>(projectKeys.all);

            // Optimistically remove the project from the list
            qc.setQueryData<Project[]>(projectKeys.all, (old = []) =>
                old.filter((p) => p.id !== id)
            );

            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                qc.setQueryData(projectKeys.all, context.previous);
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
