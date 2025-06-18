import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

interface AuditLogData {
  action: string;
  resource_type: string;
  resource_id?: string;
  previous_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Middleware to log admin actions to the audit log
 */
export function auditLogMiddleware(
  options: {
    action: string;
    resourceType: string;
    getResourceId?: (req: Request) => string | undefined;
    getPreviousValues?: (req: Request) => any;
    getNewValues?: (req: Request) => any;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Save the original response.json method
    const originalJson = res.json;
    
    // Override the response.json method to capture the response data
    res.json = function (body) {
      // If we have a getResourceId function and no resourceId was provided,
      // try to get it from the response body
      const resourceId = options.getResourceId?.(req) || body?.id;
      
      // Get the previous and new values if the functions are provided
      const previousValues = options.getPreviousValues?.(req);
      const newValues = options.getNewValues?.(req) || body;
      
      // Log the action to the audit log
      logAuditAction({
        req,
        action: options.action,
        resource_type: options.resourceType,
        resource_id: resourceId,
        previous_values: previousValues,
        new_values: newValues,
      }).catch(console.error);
      
      // Call the original response.json method
      return originalJson.call(this, body);
    };
    
    next();
  };
}

/**
 * Log an action to the audit log
 */
export async function logAuditAction({
  req,
  action,
  resource_type,
  resource_id,
  previous_values,
  new_values,
}: {
  req: Request;
} & Omit<AuditLogData, 'ip_address' | 'user_agent'>) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Get the current user from the session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the IP address and user agent from the request
    const ip_address = req.ip || req.connection.remoteAddress || 
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     'unknown';
    const user_agent = req.headers['user-agent'] || 'unknown';
    
    // Insert the audit log entry
    const { data, error } = await supabase
      .from('admin_audit_log')
      .insert([{
        admin_id: user?.id || null,
        action,
        resource_type,
        resource_id: resource_id || null,
        previous_values: previous_values ? JSON.parse(JSON.stringify(previous_values)) : null,
        new_values: new_values ? JSON.parse(JSON.stringify(new_values)) : null,
        ip_address,
        user_agent,
      }]);
    
    if (error) {
      console.error('Error logging audit action:', error);
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
}

/**
 * Get the audit logs with pagination and filtering
 */
export async function getAuditLogs({
  page = 1,
  limit = 20,
  action,
  resourceType,
  resourceId,
  adminId,
  startDate,
  endDate,
}: {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    let query = supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_id (id, email, raw_user_meta_data->>'full_name' as full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    // Apply filters
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);
    if (adminId) query = query.eq('admin_id', adminId);
    if (startDate) query = query.gte('created_at', startDate.toISOString());
    if (endDate) query = query.lte('created_at', endDate.toISOString());
    
    const { data, count, error } = await query;
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
    
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    throw error;
  }
}
