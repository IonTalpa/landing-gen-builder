'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContentTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Configure your landing page content including headlines, benefits, and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Content management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}