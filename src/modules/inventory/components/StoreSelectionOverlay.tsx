import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface StoreOption {
  id: string;
  store_code: string;
  store_name: string;
  status: string;
}

interface StoreSelectionOverlayProps {
  onStoreSelect: (storeId: string) => void;
}

export function StoreSelectionOverlay({ onStoreSelect }: StoreSelectionOverlayProps) {
  const { t } = useTranslation();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, store_code, store_name, status')
          .eq('status', 'active')
          .order('store_name');

        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleSubmit = () => {
    if (selectedStoreId) {
      // Update URL with store selection
      const url = new URL(window.location.href);
      url.searchParams.set('storeId', selectedStoreId);
      window.history.replaceState({}, '', url.toString());
      
      onStoreSelect(selectedStoreId);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('inventory.storeSelection.title')}</CardTitle>
          <CardDescription>
            {t('inventory.storeSelection.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={selectedStoreId} 
            onValueChange={setSelectedStoreId}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.storeSelection.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_code} - {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedStoreId || loading}
            className="w-full"
          >
            {t('inventory.storeSelection.confirm')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}