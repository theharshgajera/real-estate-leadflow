import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: string;
  quality: string | null;
  what_to_buy: string | null;
  budget: string | null;
  professional_background: string | null;
  notes: string | null;
  buying_date: string | null;
  followup_date: string | null;
}

interface UpdateLeadDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateComplete: () => void;
}

const UpdateLeadDialog = ({ lead, isOpen, onOpenChange, onUpdateComplete }: UpdateLeadDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    status: 'new',
    quality: '',
    what_to_buy: '',
    budget: '',
    professional_background: '',
    notes: '',
    buying_date: '',
    followup_date: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        status: lead.status || 'new',
        quality: lead.quality || '',
        what_to_buy: lead.what_to_buy || '',
        budget: lead.budget || '',
        professional_background: lead.professional_background || '',
        notes: lead.notes || '',
        buying_date: lead.buying_date || '',
        followup_date: lead.followup_date || ''
      });
    }
  }, [lead]);

  const handleUpdate = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: formData.status as 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost',
          quality: formData.quality ? (formData.quality as 'hot' | 'warm' | 'cold') : null,
          what_to_buy: formData.what_to_buy || null,
          budget: formData.budget || null,
          professional_background: formData.professional_background || null,
          notes: formData.notes || null,
          buying_date: formData.buying_date || null,
          followup_date: formData.followup_date || null
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast({ title: 'Lead updated successfully' });
      onUpdateComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({ title: 'Error updating lead', variant: 'destructive' });
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Lead: {lead.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="site_visit_scheduled">Site Visit Scheduled</SelectItem>
                <SelectItem value="site_visit_done">Site Visit Done</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quality">Quality</Label>
            <Select value={formData.quality || undefined} onValueChange={(value) => setFormData({...formData, quality: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="what_to_buy">What to Buy</Label>
            <Input
              id="what_to_buy"
              value={formData.what_to_buy}
              onChange={(e) => setFormData({...formData, what_to_buy: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="buying_date">Buying Date</Label>
            <Input
              id="buying_date"
              type="date"
              value={formData.buying_date}
              onChange={(e) => setFormData({...formData, buying_date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="followup_date">Follow-up Date</Label>
            <Input
              id="followup_date"
              type="date"
              value={formData.followup_date}
              onChange={(e) => setFormData({...formData, followup_date: e.target.value})}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="professional_background">Professional Background</Label>
            <Input
              id="professional_background"
              value={formData.professional_background}
              onChange={(e) => setFormData({...formData, professional_background: e.target.value})}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
        </div>
        <Button onClick={handleUpdate} className="w-full">Update Lead</Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateLeadDialog;