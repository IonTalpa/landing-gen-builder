import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { config } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = path.join(config.uploads.dir, filePath);

    // Security check: ensure the file is within the uploads directory
    const normalizedPath = path.normalize(fullPath);
    const uploadsDir = path.normalize(config.uploads.dir);
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(normalizedPath);
    
    // Determine content type
    const ext = path.extname(normalizedPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}