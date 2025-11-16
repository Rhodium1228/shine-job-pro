import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Loader2, User, Check, Search, Star, Clock, Coffee, WifiOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  clientName: string;
  service: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  availability_status: 'available' | 'busy' | 'on_break' | 'offline';
}

interface FavoriteStaff {
  favorite_staff_id: string;
}

const availabilityConfig = {
  available: { label: 'Available', icon: Check, color: 'text-success bg-success/20' },
  busy: { label: 'Busy', icon: Clock, color: 'text-warning bg-warning/20' },
  on_break: { label: 'On Break', icon: Coffee, color: 'text-info bg-info/20' },
  offline: { label: 'Offline', icon: WifiOff, color: 'text-muted-foreground bg-muted' },
};

export const HandoffDialog = ({ open, onOpenChange, jobId, clientName, service }: HandoffDialogProps) => {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadStaffMembers();
      loadFavorites();
    }
  }, [open]);

  const loadStaffMembers = async () => {
    setLoadingStaff(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, availability_status')
      .neq('id', user.id)
      .order('full_name');

    if (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff directory');
    } else {
      setStaffMembers((data || []) as StaffMember[]);
    }
    setLoadingStaff(false);
  };

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('favorite_staff')
      .select('favorite_staff_id')
      .eq('staff_id', user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.favorite_staff_id)));
    }
  };

  const toggleFavorite = async (staffId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFavorite = favorites.has(staffId);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorite_staff')
        .delete()
        .eq('staff_id', user.id)
        .eq('favorite_staff_id', staffId);

      if (error) {
        toast.error('Failed to remove favorite');
        return;
      }
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(staffId);
        return next;
      });
    } else {
      const { error } = await supabase
        .from('favorite_staff')
        .insert({ staff_id: user.id, favorite_staff_id: staffId });

      if (error) {
        toast.error('Failed to add favorite');
        return;
      }
      setFavorites(prev => new Set(prev).add(staffId));
    }
  };

  const filteredAndSortedStaff = useMemo(() => {
    let filtered = staffMembers;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(staff => 
        staff.full_name?.toLowerCase().includes(query) ||
        staff.email?.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then by availability, then by name
    return filtered.sort((a, b) => {
      const aIsFav = favorites.has(a.id);
      const bIsFav = favorites.has(b.id);
      
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      
      // Then sort by availability (available first)
      if (a.availability_status === 'available' && b.availability_status !== 'available') return -1;
      if (a.availability_status !== 'available' && b.availability_status === 'available') return 1;
      
      // Finally sort by name
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  }, [staffMembers, searchQuery, favorites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to transfer jobs');
        return;
      }

      // Create handoff notification
      const { error: handoffError } = await supabase
        .from('handoff_notifications')
        .insert({
          from_staff_id: user.id,
          to_staff_id: selectedStaffId,
          job_id: jobId,
          client_name: clientName,
          service: service,
          message: message.trim() || null,
          status: 'pending',
        });

      if (handoffError) {
        console.error('Error creating handoff:', handoffError);
        toast.error('Failed to create handoff request');
        return;
      }

      toast.success('Handoff request sent!');
      onOpenChange(false);
      setSelectedStaffId("");
      setMessage("");
    } catch (error) {
      console.error('Error in handoff:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Transfer Job
          </DialogTitle>
          <DialogDescription>
            Transfer "{clientName}" to another staff member
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Select Staff Member</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAndSortedStaff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'No staff members found' : 'No other staff members found'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px] pr-4">
                <RadioGroup value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <div className="space-y-2">
                    {filteredAndSortedStaff.map((staff) => {
                      const isFavorite = favorites.has(staff.id);
                      const statusConfig = availabilityConfig[staff.availability_status];
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <div
                          key={staff.id}
                          className="flex items-center gap-2"
                        >
                          <label
                            htmlFor={staff.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors flex-1",
                              isFavorite && "border-primary/50 bg-primary/5"
                            )}
                          >
                            <RadioGroupItem value={staff.id} id={staff.id} />
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={staff.avatar_url || undefined} />
                              <AvatarFallback>
                                {staff.full_name?.charAt(0) || staff.email?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                  {staff.full_name || 'Unnamed Staff'}
                                </p>
                                {isFavorite && (
                                  <Star className="w-3 h-3 fill-primary text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {staff.email}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={cn("mt-1 text-xs", statusConfig.color)}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            {selectedStaffId === staff.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => toggleFavorite(staff.id)}
                          >
                            <Star className={cn(
                              "w-4 h-4",
                              isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                            )} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any notes about this client or job..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStaffId || loadingStaff}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
