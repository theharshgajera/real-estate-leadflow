import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

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
  assigned_to: string;
  profiles?: { full_name: string };
}

interface User {
  id: string;
  full_name: string;
}

interface ExportFilters {
  status: string;
  quality: string;
  city: string;
  assigned_to: string;
  date_from: string;
  date_to: string;
  what_to_buy: string;
  budget_min: string;
  budget_max: string;
}

interface DataExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DataExportDialog = ({ isOpen, onOpenChange }: DataExportDialogProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    status: 'all',
    quality: 'all',
    city: 'all',
    assigned_to: 'all',
    date_from: '',
    date_to: '',
    what_to_buy: 'all',
    budget_min: '',
    budget_max: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'user');

      // Fetch unique cities
      const { data: citiesData } = await supabase
        .from('leads')
        .select('city')
        .not('city', 'is', null);

      setUsers(usersData || []);
      const uniqueCities = [...new Set(citiesData?.map(lead => lead.city))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles:assigned_to(full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status as 'new' | 'assigned' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'converted' | 'lost');
      }
      if (filters.quality !== 'all') {
        query = query.eq('quality', filters.quality as 'hot' | 'warm' | 'cold');
      }
      if (filters.city !== 'all') {
        query = query.eq('city', filters.city);
      }
      if (filters.assigned_to !== 'all') {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
      }
      if (filters.what_to_buy !== 'all') {
        query = query.ilike('what_to_buy', `%${filters.what_to_buy}%`);
      }

      const { data: leads, error } = await query;

      if (error) throw error;

      if (!leads || leads.length === 0) {
        toast({ title: 'No data found with the selected filters', variant: 'destructive' });
        return;
      }

      // Convert to CSV
      const csvContent = generateCSV(leads);
      downloadCSV(csvContent, 'leads_export.csv');

      toast({ title: `Successfully exported ${leads.length} leads` });
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({ title: 'Error exporting data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (leads: Lead[]) => {
    const headers = [
      'Name', 'Email', 'Mobile', 'City', 'Status', 'Quality', 
      'What to Buy', 'Budget', 'Professional Background', 'Notes',
      'Follow-up Date', 'Buying Date', 'Assigned To', 'Created At'
    ];

    const rows = leads.map(lead => [
      lead.name,
      lead.email || '',
      lead.mobile,
      lead.city,
      lead.status,
      lead.quality || '',
      lead.what_to_buy || '',
      lead.budget || '',
      lead.professional_background || '',
      lead.notes || '',
      lead.followup_date || '',
      lead.buying_date || '',
      lead.profiles?.full_name || 'Unassigned',
      format(new Date(lead.created_at), 'yyyy-MM-dd')
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Leads Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Export Options</h4>
            <p className="text-sm text-blue-700">
              Apply filters to export specific lead data. All selected data will be exported as a CSV file.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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
              <Label>Quality</Label>
              <Select value={filters.quality} onValueChange={(value) => setFilters({...filters, quality: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Qualities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Qualities</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>City</Label>
              <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned To</Label>
              <Select value={filters.assigned_to} onValueChange={(value) => setFilters({...filters, assigned_to: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              />
            </div>

            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              />
            </div>

            <div>
              <Label>What to Buy</Label>
              <Select value={filters.what_to_buy} onValueChange={(value) => setFilters({...filters, what_to_buy: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="1 BHK">1 BHK</SelectItem>
                  <SelectItem value="2 BHK">2 BHK</SelectItem>
                  <SelectItem value="3 BHK">3 BHK</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Plot">Plot</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Budget Range</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min (Lakhs)"
                  value={filters.budget_min}
                  onChange={(e) => setFilters({...filters, budget_min: e.target.value})}
                />
                <Input
                  placeholder="Max (Lakhs)"
                  value={filters.budget_max}
                  onChange={(e) => setFilters({...filters, budget_max: e.target.value})}
                />
              </div>
            </div>
          </div>

          <Button onClick={exportData} disabled={loading} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exporting...' : 'Export to CSV'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataExportDialog;