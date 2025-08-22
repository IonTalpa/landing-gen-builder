import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateWithAI } from '@/lib/theme-generator';
import { z } from 'zod';

const generateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  forceRegenerate: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { projectId, forceRegenerate } = generateSchema.parse(body);

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

    // Check if we should regenerate
    const hasExistingGeneration = project.generated.length > 0;
    if (hasExistingGeneration && !forceRegenerate) {
      const existing = project.generated[0];
      return NextResponse.json({
        success: true,
        data: {
          generated: existing,
          isFromCache: true,
        },
        message: 'Using existing generation. Use forceRegenerate=true to create new.',
      });
    }

    // Generate new theme
    const startTime = Date.now();
    const generatedTheme = await generateWithAI({ 
      project, 
      forceRegenerate 
    });
    const generationTime = Date.now() - startTime;

    // Store generated theme
    const generated = await prisma.generated.create({
      data: {
        projectId: project.id,
        themeJson: generatedTheme.themeJson,
        patterns: generatedTheme.patterns,
        templateFront: generatedTheme.templateFront,
        meta: {
          generatedAt: new Date().toISOString(),
          generationTime,
          aiUsed: !!process.env.AI_API_KEY,
          lockedColors: project.brand?.palette?.filter(p => p.locked).length || 0,
          totalColors: project.brand?.palette?.length || 0,
          provenance: 'theme-generator',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        generated,
        preview: {
          html: await generatePreviewHTML(generatedTheme, project),
          css: generatePreviewCSS(generatedTheme.themeJson),
        },
        isFromCache: false,
        generationTime,
      },
      message: 'Theme generated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Theme generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Theme generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generatePreviewHTML(theme: any, project: any): Promise<string> {
  const { patterns, templateFront } = theme;
  
  // Extract section order from template
  const sections = templateFront.match(/slug":"([^"]+)"/g)?.map((match: string) => 
    match.replace('slug":"', '').replace('"', '')
  ) || [];

  // Combine patterns based on section order
  let combinedHTML = '';
  
  sections.forEach((sectionSlug: string) => {
    const pattern = patterns.find((p: any) => p.slug === sectionSlug);
    if (pattern) {
      combinedHTML += `\n${pattern.html}\n`;
    }
  });

  // If no sections found, combine all patterns
  if (!combinedHTML.trim()) {
    combinedHTML = patterns.map((p: any) => p.html).join('\n');
  }

  // Wrap in basic HTML structure
  return `
<!DOCTYPE html>
<html lang="${project.locale || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - Preview</title>
    <style id="theme-styles">
        /* Theme styles will be injected here */
    </style>
</head>
<body class="wp-block-group">
    ${combinedHTML}
</body>
</html>`.trim();
}

function generatePreviewCSS(themeJson: any): string {
  if (!themeJson?.settings) return '';

  const { color, typography, spacing } = themeJson.settings;
  let css = ':root {\n';

  // Color variables
  if (color?.palette) {
    color.palette.forEach((colorDef: any) => {
      css += `  --wp--preset--color--${colorDef.slug}: ${colorDef.color};\n`;
    });
  }

  // Font variables
  if (typography?.fontFamilies) {
    typography.fontFamilies.forEach((font: any) => {
      css += `  --wp--preset--font-family--${font.slug}: ${font.fontFamily};\n`;
    });
  }

  // Font size variables
  if (typography?.fontSizes) {
    typography.fontSizes.forEach((size: any) => {
      css += `  --wp--preset--font-size--${size.slug}: ${size.size};\n`;
    });
  }

  css += '}\n\n';

  // Base styles
  css += `
body {
  margin: 0;
  padding: 0;
  font-family: var(--wp--preset--font-family--body);
  font-size: var(--wp--preset--font-size--medium);
  line-height: 1.6;
  color: var(--wp--preset--color--text);
  background-color: var(--wp--preset--color--background);
}

.wp-block-group {
  box-sizing: border-box;
}

.wp-block-cover {
  position: relative;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  color: white;
}

.wp-block-cover__inner-container {
  text-align: center;
  max-width: 580px;
  margin: 0 auto;
  padding: 20px;
}

.wp-block-columns {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.wp-block-column {
  flex: 1;
  min-width: 250px;
}

.wp-block-button {
  display: inline-block;
  margin: 0.5rem;
}

.wp-block-button__link {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.has-primary-background-color {
  background-color: var(--wp--preset--color--primary) !important;
}

.has-secondary-background-color {
  background-color: var(--wp--preset--color--secondary) !important;
}

.has-white-color {
  color: white !important;
}

.has-text-align-center {
  text-align: center;
}

.has-x-large-font-size {
  font-size: var(--wp--preset--font-size--x-large);
}

.has-xx-large-font-size {
  font-size: var(--wp--preset--font-size--xx-large);
}

.has-large-font-size {
  font-size: var(--wp--preset--font-size--large);
}

.has-medium-font-size {
  font-size: var(--wp--preset--font-size--medium);
}

@media (max-width: 768px) {
  .wp-block-columns {
    flex-direction: column;
  }
}
`;

  return css;
}