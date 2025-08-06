import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          title: t('auth.success'),
          description: t('auth.signInSuccess')
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

    // Form validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (!fullName.trim()) {
      setError(t('auth.nameRequired'));
      setLoading(false);
      return;
    }

    // Role-based validation
    if ((selectedRole === 'store_staff' || selectedRole === 'store_manager' || selectedRole === 'store_employee') && !selectedStore) {
      setError(t('auth.storeRequired'));
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

      if (data.user && !data.user.email_confirmed_at) {
        // User created but needs email confirmation
        toast({
          title: t('auth.registrationSuccess'),
          description: t('auth.checkEmailToComplete'),
          duration: 10000,
        });
        
        // Clear form and show confirmation state
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setError(null);
        
        // Show confirmation message
        setError(t('auth.emailConfirmationRequired'));
      } else if (data.user && data.user.email_confirmed_at) {
        // User is already confirmed (shouldn't happen with email confirmation enabled)
        toast({
          title: t('auth.success'),
          description: t('auth.signUpSuccess')
        });
        window.location.href = '/store/dashboard';
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(`${t('auth.registrationFailed')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/store/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: t('auth.confirmationResent'),
          description: t('auth.checkEmailAgain')
        });
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
          <CardTitle className="text-2xl font-bold">{t('auth.welcome')}</CardTitle>
          <CardDescription>
            {t('auth.description')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
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
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
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
                  {loading ? t('auth.signingIn') : t('auth.signIn')}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => window.location.href = '/auth/request'}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">{t('auth.name')}</Label>
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
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
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
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
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
                  <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
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
                  <Label htmlFor="role-select">{t('auth.role')}</Label>
                  <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('auth.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_employee">{ROLE_DISPLAY_NAMES.store_employee.en}</SelectItem>
                      <SelectItem value="store_staff">{ROLE_DISPLAY_NAMES.store_staff.en}</SelectItem>
                      <SelectItem value="store_manager">{ROLE_DISPLAY_NAMES.store_manager.en}</SelectItem>
                      <SelectItem value="warehouse_admin">{ROLE_DISPLAY_NAMES.warehouse_admin.en}</SelectItem>
                      <SelectItem value="hq_admin">{ROLE_DISPLAY_NAMES.hq_admin.en}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedRole === 'store_staff' || selectedRole === 'store_manager' || selectedRole === 'store_employee') && (
                  <div>
                    <Label htmlFor="store-select">{t('auth.store')}</Label>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('auth.selectStore')} />
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
                    <AlertDescription>
                      {error}
                      {error.includes(t('auth.emailConfirmation')) && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendConfirmation}
                            disabled={loading}
                          >
                            {t('auth.resendConfirmation')}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('auth.signingUp') : t('auth.signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}