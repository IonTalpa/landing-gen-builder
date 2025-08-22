import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateHTMLPreview, generateWordPressThemeZip } from '@/lib/preview';
import type { GeneratedTheme } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'html'; // 'html' or 'wp'

    // Fetch project with latest generation
    const project = await prisma.project.findUnique({
      where: { id: params.id },
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

    if (type === 'html') {
      // Generate HTML preview
      const preview = generateHTMLPreview(theme, project);
      
      return NextResponse.json({
        success: true,
        data: {
          html: preview.html,
          css: preview.css,
          generatedAt: latestGeneration.createdAt,
        },
      });
      
    } else if (type === 'wp') {
      // Generate WordPress theme ZIP
      const themeZip = await generateWordPressThemeZip(theme, project);
      
      // For WordPress Playground, we need to return the ZIP as base64
      const base64Zip = Buffer.from(themeZip).toString('base64');
      
      return NextResponse.json({
        success: true,
        data: {
          themeZip: base64Zip,
          themeName: `${project.slug}-landing`,
          playgroundUrl: 'https://playground.wordpress.net/?mode=seamless',
          generatedAt: latestGeneration.createdAt,
        },
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid preview type. Use \"html\" or \"wp\".' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Preview generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle WordPress Playground preview with theme upload
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const { action } = await request.json();

    if (action !== 'playground-setup') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Fetch project with latest generation
    const project = await prisma.project.findUnique({
      where: { id: params.id },
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

    if (!project || !project.generated?.length) {
      return NextResponse.json(
        { success: false, error: 'Project or theme not found' },
        { status: 404 }
      );
    }

    const latestGeneration = project.generated[0];
    const theme: GeneratedTheme = {
      themeJson: latestGeneration.themeJson as any,
      patterns: latestGeneration.patterns as any,
      templateFront: latestGeneration.templateFront,
    };

    // Generate WordPress theme ZIP
    const themeZip = await generateWordPressThemeZip(theme, project);
    const themeName = `${project.slug}-landing`;

    // Return setup instructions for WordPress Playground
    const setupInstructions = {
      steps: [
        {
          step: 'installTheme',
          themeData: {
            name: themeName,
            zipData: Buffer.from(themeZip).toString('base64'),
          },
        },
        {
          step: 'activateTheme',
          themeName: themeName,
        },
        {
          step: 'createPage',
          title: project.name,
          content: latestGeneration.templateFront,
          setAsFrontPage: true,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        setupInstructions,
        playgroundUrl: 'https://playground.wordpress.net/?mode=seamless',
        themeName,
      },
    });

  } catch (error) {
    console.error('WordPress Playground setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'WordPress Playground setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}"