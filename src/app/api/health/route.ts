import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if uploads directory is writable
    const fs = await import('fs');
    const path = await import('path');
    const { config } = await import('@/lib/config');
    
    try {
      await fs.promises.access(config.uploads.dir, fs.constants.W_OK);
    } catch (error) {
      throw new Error('Uploads directory not writable');
    }

    // Check if exports directory is writable
    try {
      await fs.promises.access(config.exports.dir, fs.constants.W_OK);
    } catch (error) {
      throw new Error('Exports directory not writable');
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        uploads: 'ok',
        exports: 'ok',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}