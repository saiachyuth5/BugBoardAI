import express from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export default function adminRoutes(supabase: SupabaseClient) {
  const router = express.Router();

  // Get all bugs (admin view)
  router.get('/bugs', async (req, res) => {
    try {
      const { status } = req.query;
      
      let query = supabase
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching bugs:', error);
      res.status(500).json({ error: 'Failed to fetch bugs' });
    }
  });

  // Update bug status
  router.patch('/bugs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, bounty } = req.body;
      
      const updates: any = {};
      
      if (status) updates.status = status;
      if (bounty !== undefined) updates.bounty = bounty;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }
      
      const { data, error } = await supabase
        .from('bugs')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      
      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Error updating bug:', error);
      res.status(500).json({ error: 'Failed to update bug' });
    }
  });

  // Add payout to a resolved bug
  router.post('/bugs/:id/payout', async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, recipientInfo } = req.body;
      
      // Validate required fields
      if (!amount || !paymentMethod || !recipientInfo) {
        return res.status(400).json({ error: 'Missing required payout fields' });
      }
      
      // First check if the bug exists and is resolved
      const { data: bugData, error: fetchError } = await supabase
        .from('bugs')
        .select('status')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!bugData) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      
      if (bugData.status !== 'resolved') {
        return res.status(400).json({ error: 'Cannot add payout to unresolved bug' });
      }
      
      // Create a payout record
      const { data, error } = await supabase
        .from('payouts')
        .insert([
          {
            bug_id: id,
            amount,
            payment_method: paymentMethod,
            recipient_info: recipientInfo,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      // Update the bug with payout information
      await supabase
        .from('bugs')
        .update({
          payout_status: 'pending'
        })
        .eq('id', id);
      
      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Error creating payout:', error);
      res.status(500).json({ error: 'Failed to create payout' });
    }
  });

  // Get admin dashboard stats
  router.get('/stats', async (req, res) => {
    try {
      // Get count of bugs by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('bugs')
        .select('status, count')
        .group('status');
      
      if (statusError) throw statusError;
      
      // Get total bounty amount
      const { data: bountyData, error: bountyError } = await supabase
        .from('bugs')
        .select('bounty');
      
      if (bountyError) throw bountyError;
      
      const totalBounty = bountyData.reduce((sum, bug) => sum + (bug.bounty || 0), 0);
      
      // Get recent bugs
      const { data: recentBugs, error: recentError } = await supabase
        .from('bugs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;
      
      res.status(200).json({
        statusCounts,
        totalBounty,
        recentBugs
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  return router;
}
