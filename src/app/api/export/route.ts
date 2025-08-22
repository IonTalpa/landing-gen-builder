import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateWordPressTheme, ExportError } from '@/lib/export';
import type { GeneratedTheme } from '@/types';
import { z } from 'zod';

const exportSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  includeAssets: z.boolean().optional().default(true),
  stripExif: z.boolean().optional().default(true),
  validateContent: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { projectId, includeAssets, stripExif, validateContent } = exportSchema.parse(body);

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: true,
        assets: true,
        content: true,
        layout: true,
        generated: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.generated || project.generated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No theme generated yet. Please generate a theme first.' },
        { status: 400 }
      );
    }

    const latestGeneration = project.generated[0];
    const theme: GeneratedTheme = {
      themeJson: latestGeneration.themeJson as any,
      patterns: latestGeneration.patterns as any,
      templateFront: latestGeneration.templateFront,
    };

    // Generate WordPress theme ZIP
    const startTime = Date.now();
    const exportResult = await generateWordPressTheme(theme, project, {
      includeAssets,
      stripExif,
      validateContent,
    });
    const exportTime = Date.now() - startTime;

    // Store export record
    const exportRecord = await prisma.export.create({
      data: {
        projectId: project.id,
        kind: 'WP_THEME',
        zipPath: exportResult.zipPath,
        sizeKB: exportResult.sizeKB,
        checksum: exportResult.checksum,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        export: exportRecord,
        downloadUrl: exportResult.downloadUrl,
        themeInfo: exportResult.themeInfo,
        sizeKB: exportResult.sizeKB,
        checksum: exportResult.checksum,
        exportTime,
      },
      message: 'WordPress theme exported successfully',
    });

  } catch (error) {
    if (error instanceof ExportError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code
        },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Export error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get export history for a project
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch export history
    const exports = await prisma.export.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 exports
    });

    return NextResponse.json({
      success: true,
      data: { exports },
    });

  } catch (error) {
    console.error('Get exports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch export history' },
      { status: 500 }
    );
  }
}"