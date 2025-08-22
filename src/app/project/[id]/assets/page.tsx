'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssetsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assets Management</CardTitle>
          <CardDescription>
            Upload and manage your images and media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Assets management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}