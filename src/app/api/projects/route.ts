import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  sector: z.string().optional(),
  locale: z.string().default('tr'),
  styleTags: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const projects = await prisma.project.findMany({
      include: {
        brand: true,
        assets: true,
        content: true,
        layout: true,
        _count: {
          select: {
            generated: true,
            exports: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { name, sector, locale, styleTags } = createProjectSchema.parse(body);

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug: finalSlug,
        sector,
        locale,
        styleTags,
        brand: {
          create: {
            palette: [
              { slug: 'primary', color: '#3b82f6', locked: false, source: 'user' },
              { slug: 'secondary', color: '#10b981', locked: false, source: 'user' },
              { slug: 'accent', color: '#f59e0b', locked: false, source: 'user' },
              { slug: 'neutral', color: '#6b7280', locked: false, source: 'user' },
            ],
            headingFont: {
              family: 'Inter',
              weights: [400, 600, 700],
              fallback: 'system-ui, sans-serif',
            },
            bodyFont: {
              family: 'System UI',
              weights: [400, 500],
              fallback: 'system-ui, -apple-system, sans-serif',
            },
          },
        },
        content: {
          create: {
            benefits: [],
            contact: {},
          },
        },
        layout: {
          create: {
            sections: ['header', 'hero', 'benefits', 'about', 'contact', 'footer'],
          },
        },
      },
      include: {
        brand: true,
        assets: true,
        content: true,
        layout: true,
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}