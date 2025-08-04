import React from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StorePageStubProps {
  title: string;
  description: string;
  breadcrumbs: Array<{ title: string; href?: string }>;
  features?: string[];
  mockData?: React.ReactNode;
}

export function StorePageStub({ 
  title, 
  description, 
  breadcrumbs, 
  features = [], 
  mockData 
}: StorePageStubProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>UI Components</span>
                <span className="text-success font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>API Integration</span>
                <span className="text-warning font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Business Logic</span>
                <span className="text-muted-foreground font-medium">Planned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mockData && (
        <Card>
          <CardHeader>
            <CardTitle>Mock Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {mockData}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Development Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              This page is a placeholder stub ready for implementation. The layout, 
              navigation, and basic components are in place.
            </p>
            <p>
              <strong>Next steps:</strong> Implement the specific business logic, 
              connect to APIs, and add the detailed functionality for this module.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}