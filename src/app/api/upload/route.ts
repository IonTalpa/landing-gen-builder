import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { saveUploadedFile, FileUploadError } from '@/lib/upload';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const uploadSchema = z.object({
  projectSlug: z.string().min(1, 'Project slug is required'),
  type: z.enum(['logo', 'hero', 'gallery'], { required_error: 'Upload type is required' }),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectSlug = formData.get('projectSlug') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate input
    const { projectSlug: validatedSlug, type: validatedType } = uploadSchema.parse({
      projectSlug,
      type,
    });

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { slug: validatedSlug },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Set upload options based on type
    let uploadOptions = {};
    
    switch (validatedType) {
      case 'logo':
        uploadOptions = {
          maxSize: 5 * 1024 * 1024, // 5MB for logos
          allowedTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
          stripExif: true,
        };
        break;
      case 'hero':
        uploadOptions = {
          maxSize: 10 * 1024 * 1024, // 10MB for hero images
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          stripExif: true,
        };
        break;
      case 'gallery':
        uploadOptions = {
          maxSize: 8 * 1024 * 1024, // 8MB for gallery images
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          stripExif: true,
        };
        break;
    }

    // Save the uploaded file
    const uploadResult = await saveUploadedFile(
      file,
      validatedSlug,
      validatedType,
      uploadOptions
    );

    // Update the database based on upload type
    if (validatedType === 'logo') {
      await prisma.brand.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          logoPath: uploadResult.path,
          palette: [],
          headingFont: {},
          bodyFont: {},
        },
        update: {
          logoPath: uploadResult.path,
        },
      });
    } else if (validatedType === 'hero') {
      await prisma.assets.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          heroPath: uploadResult.path,
          galleryPaths: [],
        },
        update: {
          heroPath: uploadResult.path,
        },
      });
    } else if (validatedType === 'gallery') {
      // For gallery images, append to the array
      const existingAssets = await prisma.assets.findUnique({
        where: { projectId: project.id },
      });

      const currentGalleryPaths = Array.isArray(existingAssets?.galleryPaths) 
        ? existingAssets.galleryPaths 
        : [];

      await prisma.assets.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          galleryPaths: [uploadResult.path],
        },
        update: {
          galleryPaths: [...currentGalleryPaths, uploadResult.path],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    if (error instanceof FileUploadError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Handle file serving
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'File path required' },
        { status: 400 }
      );
    }

    // This endpoint would serve static files
    // In a production environment, you'd typically use a CDN or nginx
    return NextResponse.json({
      success: false,
      error: 'File serving should be handled by static file server',
    });

  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}