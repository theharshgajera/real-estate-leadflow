import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock } from 'lucide-react';

interface SiteVisitScheduleDialogProps {
  leadId: string | null;
  leadName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleComplete: () => void;
}

const SiteVisitScheduleDialog = ({ leadId, leadName, isOpen, onOpenChange, onScheduleComplete }: SiteVisitScheduleDialogProps) => {
  const { toast } = useToast();
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  });

  const handleSchedule = async () => {
    if (!leadId || !scheduleData.scheduled_date || !scheduleData.scheduled_time) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      // Update lead status to site_visit_scheduled
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'site_visit_scheduled' })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Create site visit record
      const { error: siteVisitError } = await supabase
        .from('site_visits')
        .insert([{
          lead_id: leadId,
          scheduled_date: scheduleData.scheduled_date,
          scheduled_time: scheduleData.scheduled_time,
          notes: scheduleData.notes || null
        }]);

      if (siteVisitError) throw siteVisitError;

      toast({ title: 'Site visit scheduled successfully' });
      onScheduleComplete();
      onOpenChange(false);
      setScheduleData({ scheduled_date: '', scheduled_time: '', notes: '' });
    } catch (error) {
      console.error('Error scheduling site visit:', error);
      toast({ title: 'Error scheduling site visit', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Site Visit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Lead:</strong> {leadName}
            </p>
          </div>
          
          <div>
            <Label htmlFor="scheduled_date">Visit Date *</Label>
            <div className="relative">
              <Input
                id="scheduled_date"
                type="date"
                value={scheduleData.scheduled_date}
                onChange={(e) => setScheduleData({...scheduleData, scheduled_date: e.target.value})}
                className="pl-10"
                required
              />
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <Label htmlFor="scheduled_time">Visit Time *</Label>
            <div className="relative">
              <Input
                id="scheduled_time"
                type="time"
                value={scheduleData.scheduled_time}
                onChange={(e) => setScheduleData({...scheduleData, scheduled_time: e.target.value})}
                className="pl-10"
                required
              />
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={scheduleData.notes}
              onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
              placeholder="Add any special instructions..."
            />
          </div>

          <Button onClick={handleSchedule} className="w-full">
            Schedule Site Visit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiteVisitScheduleDialog;