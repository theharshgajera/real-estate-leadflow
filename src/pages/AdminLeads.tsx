import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, UserPlus, Upload, Edit, Download, Calendar, Trash2 } from 'lucide-react';
import BulkLeadUpload from '@/components/BulkLeadUpload';
import UpdateLeadDialog from '@/components/UpdateLeadDialog';
import DataExportDialog from '@/components/DataExportDialog';

interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: string;
  quality: string;
  assigned_to: string;
  created_at: string;
  profiles?: { full_name: string };
  site_visits?: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    notes: string;
    completed: boolean;
  }[];
}

interface User {
  id: string;
  full_name: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { toast } = useToast();

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    mobile: '',
    city: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles:assigned_to(full_name),
          site_visits(
            id,
            scheduled_date,
            scheduled_time,
            notes,
            completed
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'user');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createLead = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert([newLead]);

      if (error) throw error;

      toast({ title: 'Lead created successfully' });
      setIsCreateOpen(false);
      setNewLead({
        name: '',
        email: '',
        mobile: '',
        city: ''
      });
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({ title: 'Error creating lead', variant: 'destructive' });
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: userId, status: 'in_progress' })
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: 'Lead assigned successfully' });
      fetchLeads();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({ title: 'Error assigning lead', variant: 'destructive' });
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
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({ title: 'Error updating lead status', variant: 'destructive' });
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: 'Lead deleted successfully' });
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({ title: 'Error deleting lead', variant: 'destructive' });
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
      case 'converted': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Leads</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  value={newLead.mobile}
                  onChange={(e) => setNewLead({...newLead, mobile: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newLead.city}
                  onChange={(e) => setNewLead({...newLead, city: e.target.value})}
                  required
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Additional details can be added later when the lead is in progress.
            </p>
            <Button onClick={createLead} className="w-full">Create Lead</Button>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <BulkLeadUpload
        isOpen={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUploadComplete={fetchLeads}
      />

      <UpdateLeadDialog
        lead={selectedLead}
        isOpen={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        onUpdateComplete={fetchLeads}
      />

      <DataExportDialog
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
      />

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
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  <CardDescription>
                    {lead.email} • {lead.mobile} • {lead.city}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  {lead.quality && (
                    <Badge variant="outline">{lead.quality}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>What to buy:</strong> {(lead as any).what_to_buy || 'Not specified'}
                  </div>
                  <div>
                    <strong>Budget:</strong> {(lead as any).budget || 'Not specified'}
                  </div>
                  <div>
                    <strong>Background:</strong> {(lead as any).professional_background || 'Not specified'}
                  </div>
                  <div>
                    <strong>Assigned to:</strong> {lead.profiles?.full_name || 'Unassigned'}
                  </div>
                  {lead.status === 'site_visit_scheduled' && lead.site_visits && lead.site_visits.length > 0 && (
                    <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-2 text-purple-800 mb-2">
                        <Calendar className="h-4 w-4" />
                        <strong>Site Visit Scheduled</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-purple-700">
                        <div>
                          <strong>Date:</strong> {new Date(lead.site_visits[0].scheduled_date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong> {lead.site_visits[0].scheduled_time}
                        </div>
                        {lead.site_visits[0].notes && (
                          <div className="col-span-2">
                            <strong>Notes:</strong> {lead.site_visits[0].notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsUpdateOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Lead
                  </Button>
                  
                  <Select onValueChange={(userId) => assignLead(lead.id, userId)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign to user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={(status: 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost') => updateLeadStatus(lead.id, status)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Update status" />
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

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this lead? This action cannot be undone.
                          Lead: {lead.name} ({lead.email})
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteLead(lead.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Lead
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLeads;