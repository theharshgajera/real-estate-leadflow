import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit, Calendar, Search, Phone, Mail, MapPin, CalendarPlus } from 'lucide-react';
import SiteVisitScheduleDialog from '@/components/SiteVisitScheduleDialog';
import UpdateLeadDialog from '@/components/UpdateLeadDialog';

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
  const [isSiteVisitOpen, setIsSiteVisitOpen] = useState(false);
  const { toast } = useToast();

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
    setIsUpdateOpen(true);
  };

  const handleStatusChange = (lead: Lead, newStatus: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost') => {
    if (newStatus === 'site_visit_scheduled') {
      setSelectedLead(lead);
      setIsSiteVisitOpen(true);
    } else {
      updateLeadStatus(lead.id, newStatus);
    }
  };

  const updateLeadStatus = async (leadId: string, status: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: 'Lead status updated' });
      fetchMyLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({ title: 'Error updating lead status', variant: 'destructive' });
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
                
                <div className="space-y-2">
                  <p><strong>Notes:</strong> {lead.notes || 'No notes added'}</p>
                  {lead.followup_date && (
                    <p><strong>Follow-up Date:</strong> {new Date(lead.followup_date).toLocaleDateString()}</p>
                  )}
                  {lead.buying_date && (
                    <p><strong>Expected Buying Date:</strong> {new Date(lead.buying_date).toLocaleDateString()}</p>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUpdateDialog(lead)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Lead
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsSiteVisitOpen(true);
                    }}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule Visit
                  </Button>
                  
                  <Select onValueChange={(status: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost') => handleStatusChange(lead, status)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="site_visit_scheduled">Site Visit Scheduled</SelectItem>
                      <SelectItem value="site_visit_done">Site Visit Done</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UpdateLeadDialog
        lead={selectedLead}
        isOpen={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        onUpdateComplete={fetchMyLeads}
      />

      <SiteVisitScheduleDialog
        leadId={selectedLead?.id || null}
        leadName={selectedLead?.name || ''}
        isOpen={isSiteVisitOpen}
        onOpenChange={setIsSiteVisitOpen}
        onScheduleComplete={fetchMyLeads}
      />
    </div>
  );
};

export default UserLeads;