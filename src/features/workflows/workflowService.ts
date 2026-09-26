import { Workflow } from '../../types/workflow';
import { supabase, isSupabaseConfigured } from '../../core/database/supabase';

const WORKFLOWS_STORAGE_KEY = 'veya_saved_workflows_v1';

function getPersistedWorkflows(): Workflow[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read persisted workflows:', err);
  }
  return [];
}

function savePersistedWorkflows(workflows: Workflow[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
    }
  } catch (err) {
    console.warn('Failed to save workflows to local storage:', err);
  }
}

class WorkflowService {
  private workflows: Workflow[] = [...getPersistedWorkflows()];

  async getWorkflows(): Promise<Workflow[]> {
    let dbWfs: Workflow[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbWfs = data as Workflow[];
        }
      } catch (err: any) {
        console.warn('Supabase getWorkflows error:', err.message);
      }
    }

    const map = new Map<string, Workflow>();
    this.workflows.forEach((w) => map.set(w.id, w));
    dbWfs.forEach((w) => map.set(w.id, w));

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );
  }

  async getWorkflowById(id: string): Promise<Workflow | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('workflows').select('*').eq('id', id).single();
        if (!error && data) return data as Workflow;
      } catch (err: any) {
        console.warn('Supabase getWorkflowById error:', err.message);
      }
    }
    return this.workflows.find((w) => w.id === id);
  }

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    const existingIndex = this.workflows.findIndex((w) => w.id === workflow.id);
    const updatedWorkflow: Workflow = {
      ...workflow,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.workflows[existingIndex] = updatedWorkflow;
    } else {
      this.workflows.unshift(updatedWorkflow);
    }

    savePersistedWorkflows(this.workflows);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .upsert([updatedWorkflow])
          .select()
          .single();
        if (!error && data) return data as Workflow;
      } catch (err: any) {
        console.warn('Supabase saveWorkflow error:', err.message);
      }
    }

    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    this.workflows = this.workflows.filter((w) => w.id !== id);
    savePersistedWorkflows(this.workflows);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('workflows').delete().eq('id', id);
      } catch (err: any) {
        console.warn('Supabase deleteWorkflow error:', err.message);
      }
    }
    return true;
  }
}

export const workflowService = new WorkflowService();
