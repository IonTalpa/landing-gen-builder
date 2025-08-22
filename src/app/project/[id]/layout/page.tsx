'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LayoutTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Layout Configuration</CardTitle>
          <CardDescription>
            Arrange the order of sections on your landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Layout configuration coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}