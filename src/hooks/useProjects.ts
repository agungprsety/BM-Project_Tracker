import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/db';
import type { Project, BoQItem, WeeklyReport, Photo } from '@/types';

// ── Query Keys ────────────────────────────────────────────────
export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
};

// ── Queries ───────────────────────────────────────────────────

/** Fetch every project from IndexedDB. */
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

// ── Mutations ─────────────────────────────────────────────────

/** Create a new project and invalidate the list cache. */
export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (project: Project) => projectService.create(project),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

/** Update an existing project and invalidate both caches. */
export function useUpdateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
            projectService.update(id, updates),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
            qc.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
        },
    });
}

/** Delete a project and invalidate the list cache. */
export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => projectService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
