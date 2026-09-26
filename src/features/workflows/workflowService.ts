import { Workflow } from '../../types/workflow';
import { supabase, isSupabaseConfigured } from '../../core/database/supabase';

class WorkflowService {
  private workflows: Workflow[] = [];

  async getWorkflows(): Promise<Workflow[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data as Workflow[];
        }
      } catch (err: any) {
        console.warn('Supabase getWorkflows error:', err.message);
      }
    }
    return [...this.workflows];
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
