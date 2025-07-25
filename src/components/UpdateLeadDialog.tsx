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
    name: '',
    email: '',
    mobile: '',
    city: '',
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
        name: lead.name || '',
        email: lead.email || '',
        mobile: lead.mobile || '',
        city: lead.city || '',
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
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          city: formData.city,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Lead Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Lead Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Lead Progress Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Lead Progress</h3>
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
            </div>
          </div>

          {/* Requirements & Additional Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Requirements & Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fill these details when contacting the lead during the "In Progress" stage
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="what_to_buy">What to Buy</Label>
                <Input
                  id="what_to_buy"
                  value={formData.what_to_buy}
                  onChange={(e) => setFormData({...formData, what_to_buy: e.target.value})}
                  placeholder="e.g., 2 BHK, 3 BHK, Villa"
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="e.g., 50 Lakhs, 1 Crore"
                />
              </div>
              <div>
                <Label htmlFor="buying_date">Expected Buying Date</Label>
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
                  placeholder="e.g., Software Engineer, Doctor, Business Owner"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Add any additional notes about the lead..."
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button onClick={handleUpdate} className="w-full mt-6">
          Update Lead
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateLeadDialog;