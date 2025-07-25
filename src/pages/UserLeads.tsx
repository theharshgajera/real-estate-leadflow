import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: string;
  quality: string;
  what_to_buy: string;
  budget: string;
  professional_background: string;
  notes: string;
  followup_date: string;
  buying_date: string;
  created_at: string;
}

const UserLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { toast } = useToast();

  const [updateData, setUpdateData] = useState<{
    status: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost';
    quality: 'hot' | 'warm' | 'cold' | '';
    notes: string;
    followup_date: string;
    buying_date: string;
  }>({
    status: 'new',
    quality: '',
    notes: '',
    followup_date: '',
    buying_date: ''
  });

  useEffect(() => {
    if (user) {
      fetchMyLeads();
    }
  }, [user]);

  const fetchMyLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setUpdateData({
      status: lead.status as 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost',
      quality: (lead.quality as 'hot' | 'warm' | 'cold') || '',
      notes: lead.notes || '',
      followup_date: lead.followup_date || '',
      buying_date: lead.buying_date || ''
    });
    setIsUpdateOpen(true);
  };

  const updateLead = async () => {
    if (!selectedLead) return;

    try {
      const updatePayload = {
        ...updateData,
        quality: updateData.quality === '' ? null : updateData.quality
      };
      
      const { error } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', selectedLead.id);

      if (error) throw error;

      toast({ title: 'Lead updated successfully' });
      setIsUpdateOpen(false);
      setSelectedLead(null);
      fetchMyLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({ title: 'Error updating lead', variant: 'destructive' });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'site_visit_scheduled': return 'bg-purple-500';
      case 'site_visit_done': return 'bg-indigo-500';
      case 'converted': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'cold': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Leads</h1>
        <div className="text-sm text-muted-foreground">
          Total: {leads.length} leads
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="site_visit_scheduled">Site Visit Scheduled</SelectItem>
            <SelectItem value="site_visit_done">Site Visit Done</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lead.city}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  {lead.quality && (
                    <Badge className={getQualityColor(lead.quality)}>
                      {lead.quality}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>What to buy:</strong> {lead.what_to_buy || 'Not specified'}
                  </div>
                  <div>
                    <strong>Budget:</strong> {lead.budget || 'Not specified'}
                  </div>
                  <div>
                    <strong>Background:</strong> {lead.professional_background || 'Not specified'}
                  </div>
                  <div>
                    <strong>Added:</strong> {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                  {lead.followup_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <strong>Follow-up:</strong> {new Date(lead.followup_date).toLocaleDateString()}
                    </div>
                  )}
                  {lead.buying_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <strong>Expected purchase:</strong> {new Date(lead.buying_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {lead.notes && (
                  <div className="text-sm">
                    <strong>Notes:</strong> {lead.notes}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => openUpdateDialog(lead)} variant="outline">
                    Update Lead
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Lead: {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={updateData.status} onValueChange={(value: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost') => setUpdateData({...updateData, status: value})}>
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
              <Select value={updateData.quality || undefined} onValueChange={(value: 'hot' | 'warm' | 'cold' | '') => setUpdateData({...updateData, quality: value})}>
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
              <Label htmlFor="followup_date">Follow-up Date</Label>
              <Input
                id="followup_date"
                type="date"
                value={updateData.followup_date}
                onChange={(e) => setUpdateData({...updateData, followup_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="buying_date">Expected Purchase Date</Label>
              <Input
                id="buying_date"
                type="date"
                value={updateData.buying_date}
                onChange={(e) => setUpdateData({...updateData, buying_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateData.notes}
                onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                placeholder="Add notes about this lead..."
              />
            </div>
          </div>
          <Button onClick={updateLead} className="w-full">Update Lead</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserLeads;