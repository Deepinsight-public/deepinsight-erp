import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { RequestResetForm } from '../components/RequestResetForm';

export default function RequestResetPage() {
  const navigate = useNavigate();

  const handleSuccess = (email: string) => {
    navigate('/auth/request/sent', { state: { email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <RequestResetForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}