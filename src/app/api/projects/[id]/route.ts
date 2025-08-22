import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sector: z.string().optional(),
  locale: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
  brand: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    palette: z.array(z.object({
      slug: z.string(),
      color: z.string(),
      locked: z.boolean().optional(),
      source: z.enum(['user', 'logo_ai', 'manual']).optional(),
    })).optional(),
    headingFont: z.object({
      family: z.string(),
      weights: z.array(z.number()),
      fallback: z.string(),
    }).optional(),
    bodyFont: z.object({
      family: z.string(),
      weights: z.array(z.number()),
      fallback: z.string(),
    }).optional(),
    logoPath: z.string().optional(),
  }).optional(),
  content: z.object({
    headline: z.string().optional(),
    benefits: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).optional(),
    cta: z.string().optional(),
    contact: z.object({
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
  }).optional(),
  layout: z.object({
    sections: z.array(z.string()),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

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
        exports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            generated: true,
            exports: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project with nested data
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sector !== undefined && { sector: data.sector }),
        ...(data.locale && { locale: data.locale }),
        ...(data.styleTags && { styleTags: data.styleTags }),
        ...(data.brand && {
          brand: {
            upsert: {
              create: data.brand,
              update: data.brand,
            },
          },
        }),
        ...(data.content && {
          content: {
            upsert: {
              create: data.content,
              update: data.content,
            },
          },
        }),
        ...(data.layout && {
          layout: {
            upsert: {
              create: data.layout,
              update: data.layout,
            },
          },
        }),
      },
      include: {
        brand: true,
        assets: true,
        content: true,
        layout: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project (cascading will handle related records)
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}