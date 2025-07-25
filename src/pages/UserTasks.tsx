import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  task_type: string;
  task_date: string;
  task_time: string;
  completed: boolean;
  lead_id: string;
  leads?: {
    name: string;
    email: string;
    mobile: string;
    city: string;
  };
}

interface SiteVisit {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  completed: boolean;
  lead_id: string;
  leads?: {
    name: string;
    email: string;
    mobile: string;
    city: string;
  };
}

interface FollowUpLead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: string;
  followup_date: string;
  notes: string;
}

const UserTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [followUpLeads, setFollowUpLeads] = useState<FollowUpLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchTodaysSiteVisits();
      fetchTodaysFollowUps();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads(name, email, mobile, city)
        `)
        .eq('user_id', user.id)
        .eq('task_date', today)
        .order('task_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysSiteVisits = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('site_visits')
        .select(`
          *,
          leads!inner(
            name, 
            email, 
            mobile, 
            city,
            assigned_to
          )
        `)
        .eq('leads.assigned_to', user.id)
        .in('scheduled_date', [today, tomorrowStr])
        .eq('completed', false)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setSiteVisits(data || []);
    } catch (error) {
      console.error('Error fetching site visits:', error);
    }
  };

  const fetchTodaysFollowUps = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, mobile, city, status, followup_date, notes')
        .eq('assigned_to', user.id)
        .eq('followup_date', today)
        .order('name', { ascending: true });

      if (error) throw error;
      setFollowUpLeads(data || []);
    } catch (error) {
      console.error('Error fetching follow-up leads:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: completed ? 'Task marked as incomplete' : 'Task completed!' });
      fetchTasks();
      fetchTodaysSiteVisits();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error updating task', variant: 'destructive' });
    }
  };

  const completeSiteVisit = async (siteVisitId: string) => {
    try {
      const { error } = await supabase
        .from('site_visits')
        .update({ completed: true })
        .eq('id', siteVisitId);

      if (error) throw error;

      // Update lead status to 'site_visit_done'
      const siteVisit = siteVisits.find(sv => sv.id === siteVisitId);
      if (siteVisit) {
        await supabase
          .from('leads')
          .update({ status: 'site_visit_done' })
          .eq('id', siteVisit.lead_id);
      }

      toast({ title: 'Site visit completed successfully!' });
      fetchTodaysSiteVisits();
    } catch (error) {
      console.error('Error completing site visit:', error);
      toast({ title: 'Error completing site visit', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Today's Tasks</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Follow-up Leads Section */}
      {followUpLeads.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
            <User className="h-5 w-5" />
            Follow-up Leads Today ({followUpLeads.length})
          </h2>
          <div className="grid gap-4">
            {followUpLeads.map((lead) => (
              <Card key={lead.id} className="border-blue-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-blue-800">{lead.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lead.city}
                        </span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-500">Follow-up</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Contact:</strong> {lead.mobile}
                      </div>
                      <div>
                        <strong>Email:</strong> {lead.email || 'Not provided'}
                      </div>
                    </div>
                    {lead.notes && (
                      <div className="text-sm">
                        <strong>Notes:</strong> {lead.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Site Visits Section */}
      {siteVisits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-800 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Site Visits Today & Tomorrow ({siteVisits.length})
          </h2>
          <div className="grid gap-4">
            {siteVisits.map((visit) => (
              <Card key={visit.id} className="border-purple-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-purple-800">{visit.leads?.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(visit.scheduled_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {visit.scheduled_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {visit.leads?.city}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-500">Site Visit</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Contact:</strong> {visit.leads?.mobile}
                      </div>
                      <div>
                        <strong>Email:</strong> {visit.leads?.email || 'Not provided'}
                      </div>
                    </div>
                    {visit.notes && (
                      <div className="text-sm">
                        <strong>Notes:</strong> {visit.notes}
                      </div>
                    )}
                    <Button 
                      onClick={() => completeSiteVisit(visit.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Site Visit Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular Tasks Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Other Tasks ({tasks.length})
        </h2>
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={task.completed ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={`text-lg ${task.completed ? 'line-through' : ''}`}>
                      {task.task_type.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.task_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.leads?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {task.leads?.city}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={task.completed ? "secondary" : "default"}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Contact:</strong> {task.leads?.mobile}
                    </div>
                    <div>
                      <strong>Email:</strong> {task.leads?.email || 'Not provided'}
                    </div>
                  </div>
                  <Button 
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                    variant={task.completed ? "outline" : "default"}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {tasks.length === 0 && siteVisits.length === 0 && followUpLeads.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tasks, site visits, or follow-ups scheduled for today.</p>
            </CardContent>
          </Card>
        )}
        {tasks.length === 0 && (siteVisits.length > 0 || followUpLeads.length > 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No other tasks scheduled for today.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserTasks;