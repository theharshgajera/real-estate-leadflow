import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, CheckCircle, Calendar } from 'lucide-react';

interface Task {
  id: string;
  task_type: string;
  task_date: string;
  task_time: string;
  completed: boolean;
  created_at: string;
  lead_id: string;
  leads?: {
    name: string;
    mobile: string;
    city: string;
  };
}

interface Lead {
  id: string;
  name: string;
  mobile: string;
  city: string;
}

const UserTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    task_type: '',
    task_date: new Date().toISOString().split('T')[0],
    task_time: '',
    lead_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchMyLeads();
    }
  }, [user, selectedDate]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads:lead_id(name, mobile, city)
        `)
        .eq('user_id', user.id)
        .eq('task_date', selectedDate)
        .order('task_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, mobile, city')
        .eq('assigned_to', user.id)
        .neq('status', 'converted')
        .neq('status', 'lost');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const createTask = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          user_id: user.id
        }]);

      if (error) throw error;

      toast({ title: 'Task created successfully' });
      setIsCreateOpen(false);
      setNewTask({
        task_type: '',
        task_date: new Date().toISOString().split('T')[0],
        task_time: '',
        lead_id: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error creating task', variant: 'destructive' });
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
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error updating task', variant: 'destructive' });
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  if (loading) {
    return <div className="text-center py-8">Loading your tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Today's Tasks</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task_type">Task Type</Label>
                <Select value={newTask.task_type} onValueChange={(value) => setNewTask({...newTask, task_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="site_visit">Site Visit</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lead_id">Related Lead</Label>
                <Select value={newTask.lead_id} onValueChange={(value) => setNewTask({...newTask, lead_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="task_date">Date</Label>
                <Input
                  id="task_date"
                  type="date"
                  value={newTask.task_date}
                  onChange={(e) => setNewTask({...newTask, task_date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="task_time">Time</Label>
                <Input
                  id="task_time"
                  type="time"
                  value={newTask.task_time}
                  onChange={(e) => setNewTask({...newTask, task_time: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={createTask} className="w-full">Create Task</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Label htmlFor="date">Select Date:</Label>
        <Input
          id="date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
        <div className="text-sm text-muted-foreground">
          {pendingTasks.length} pending, {completedTasks.length} completed
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Tasks ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No pending tasks for this date
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                      />
                      <CardTitle className="text-base">{task.task_type.replace('_', ' ')}</CardTitle>
                      <Badge variant="outline">{formatTime(task.task_time)}</Badge>
                    </div>
                  </div>
                  {task.leads && (
                    <CardDescription>
                      {task.leads.name} - {task.leads.mobile} - {task.leads.city}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Completed Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Completed Tasks ({completedTasks.length})
          </h2>
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No completed tasks for this date
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <Card key={task.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                      />
                      <CardTitle className="text-base line-through">{task.task_type.replace('_', ' ')}</CardTitle>
                      <Badge variant="outline">{formatTime(task.task_time)}</Badge>
                    </div>
                  </div>
                  {task.leads && (
                    <CardDescription>
                      {task.leads.name} - {task.leads.mobile} - {task.leads.city}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTasks;