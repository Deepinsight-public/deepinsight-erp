// Audit logging system for ERP domain services
import { UserContext } from '/packages/shared/src/index.ts';

export interface AuditEvent {
  id?: string;
  actor_id: string;
  actor_name?: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'read' | 'update' | 'delete';
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  store_id?: string;
  timestamp: string;
}

export interface AuditLogger {
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
  query(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    storeId?: string;
    from?: string;
    to?: string;
  }): Promise<AuditEvent[]>;
}

export class SupabaseAuditLogger implements AuditLogger {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  private getClient() {
    const createClient = (globalThis as any).createClient;
    return createClient(this.supabaseUrl, this.supabaseKey);
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const supabase = this.getClient();
    
    const auditRecord = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // For now, we'll use a simple approach and store in notifications table
    // In a real system, you'd want a dedicated audit_logs table
    await supabase.from('notifications').insert({
      user_id: event.actor_id,
      type: 'audit_log',
      title: `${event.action} ${event.entity_type}`,
      message: `Actor ${event.actor_name || event.actor_id} performed ${event.action} on ${event.entity_type} ${event.entity_id}`,
      metadata: {
        audit_event: auditRecord
      }
    });
  }

  async query(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    storeId?: string;
    from?: string;
    to?: string;
  }): Promise<AuditEvent[]> {
    const supabase = this.getClient();
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('type', 'audit_log')
      .order('created_at', { ascending: false });

    if (filters.actorId) {
      query = query.eq('user_id', filters.actorId);
    }

    if (filters.from) {
      query = query.gte('created_at', filters.from);
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    return data?.map(record => record.metadata?.audit_event).filter(Boolean) || [];
  }
}

export function withAudit<T extends any[], R>(
  auditLogger: AuditLogger,
  actor: UserContext,
  entityType: string,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  return function decorator(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(this: any, ...args: T): Promise<R> {
      const startTime = Date.now();
      let result: R;
      let error: Error | null = null;

      try {
        result = await originalMethod.apply(this, args);
        
        // Extract entity ID from result or args
        let entityId = '';
        if (result && typeof result === 'object' && 'id' in result) {
          entityId = (result as any).id;
        } else if (args.length > 0 && typeof args[0] === 'string') {
          entityId = args[0];
        }

        // Log successful audit event
        await auditLogger.log({
          actor_id: actor.userId,
          actor_name: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
          entity_type: entityType,
          entity_id: entityId,
          action,
          metadata: {
            method: propertyKey,
            execution_time_ms: Date.now() - startTime,
            success: true
          },
          store_id: actor.storeId
        });

        return result;
      } catch (err) {
        error = err as Error;
        
        // Log error audit event
        await auditLogger.log({
          actor_id: actor.userId,
          actor_name: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
          entity_type: entityType,
          entity_id: args.length > 0 && typeof args[0] === 'string' ? args[0] : '',
          action,
          metadata: {
            method: propertyKey,
            execution_time_ms: Date.now() - startTime,
            success: false,
            error: error.message
          },
          store_id: actor.storeId
        });

        throw error;
      }
    };

    return descriptor;
  };
}

export function createAuditLogger(supabaseUrl: string, supabaseKey: string): AuditLogger {
  return new SupabaseAuditLogger(supabaseUrl, supabaseKey);
}