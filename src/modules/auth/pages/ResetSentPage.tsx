import { useLocation, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ResetConfirmation } from '../components/ResetConfirmation';

export default function ResetSentPage() {
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return <Navigate to="/auth/request" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <ResetConfirmation email={email} />
        </CardContent>
      </Card>
    </div>
  );
}