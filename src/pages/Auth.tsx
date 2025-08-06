import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingOverlay } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { UserRole, ROLE_DISPLAY_NAMES } from '@/lib/types/auth';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('store_employee');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState<Array<{id: string, store_name: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in and load stores
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/store/dashboard');
        return;
      }

      // Load available stores for signup
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, store_name')
        .eq('status', 'active')
        .order('store_name');
      
      if (storesData) {
        setStores(storesData);
        if (storesData.length > 0) {
          setSelectedStore(storesData[0].id);
        }
      }
    };
    initializeAuth();
  }, [navigate]);

  // Cleanup auth state utility
  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out error (expected):', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        toast({
          title: 'Success',
          description: 'Successfully signed in!'
        });
        // Force page reload for clean state
        window.location.href = '/store/dashboard';
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Clean up existing state
      cleanupAuthState();

      const redirectUrl = `${window.location.origin}/store/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: selectedRole,
            store_id: (selectedRole === 'store_staff' || selectedRole === 'store_manager' || selectedRole === 'store_employee') ? selectedStore : null
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Create user role entry
        const roleData = {
          user_id: data.user.id,
          role: selectedRole,
          store_id: (selectedRole === 'store_staff' || selectedRole === 'store_manager' || selectedRole === 'store_employee') ? selectedStore : null,
          warehouse_id: selectedRole === 'warehouse_admin' ? null : null // Future warehouse support
        };

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([roleData]);

        if (roleError) {
          console.error('Error creating user role:', roleError);
          setError('Account created but role assignment failed. Please contact support.');
          return;
        }

        if (data.user.email_confirmed_at) {
          toast({
            title: 'Success',
            description: 'Account created successfully!'
          });
          window.location.href = '/store/dashboard';
        } else {
          toast({
            title: 'Check your email',
            description: 'Please check your email for a confirmation link.'
          });
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {loading && <LoadingOverlay />}
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">欢迎使用ERP系统</CardTitle>
          <CardDescription>
            登录或注册以访问销售订单管理系统
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">邮箱</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="signin-password">密码</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">姓名</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email">邮箱</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="signup-password">密码</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="role-select">角色</Label>
                  <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_employee">{ROLE_DISPLAY_NAMES.store_employee.zh}</SelectItem>
                      <SelectItem value="store_staff">{ROLE_DISPLAY_NAMES.store_staff.zh}</SelectItem>
                      <SelectItem value="store_manager">{ROLE_DISPLAY_NAMES.store_manager.zh}</SelectItem>
                      <SelectItem value="warehouse_admin">{ROLE_DISPLAY_NAMES.warehouse_admin.zh}</SelectItem>
                      <SelectItem value="hq_admin">{ROLE_DISPLAY_NAMES.hq_admin.zh}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedRole === 'store_staff' || selectedRole === 'store_manager' || selectedRole === 'store_employee') && (
                  <div>
                    <Label htmlFor="store-select">门店</Label>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择门店" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.store_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '注册中...' : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}