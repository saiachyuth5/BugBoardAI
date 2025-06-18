import express from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export default function bugRoutes(supabase: SupabaseClient) {
  const router = express.Router();

  // Get all bugs
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching bugs:', error);
      res.status(500).json({ error: 'Failed to fetch bugs' });
    }
  });

  // Get a specific bug by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('bugs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching bug:', error);
      res.status(500).json({ error: 'Failed to fetch bug' });
    }
  });

  // Create a new bug report
  router.post('/', async (req, res) => {
    try {
      const { agentName, input, logs, error, timestamp } = req.body;
      
      // Validate required fields
      if (!agentName || !input || !logs) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Generate a simple title based on the input or error
      const title = error 
        ? `Error: ${error.split('\n')[0].substring(0, 50)}` 
        : `Issue with input: ${input.substring(0, 50)}`;
      
      // Create the bug report
      const { data, error: insertError } = await supabase
        .from('bugs')
        .insert([
          {
            title,
            agent_name: agentName,
            input,
            logs,
            error_message: error || null,
            status: 'open',
            bounty: 5, // Default bounty amount
            created_at: timestamp || new Date().toISOString(),
            upvotes: 0
          }
        ])
        .select();

      if (insertError) throw insertError;
      
      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Error creating bug report:', error);
      res.status(500).json({ error: 'Failed to create bug report' });
    }
  });

  // Update bug status (mark as resolved)
  router.patch('/:id/resolve', async (req, res) => {
    try {
      const { id } = req.params;
      const { fixUrl, explanation } = req.body;
      
      // Validate required fields
      if (!fixUrl) {
        return res.status(400).json({ error: 'Fix URL is required' });
      }
      
      const { data, error } = await supabase
        .from('bugs')
        .update({
          status: 'resolved',
          fix_url: fixUrl,
          fix_explanation: explanation,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      
      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Error resolving bug:', error);
      res.status(500).json({ error: 'Failed to resolve bug' });
    }
  });

  // Upvote a bug
  router.post('/:id/upvote', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get current upvotes
      const { data: bugData, error: fetchError } = await supabase
        .from('bugs')
        .select('upvotes')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!bugData) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      
      // Update upvotes
      const { data, error } = await supabase
        .from('bugs')
        .update({ upvotes: (bugData.upvotes || 0) + 1 })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Error upvoting bug:', error);
      res.status(500).json({ error: 'Failed to upvote bug' });
    }
  });

  return router;
}
