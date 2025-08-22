import { z } from 'zod';
import type { 
  Project, 
  ColorToken, 
  ThemeJson, 
  BlockPattern, 
  GeneratedTheme 
} from '@/types';
import { config } from './config';

// WCAG contrast calculation
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

export function adjustLightnessForContrast(
  color: string, 
  background: string, 
  targetRatio: number = 4.5
): string {
  const currentRatio = getContrastRatio(color, background);
  if (currentRatio >= targetRatio) return color;
  
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  let { r, g, b } = rgb;
  const bgLuminance = getLuminance(background);
  
  // Try making it darker first
  for (let factor = 0.9; factor > 0.1; factor -= 0.1) {
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    const newColor = rgbToHex(newR, newG, newB);
    
    if (getContrastRatio(newColor, background) >= targetRatio) {
      return newColor;
    }
  }
  
  // If darker doesn't work, try lighter
  for (let factor = 1.1; factor < 3; factor += 0.1) {
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    const newColor = rgbToHex(newR, newG, newB);
    
    if (getContrastRatio(newColor, background) >= targetRatio) {
      return newColor;
    }
  }
  
  // Fallback to high contrast
  return bgLuminance > 0.5 ? '#000000' : '#ffffff';
}

export function harmonizeColors(palette: ColorToken[], primaryColor: string): ColorToken[] {
  return palette.map(token => {
    if (token.locked) return token;
    
    // Keep primary as is, harmonize others
    if (token.slug === 'primary') {
      return { ...token, color: primaryColor };
    }
    
    const rgb = hexToRgb(token.color);
    if (!rgb) return token;
    
    // Apply subtle color harmony adjustments
    const primaryRgb = hexToRgb(primaryColor);
    if (!primaryRgb) return token;
    
    // Blend with primary color for harmony (10% blend)
    const newR = Math.round(rgb.r * 0.9 + primaryRgb.r * 0.1);
    const newG = Math.round(rgb.g * 0.9 + primaryRgb.g * 0.1);
    const newB = Math.round(rgb.b * 0.9 + primaryRgb.b * 0.1);
    
    return {
      ...token,
      color: rgbToHex(newR, newG, newB)
    };
  });
}

export function validateAndFixContrasts(palette: ColorToken[]): ColorToken[] {
  const background = palette.find(p => p.slug === 'background')?.color || '#ffffff';
  
  return palette.map(token => {
    if (token.locked) return token;
    
    // Check contrast for text colors
    if (token.slug === 'text' || token.slug.includes('text')) {
      const adjustedColor = adjustLightnessForContrast(token.color, background, 4.5);
      return { ...token, color: adjustedColor };
    }
    
    return token;
  });
}

export interface GenerationInput {
  project: Project;
  forceRegenerate?: boolean;
}

export async function generateWordPressTheme(input: GenerationInput): Promise<GeneratedTheme> {
  const { project } = input;
  
  // Process colors with harmony and contrast validation
  let palette = project.brand?.palette || [];
  const primaryColor = project.brand?.primary || '#3b82f6';
  
  // Harmonize colors around primary
  palette = harmonizeColors(palette, primaryColor);
  
  // Ensure WCAG compliance
  palette = validateAndFixContrasts(palette);
  
  // Generate theme.json
  const themeJson: ThemeJson = {
    version: 2,
    settings: {
      appearanceTools: true,
      color: {
        palette: palette.map(token => ({
          slug: token.slug,
          name: token.slug.charAt(0).toUpperCase() + token.slug.slice(1),
          color: token.color
        }))
      },
      typography: {
        fluid: true,
        fontFamilies: [
          {
            slug: "heading",
            name: project.brand?.headingFont?.family || "Inter",
            fontFamily: project.brand?.headingFont?.fallback || "Inter, system-ui, sans-serif"
          },
          {
            slug: "body",
            name: project.brand?.bodyFont?.family || "System UI",
            fontFamily: project.brand?.bodyFont?.fallback || "system-ui, -apple-system, sans-serif"
          }
        ],
        fontSizes: [
          { slug: "small", size: "14px", name: "Small" },
          { slug: "medium", size: "16px", name: "Medium" },
          { slug: "large", size: "20px", name: "Large" },
          { slug: "x-large", size: "32px", name: "Extra Large" },
          { slug: "xx-large", size: "48px", name: "XX Large" }
        ]
      },
      spacing: {
        units: ["px", "rem", "%", "vh", "vw"],
        spacingScale: {
          steps: 7
        }
      }
    },
    styles: {
      color: {
        background: palette.find(p => p.slug === 'background')?.color || '#ffffff',
        text: palette.find(p => p.slug === 'text')?.color || '#1f2937'
      },
      typography: {
        fontFamily: "var(--wp--preset--font-family--body)",
        fontSize: "var(--wp--preset--font-size--medium)"
      }
    }
  };
  
  // Generate block patterns
  const patterns = await generateBlockPatterns(project, palette);
  
  // Generate template
  const sections = project.layout?.sections || ['header', 'hero', 'benefits', 'about', 'contact', 'footer'];
  const templateFront = generateFrontPageTemplate(sections);
  
  return {
    themeJson,
    patterns,
    templateFront
  };
}

async function generateBlockPatterns(project: Project, palette: ColorToken[]): Promise<BlockPattern[]> {
  const headline = project.content?.headline || 'Welcome to Our Amazing Service';
  const cta = project.content?.cta || 'Get Started Today';
  const benefits = project.content?.benefits || [
    { title: 'Fast Performance', description: 'Optimized for speed and conversion' },
    { title: 'Mobile First', description: 'Responsive design that works everywhere' },
    { title: 'SEO Ready', description: 'Built with search engines in mind' }
  ];
  
  const primaryColor = palette.find(p => p.slug === 'primary')?.color || '#3b82f6';
  const heroImage = project.assets?.heroPath ? `/uploads/${project.assets.heroPath}` : '';
  
  return [
    {
      slug: 'header',
      title: 'Header',
      html: `<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group">
  <!-- wp:site-logo {"width":120} /-->
  <!-- wp:navigation {"overlayMenu":"mobile"} /-->
</div>
<!-- /wp:group -->`
    },
    {
      slug: 'hero',
      title: 'Hero Section',
      html: `<!-- wp:cover {"url":"${heroImage}","dimRatio":30,"customOverlayColor":"${primaryColor}","minHeight":600,"contentPosition":"center center","isDark":false} -->
<div class="wp-block-cover is-light" style="min-height:600px">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-30" style="background-color:${primaryColor}"></span>
  ${heroImage ? `<img class="wp-block-cover__image-background" alt="" src="${heroImage}" data-object-fit="cover"/>` : ''}
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"textAlign":"center","level":1,"fontSize":"xx-large"} -->
    <h1 class="has-text-align-center has-xx-large-font-size">${headline}</h1>
    <!-- /wp:heading -->
    
    <!-- wp:paragraph {"align":"center","fontSize":"large"} -->
    <p class="has-text-align-center has-large-font-size">Transform your business with our innovative solutions</p>
    <!-- /wp:paragraph -->
    
    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
      <!-- wp:button {"backgroundColor":"primary","textColor":"white","fontSize":"medium"} -->
      <div class="wp-block-button has-medium-font-size">
        <a class="wp-block-button__link has-white-color has-primary-background-color has-text-color has-background">${cta}</a>
      </div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
  </div>
</div>
<!-- /wp:cover -->`
    },
    {
      slug: 'benefits',
      title: 'Benefits Section',
      html: `<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px">
  <!-- wp:heading {"textAlign":"center","fontSize":"x-large"} -->
  <h2 class="has-text-align-center has-x-large-font-size">Why Choose Us</h2>
  <!-- /wp:heading -->
  
  <!-- wp:columns {"style":{"spacing":{"margin":{"top":"40px"}}}} -->
  <div class="wp-block-columns" style="margin-top:40px">
    ${benefits.slice(0, 3).map(benefit => `
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"textAlign":"center","level":3} -->
      <h3 class="has-text-align-center">${benefit.title}</h3>
      <!-- /wp:heading -->
      
      <!-- wp:paragraph {"align":"center"} -->
      <p class="has-text-align-center">${benefit.description}</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    `).join('')}
  </div>
  <!-- /wp:columns -->
</div>
<!-- /wp:group -->`
    },
    {
      slug: 'about',
      title: 'About Section',
      html: `<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"backgroundColor":"secondary","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-secondary-background-color has-background" style="padding-top:80px;padding-bottom:80px">
  <!-- wp:columns -->
  <div class="wp-block-columns">
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"fontSize":"x-large"} -->
      <h2 class="has-x-large-font-size">About Our Company</h2>
      <!-- /wp:heading -->
      
      <!-- wp:paragraph -->
      <p>We are dedicated to providing exceptional service and innovative solutions that help our clients achieve their goals. Our team of experts brings years of experience and a passion for excellence to every project.</p>
      <!-- /wp:paragraph -->
      
      <!-- wp:paragraph -->
      <p>Founded with the vision of making quality services accessible to businesses of all sizes, we continue to grow and evolve with the changing needs of our clients.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:image {"sizeSlug":"large"} -->
      <figure class="wp-block-image size-large">
        <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop" alt="Our team"/>
      </figure>
      <!-- /wp:image -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</div>
<!-- /wp:group -->`
    },
    {
      slug: 'contact',
      title: 'Contact Section',
      html: `<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px">
  <!-- wp:heading {"textAlign":"center","fontSize":"x-large"} -->
  <h2 class="has-text-align-center has-x-large-font-size">Get In Touch</h2>
  <!-- /wp:heading -->
  
  <!-- wp:columns {"style":{"spacing":{"margin":{"top":"40px"}}}} -->
  <div class="wp-block-columns" style="margin-top:40px">
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:paragraph {"align":"center"} -->
      <p class="has-text-align-center"><strong>Phone:</strong> ${project.content?.contact?.phone || '+1 (555) 123-4567'}</p>
      <!-- /wp:paragraph -->
      
      <!-- wp:paragraph {"align":"center"} -->
      <p class="has-text-align-center"><strong>Email:</strong> hello@example.com</p>
      <!-- /wp:paragraph -->
      
      <!-- wp:paragraph {"align":"center"} -->
      <p class="has-text-align-center"><strong>Address:</strong> ${project.content?.contact?.address || '123 Business Street, City, State 12345'}</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
      <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"primary","textColor":"white"} -->
        <div class="wp-block-button">
          <a class="wp-block-button__link has-white-color has-primary-background-color has-text-color has-background">Contact Us Today</a>
        </div>
        <!-- /wp:button -->
      </div>
      <!-- /wp:buttons -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</div>
<!-- /wp:group -->`
    },
    {
      slug: 'footer',
      title: 'Footer',
      html: `<!-- wp:group {"style":{"spacing":{"padding":{"top":"40px","bottom":"40px"}}},"backgroundColor":"neutral","textColor":"white","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-white-color has-neutral-background-color has-text-color has-background" style="padding-top:40px;padding-bottom:40px">
  <!-- wp:paragraph {"align":"center"} -->
  <p class="has-text-align-center">© 2024 ${project.name}. All rights reserved.</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`
    }
  ];
}

function generateFrontPageTemplate(sections: string[]): string {
  const sectionMap: Record<string, string> = {
    header: '<!-- wp:template-part {"slug":"header","area":"header"} /-->',
    hero: '<!-- wp:pattern {"slug":"hero"} /-->',
    benefits: '<!-- wp:pattern {"slug":"benefits"} /-->',
    about: '<!-- wp:pattern {"slug":"about"} /-->',
    services: '<!-- wp:pattern {"slug":"services"} /-->',
    contact: '<!-- wp:pattern {"slug":"contact"} /-->',
    footer: '<!-- wp:template-part {"slug":"footer","area":"footer"} /-->'
  };
  
  return sections
    .map(section => sectionMap[section] || `<!-- wp:pattern {"slug":"${section}"} /-->`)
    .join('\n');
}

// AI Integration
export async function generateWithAI(input: GenerationInput): Promise<GeneratedTheme> {
  if (!config.ai.enabled) {
    return generateDeterministicTheme(input);
  }
  
  try {
    const prompt = createAIPrompt(input.project);
    
    const response = await fetch(config.ai.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }
    
    // Parse AI response and validate
    const parsedTheme = parseAIResponse(aiResponse, input.project);
    return parsedTheme;
    
  } catch (error) {
    console.warn('AI generation failed, falling back to deterministic:', error);
    return generateDeterministicTheme(input);
  }
}

function getSystemPrompt(): string {
  return `You propose block theme JSON and Gutenberg block HTML. HARD RULES:
- Respect 'locked:true' values; never override them
- Use only core blocks (cover, group, columns, heading, paragraph, image, buttons, navigation, site-logo, site-title, site-tagline)
- Prefer theme.json tokens to custom CSS
- Output STRICT JSON matching the contract: {theme_json, patterns[], template_front}
- No comments mentioning AI/GPT. No provider names
- Keep copy concise, Turkish by default unless input says otherwise
- Ensure contrast ~ WCAG AA by small lightness adjustments ONLY on unlocked colors`;
}

function createAIPrompt(project: Project): string {
  return `Generate a WordPress block theme for: ${project.name}
Sector: ${project.sector || 'General'}
Language: ${project.locale}
Style tags: ${Array.isArray(project.styleTags) ? project.styleTags.join(', ') : 'modern'}

Brand colors: ${JSON.stringify(project.brand?.palette || [])}
Fonts: Heading - ${project.brand?.headingFont?.family || 'Inter'}, Body - ${project.brand?.bodyFont?.family || 'System UI'}

Content:
- Headline: ${project.content?.headline || 'Welcome'}
- Benefits: ${JSON.stringify(project.content?.benefits || [])}
- CTA: ${project.content?.cta || 'Get Started'}

Layout sections: ${JSON.stringify(project.layout?.sections || [])}

Return complete theme.json, patterns array, and template_front string.`;
}

function parseAIResponse(response: string, project: Project): GeneratedTheme {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and merge with locked colors
    const mergedTheme = mergeWithLockedColors(parsed, project);
    return mergedTheme;
    
  } catch (error) {
    console.warn('Failed to parse AI response:', error);
    return generateDeterministicTheme({ project });
  }
}

function mergeWithLockedColors(aiTheme: any, project: Project): GeneratedTheme {
  const lockedColors = project.brand?.palette?.filter(p => p.locked) || [];
  
  // Merge locked colors back into AI theme
  if (aiTheme.theme_json?.settings?.color?.palette && lockedColors.length > 0) {
    const aiPalette = aiTheme.theme_json.settings.color.palette;
    
    lockedColors.forEach(locked => {
      const existingIndex = aiPalette.findIndex((p: any) => p.slug === locked.slug);
      if (existingIndex >= 0) {
        aiPalette[existingIndex].color = locked.color;
      }
    });
  }
  
  return {
    themeJson: aiTheme.theme_json || {},
    patterns: aiTheme.patterns || [],
    templateFront: aiTheme.template_front || ''
  };
}

export function generateDeterministicTheme(input: GenerationInput): Promise<GeneratedTheme> {
  return Promise.resolve(generateWordPressTheme(input));
}