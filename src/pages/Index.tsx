import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, Users, BarChart3, Calendar } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Building2,
      title: "Lead Management",
      description: "Comprehensive lead tracking from initial contact to conversion"
    },
    {
      icon: Users,
      title: "User Management", 
      description: "Manage your sales team with role-based access control"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights into your sales performance and metrics"
    },
    {
      icon: Calendar,
      title: "Task Scheduling",
      description: "Schedule site visits and follow-ups with integrated calendar"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-foreground">Real Estate CRM</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Manage Your Real Estate Leads
            <span className="block text-primary">Like Never Before</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline your real estate business with our comprehensive CRM system. 
            Track leads, schedule site visits, and convert prospects into customers efficiently.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started Today
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-lg border border-border bg-card">
                  <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
