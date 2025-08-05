import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SalesOrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/store/sales-orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/store/sales-orders/${orderId}`);
    }
  };

  const handleBackToList = () => {
    navigate('/store/sales-orders');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-success">Order Created Successfully!</h1>
          {orderId && (
            <p className="text-muted-foreground">
              Order #{orderId} has been created and saved.
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-success/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Automatically returning to orders list in {countdown} seconds...
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {orderId && (
              <Button 
                onClick={handleViewOrder}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Order Details
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Orders List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}