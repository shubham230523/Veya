import { Workflow } from '../../types/workflow';
import { supabase, isSupabaseConfigured } from '../../core/database/supabase';

class WorkflowService {
  async getWorkflows(): Promise<Workflow[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: wfData, error: wfErr } = await supabase
          .from('workflows')
          .select('*')
          .order('created_at', { ascending: false });

        if (wfErr || !wfData) {
          console.warn('Supabase getWorkflows error:', wfErr?.message);
          return [];
        }

        const { data: stepData } = await supabase
          .from('workflow_steps')
          .select('*')
          .order('position', { ascending: true });

        const stepMap = new Map<string, any[]>();
        if (stepData) {
          stepData.forEach((st) => {
            if (!stepMap.has(st.workflow_id)) {
              stepMap.set(st.workflow_id, []);
            }
            stepMap.get(st.workflow_id)!.push({
              id: st.id,
              workflow_id: st.workflow_id,
              skill_id: st.skill_id,
              position: st.position,
              enabled: st.enabled,
              customInstructions: st.custom_instructions,
            });
          });
        }

        return wfData.map((wf) => ({
          ...wf,
          steps: stepMap.get(wf.id) || [],
        }));
      } catch (err: any) {
        console.warn('Supabase getWorkflows exception:', err.message);
      }
    }
    return [];
  }

  async getWorkflowById(id: string): Promise<Workflow | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data: wf, error: wfErr } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', id)
          .single();

        if (wfErr || !wf) return undefined;

        const { data: steps } = await supabase
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', id)
          .order('position', { ascending: true });

        return {
          ...wf,
          steps: steps
            ? steps.map((st) => ({
                id: st.id,
                workflow_id: st.workflow_id,
                skill_id: st.skill_id,
                position: st.position,
                enabled: st.enabled,
                customInstructions: st.custom_instructions,
              }))
            : [],
        };
      } catch (err: any) {
        console.warn('Supabase getWorkflowById error:', err.message);
      }
    }
    return undefined;
  }

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const wfPayload = {
      id: isUuid(workflow.id) ? workflow.id : undefined,
      user_id: null,
      name: workflow.name || 'Custom Workflow',
      goal: workflow.goal,
      provider_id: workflow.provider_id || 'claude',
      created_at: workflow.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: savedWf, error: wfErr } = await supabase
      .from('workflows')
      .upsert([wfPayload])
      .select()
      .single();

    if (wfErr) {
      console.error('Supabase saveWorkflow error:', wfErr.message);
      throw new Error(`Failed to save workflow to Supabase: ${wfErr.message}`);
    }

    if (workflow.steps && workflow.steps.length > 0) {
      const stepPayloads = workflow.steps.map((st, idx) => ({
        id: isUuid(st.id) ? st.id : undefined,
        workflow_id: savedWf.id,
        skill_id: isUuid(st.skill_id) ? st.skill_id : 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
        position: st.position || idx + 1,
        enabled: st.enabled !== false,
        custom_instructions: st.customInstructions || null,
      }));

      await supabase.from('workflow_steps').upsert(stepPayloads);
    }

    return {
      ...workflow,
      id: savedWf.id,
      updated_at: savedWf.updated_at,
    };
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('workflow_steps').delete().eq('workflow_id', id);
        await supabase.from('workflows').delete().eq('id', id);
        return true;
      } catch (err: any) {
        console.warn('Supabase deleteWorkflow error:', err.message);
      }
    }
    return false;
  }
}

export const workflowService = new WorkflowService();
