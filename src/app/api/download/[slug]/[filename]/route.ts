import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; filename: string } }
) {
  try {
    await requireAuth();

    const { slug, filename } = params;
    
    // Security: validate filename
    if (!filename || filename.includes('..') || !filename.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    // Construct file path
    const filePath = path.join(config.exports.dir, slug, filename);
    const normalizedPath = path.normalize(filePath);
    const exportsDir = path.normalize(config.exports.dir);
    
    // Security: ensure file is within exports directory
    if (!normalizedPath.startsWith(exportsDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.promises.access(normalizedPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.promises.readFile(normalizedPath);
    const stats = await fs.promises.stat(normalizedPath);
    
    // Set appropriate headers for ZIP download
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
      'Content-Length': stats.size.toString(),
      'Cache-Control': 'private, no-cache',
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}"