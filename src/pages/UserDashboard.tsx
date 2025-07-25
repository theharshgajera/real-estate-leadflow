import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, TrendingUp, Clock } from 'lucide-react';

interface UserStats {
  assignedLeads: number;
  inProgressLeads: number;
  convertedLeads: number;
  todayTasks: number;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    assignedLeads: 0,
    inProgressLeads: 0,
    convertedLeads: 0,
    todayTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch assigned leads
      const { count: assignedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

      // Fetch in-progress leads
      const { count: inProgressLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'in_progress');

      // Fetch converted leads
      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'converted');

      // Fetch today's tasks
      const today = new Date().toISOString().split('T')[0];
      const { count: todayTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('task_date', today);

      setStats({
        assignedLeads: assignedLeads || 0,
        inProgressLeads: inProgressLeads || 0,
        convertedLeads: convertedLeads || 0,
        todayTasks: todayTasks || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Leads',
      value: stats.assignedLeads,
      icon: FileText,
      description: 'Total assigned leads',
    },
    {
      title: 'In Progress',
      value: stats.inProgressLeads,
      icon: Clock,
      description: 'Active leads',
    },
    {
      title: 'Converted',
      value: stats.convertedLeads,
      icon: TrendingUp,
      description: 'Successfully closed',
    },
    {
      title: "Today's Tasks",
      value: stats.todayTasks,
      icon: Calendar,
      description: 'Scheduled for today',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UserDashboard;