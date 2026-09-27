import { workflowService } from '../src/features/workflows/workflowService';
import { supabase } from '../src/core/database/supabase';
import * as supabaseModule from '../src/core/database/supabase';

describe('WorkflowService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWorkflows()', () => {
    it('returns empty array when Supabase is not configured', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
      const result = await workflowService.getWorkflows();
      expect(result).toEqual([]);
    });

    it('fetches workflows and maps their steps when Supabase is configured', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const mockWfData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Workflow',
          goal: 'Build an App',
          provider_id: 'claude',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ];

      const mockStepData = [
        {
          id: 'step-1',
          workflow_id: '123e4567-e89b-12d3-a456-426614174000',
          skill_id: 'skill-1',
          position: 1,
          enabled: true,
          custom_instructions: 'Run fast',
        },
      ];

      jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'workflows') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockWfData, error: null }),
          } as any;
        }
        if (table === 'workflow_steps') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockStepData, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await workflowService.getWorkflows();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result[0].steps).toHaveLength(1);
      expect(result[0].steps[0].customInstructions).toBe('Run fast');
    });

    it('handles query error or null data gracefully', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      } as any);

      const result = await workflowService.getWorkflows();
      expect(result).toEqual([]);
    });

    it('handles exceptions during fetch gracefully', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Network failure');
      });

      const result = await workflowService.getWorkflows();
      expect(result).toEqual([]);
    });
  });

  describe('getWorkflowById()', () => {
    it('returns undefined when Supabase is not configured', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
      const result = await workflowService.getWorkflowById('123');
      expect(result).toBeUndefined();
    });

    it('fetches a single workflow by ID with its steps', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const mockWf = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Workflow',
        goal: 'Single Goal',
        provider_id: 'gemini',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const mockSteps = [
        {
          id: 'step-1',
          workflow_id: '123e4567-e89b-12d3-a456-426614174000',
          skill_id: 'skill-1',
          position: 1,
          enabled: true,
          custom_instructions: null,
        },
      ];

      jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'workflows') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockWf, error: null }),
          } as any;
        }
        if (table === 'workflow_steps') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockSteps, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await workflowService.getWorkflowById('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Single Workflow');
      expect(result?.steps).toHaveLength(1);
    });

    it('returns undefined if workflow is not found or query returns error', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any);

      const result = await workflowService.getWorkflowById('non-existent');
      expect(result).toBeUndefined();
    });

    it('handles exceptions in getWorkflowById', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Unexpected Error');
      });

      const result = await workflowService.getWorkflowById('123');
      expect(result).toBeUndefined();
    });
  });

  describe('saveWorkflow()', () => {
    it('throws an error if Supabase is not configured', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);

      await expect(
        workflowService.saveWorkflow({
          id: '123',
          name: 'Test',
          goal: 'Goal',
          provider_id: 'claude',
          created_at: '',
          updated_at: '',
          steps: [],
        })
      ).rejects.toThrow('Supabase is not configured.');
    });

    it('saves workflow and steps successfully', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const validWfId = '123e4567-e89b-12d3-a456-426614174000';
      const validSkillId = '223e4567-e89b-12d3-a456-426614174000';

      const mockSavedWf = {
        id: validWfId,
        name: 'Saved Wf',
        goal: 'Goal',
        provider_id: 'claude',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const upsertWfMock = jest.fn().mockReturnThis();
      const selectWfMock = jest.fn().mockReturnThis();
      const singleWfMock = jest.fn().mockResolvedValue({ data: mockSavedWf, error: null });

      const upsertStepsMock = jest.fn().mockResolvedValue({ error: null });

      jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'workflows') {
          return {
            upsert: upsertWfMock,
            select: selectWfMock,
            single: singleWfMock,
          } as any;
        }
        if (table === 'workflow_steps') {
          return {
            upsert: upsertStepsMock,
          } as any;
        }
        return {} as any;
      });

      const input = {
        id: validWfId,
        name: '',
        goal: 'Goal',
        provider_id: '',
        created_at: '',
        updated_at: '',
        steps: [
          {
            id: 'custom-step-1',
            workflow_id: validWfId,
            skill_id: validSkillId,
            position: 1,
            enabled: true,
            customInstructions: 'Custom',
          },
        ],
      };

      const result = await workflowService.saveWorkflow(input as any);
      expect(result.id).toBe(validWfId);
      expect(upsertStepsMock).toHaveBeenCalled();
    });

    it('throws error when workflow upsert fails in Supabase', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert constraint error' } }),
      } as any);

      await expect(
        workflowService.saveWorkflow({
          id: 'invalid-id',
          name: 'Test',
          goal: 'Goal',
          provider_id: 'claude',
          created_at: '',
          updated_at: '',
          steps: [],
        })
      ).rejects.toThrow('Failed to save workflow to Supabase: Insert constraint error');
    });
  });

  describe('deleteWorkflow()', () => {
    it('returns false when Supabase is not configured', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
      const result = await workflowService.deleteWorkflow('123');
      expect(result).toBe(false);
    });

    it('deletes workflow and workflow_steps successfully', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      jest.spyOn(supabase, 'from').mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      } as any);

      const result = await workflowService.deleteWorkflow('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe(true);
      expect(deleteMock).toHaveBeenCalledTimes(2);
    });

    it('handles exception and returns false', async () => {
      jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      jest.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Delete failed');
      });

      const result = await workflowService.deleteWorkflow('123');
      expect(result).toBe(false);
    });
  });
});
