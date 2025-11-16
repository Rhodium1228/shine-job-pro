import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HandoffNotification {
  id: string;
  from_staff_id: string;
  to_staff_id: string;
  job_id: string;
  client_name: string;
  service: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

export const HandoffNotifications = () => {
  const [notifications, setNotifications] = useState<HandoffNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('handoff_notifications')
      .select('*')
      .or(`from_staff_id.eq.${user.id},to_staff_id.eq.${user.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading handoff notifications:', error);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('handoff-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handoff_notifications',
        },
        (payload) => {
          console.log('Handoff notification update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as HandoffNotification;
            setNotifications(prev => [newNotification, ...prev]);
            toast.info(`New job handoff request from ${newNotification.client_name}`);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as HandoffNotification;
            setNotifications(prev => 
              prev.map(n => n.id === updated.id ? updated : n)
                  .filter(n => n.status === 'pending')
            );
            
            if (updated.status === 'accepted') {
              toast.success(`Handoff accepted for ${updated.client_name}`);
            } else if (updated.status === 'rejected') {
              toast.error(`Handoff rejected for ${updated.client_name}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = async (notification: HandoffNotification) => {
    // Check receiver's status before accepting
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('availability_status')
      .eq('id', notification.to_staff_id)
      .single();

    if (receiverProfile?.availability_status === 'offline' || 
        receiverProfile?.availability_status === 'on_break') {
      toast.error('Cannot accept handoffs while offline or on break');
      return;
    }

    const { error } = await supabase
      .from('handoff_notifications')
      .update({ status: 'accepted' })
      .eq('id', notification.id);

    if (error) {
      toast.error('Failed to accept handoff');
      console.error(error);
      return;
    }

    // Update the active job to transfer ownership
    const { error: jobError } = await supabase
      .from('active_jobs')
      .update({ staff_id: notification.to_staff_id })
      .eq('id', notification.job_id);

    if (jobError) {
      toast.error('Failed to transfer job');
      console.error(jobError);
      return;
    }

    // Update receiver's status to busy
    await supabase
      .from('profiles')
      .update({ availability_status: 'busy' })
      .eq('id', notification.to_staff_id);

    // Update sender's status to available
    await supabase
      .from('profiles')
      .update({ availability_status: 'available' })
      .eq('id', notification.from_staff_id);

    toast.success('Job transferred successfully!');
  };

  const handleReject = async (notificationId: string) => {
    const { error } = await supabase
      .from('handoff_notifications')
      .update({ status: 'rejected' })
      .eq('id', notificationId);

    if (error) {
      toast.error('Failed to reject handoff');
      console.error(error);
      return;
    }
  };

  const handleCancel = async (notificationId: string) => {
    const { error } = await supabase
      .from('handoff_notifications')
      .update({ status: 'cancelled' })
      .eq('id', notificationId);

    if (error) {
      toast.error('Failed to cancel handoff');
      console.error(error);
      return;
    }
  };

  if (loading) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <ArrowRight className="w-5 h-5 text-primary" />
        Job Handoff Requests
      </h3>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
};

interface NotificationCardProps {
  notification: HandoffNotification;
  onAccept: (notification: HandoffNotification) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
}

const NotificationCard = ({ notification, onAccept, onReject, onCancel }: NotificationCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const isReceiver = currentUserId === notification.to_staff_id;

  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">{notification.client_name}</h4>
            <Badge variant="outline" className="ml-auto">
              {notification.service}
            </Badge>
          </div>
          {notification.message && (
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isReceiver ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onAccept(notification)}
                className="gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(notification.id)}
                className="gap-1"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(notification.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
