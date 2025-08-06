import { Card, CardContent } from '@/components/ui/card';
import { ResetSuccess } from '../components/ResetSuccess';

export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <ResetSuccess />
        </CardContent>
      </Card>
    </div>
  );
}