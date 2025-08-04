import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Auto-redirect authenticated users to store dashboard
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        navigate('/store/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [navigate, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ERP Store Management</CardTitle>
          <p className="text-muted-foreground">
            Comprehensive store management system
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <Button 
                onClick={() => navigate('/store/dashboard')} 
                className="w-full"
              >
                Enter Store Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Welcome back! Redirecting in 2 seconds...
                </p>
              </div>
            </>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Login to Continue
                <LogIn className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Please sign in to access the store management system
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
