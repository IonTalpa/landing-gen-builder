import { z } from 'zod';
import type { Project, ChatMessage, ToolResult } from '@/types';
import { config } from './config';

// Function calling tools schema
const recommendPluginsSchema = z.object({
  sector: z.string().optional(),
  needs: z.array(z.string()).optional(),
});

const generateCopySchema = z.object({
  section: z.enum(['hero', 'benefits', 'about', 'services', 'contact']),
  tone: z.enum(['kurumsal', 'samimi', 'minimal']).optional(),
  bullets: z.number().optional(),
});

const a11yCheckSchema = z.object({
  themeJson: z.object({}).passthrough(),
  patterns: z.array(z.string()),
});

const paletteSuggestSchema = z.object({
  logoPath: z.string().optional(),
  primary: z.string().optional(),
  locked: z.array(z.object({ slug: z.string() })),
});

const wpPlaygroundLinkSchema = z.object({
  projectId: z.string(),
});

const exportWpThemeSchema = z.object({
  projectId: z.string(),
});

// Function calling tools
export const chatTools = {
  recommend_plugins: {
    description: 'Recommend WordPress plugins based on sector and needs',
    schema: recommendPluginsSchema,
    handler: async (input: z.infer<typeof recommendPluginsSchema>) => {
      const plugins = await recommendPlugins(input);
      return { plugins };
    }
  },
  
  generate_copy: {
    description: 'Generate copy content for specific sections',
    schema: generateCopySchema,
    handler: async (input: z.infer<typeof generateCopySchema>) => {
      const variants = await generateCopy(input);
      return { variants };
    }
  },
  
  a11y_check: {
    description: 'Check accessibility issues in theme',
    schema: a11yCheckSchema,
    handler: async (input: z.infer<typeof a11yCheckSchema>) => {
      const issues = await checkAccessibility(input);
      return { issues };
    }
  },
  
  palette_suggest: {
    description: 'Suggest color palette improvements',
    schema: paletteSuggestSchema,
    handler: async (input: z.infer<typeof paletteSuggestSchema>) => {
      const palette = await suggestPalette(input);
      return { palette };
    }
  },
  
  wp_playground_link: {
    description: 'Generate WordPress Playground preview link',
    schema: wpPlaygroundLinkSchema,
    handler: async (input: z.infer<typeof wpPlaygroundLinkSchema>) => {
      const result = await generatePlaygroundLink(input);
      return result;
    }
  },
  
  export_wp_theme: {
    description: 'Export WordPress theme ZIP',
    schema: exportWpThemeSchema,
    handler: async (input: z.infer<typeof exportWpThemeSchema>) => {
      const result = await exportWordPressTheme(input);
      return result;
    }
  },
};

// System prompt for the chat assistant
export const getChatSystemPrompt = (project?: Project): string => {
  return `You are a helpful WordPress theme assistant for Landing-Gen Builder.

You are helping a single developer (Aydın) create professional WordPress landing page themes.

Key capabilities:
- Provide WordPress development guidance
- Suggest content improvements
- Recommend relevant plugins
- Help with color palette decisions
- Accessibility recommendations
- Theme optimization tips

Important rules:
- Be concise and actionable in your responses
- Default to Turkish language unless user specifies otherwise
- NEVER mention AI, GPT, or generator tools in your suggestions
- Respect locked color tokens - never suggest changing them
- Focus on practical WordPress development advice
- Always ask for confirmation before making changes

${project ? `Current project context:
- Project: ${project.name}
- Sector: ${project.sector || 'Not specified'}
- Language: ${project.locale}
- Style tags: ${Array.isArray(project.styleTags) ? project.styleTags.join(', ') : 'None'}
` : ''}Use the available tools to help with specific tasks. Always explain what you're doing and ask for confirmation before applying changes.`;
};

// Tool implementations
async function recommendPlugins(input: typeof recommendPluginsSchema._type) {
  const { sector, needs = [] } = input;
  
  // Mock plugin recommendations based on sector and needs
  const pluginDatabase = {
    'Technology': [
      { slug: 'contact-form-7', name: 'Contact Form 7', why: 'Reliable contact forms', install: true },
      { slug: 'yoast-seo', name: 'Yoast SEO', why: 'SEO optimization', install: true },
      { slug: 'wp-super-cache', name: 'WP Super Cache', why: 'Performance optimization', install: true },
    ],
    'Healthcare': [
      { slug: 'appointment-booking', name: 'Appointment Booking', why: 'Patient scheduling', install: true },
      { slug: 'gdpr-compliance', name: 'GDPR Compliance', why: 'Data protection', install: true },
      { slug: 'testimonials-widget', name: 'Testimonials Widget', why: 'Patient reviews', install: false },
    ],
    'Business': [
      { slug: 'woocommerce', name: 'WooCommerce', why: 'E-commerce functionality', install: false },
      { slug: 'mailchimp-integration', name: 'Mailchimp Integration', why: 'Email marketing', install: true },
      { slug: 'google-analytics', name: 'Google Analytics', why: 'Traffic tracking', install: true },
    ],
  };
  
  const sectorPlugins = pluginDatabase[sector as keyof typeof pluginDatabase] || pluginDatabase['Business'];
  
  // Filter based on needs
  let recommendedPlugins = sectorPlugins;
  
  if (needs.includes('forms')) {
    recommendedPlugins = recommendedPlugins.filter(p => p.slug.includes('form') || p.slug.includes('contact'));
  }
  
  if (needs.includes('seo')) {
    recommendedPlugins = recommendedPlugins.filter(p => p.slug.includes('seo') || p.slug.includes('analytics'));
  }
  
  return recommendedPlugins.slice(0, 5); // Limit to 5 recommendations
}

async function generateCopy(input: typeof generateCopySchema._type) {
  const { section, tone = 'kurumsal', bullets = 3 } = input;
  
  // Mock copy generation based on section and tone
  const copyTemplates = {
    hero: {
      kurumsal: [
        'Profesyonel çözümlerimizle işinizi büyütün',
        'Güvenilir hizmet, başarıya giden yol',
        'Uzman ekibimizle hedeflerinize ulaşın',
      ],
      samimi: [
        'Hayalinizdeki projeyi birlikte gerçekleştirelim',
        'Sizin için en iyisini yapmak istiyoruz',
        'Beraber başarabileceğimize inanıyoruz',
      ],
      minimal: [
        'Basit. Etkili. Sonuç odaklı.',
        'Kalite, hız, güvenilirlik.',
        'Daha iyi bir gelecek için.',
      ],
    },
    benefits: {
      kurumsal: [
        'Endüstri lideri deneyim',
        '7/24 profesyonel destek',
        'Garanti kapsamında hizmet',
      ],
      samimi: [
        'Her adımda yanınızdayız',
        'Sizin memnuniyetiniz bizim önceliğimiz',
        'Aile gibi hissedeceksiniz',
      ],
      minimal: [
        'Hızlı çözüm',
        'Uygun fiyat',
        'Kaliteli sonuç',
      ],
    },
  };
  
  const sectionTemplates = copyTemplates[section as keyof typeof copyTemplates];
  if (!sectionTemplates) {
    return ['İçerik önerisi bulunamadı'];
  }
  
  const toneTemplates = sectionTemplates[tone as keyof typeof sectionTemplates] || sectionTemplates.kurumsal;
  return toneTemplates.slice(0, bullets);
}

async function checkAccessibility(input: typeof a11yCheckSchema._type) {
  const { themeJson, patterns } = input;
  
  const issues = [];
  
  // Check color contrast
  if (themeJson.settings?.color?.palette) {
    const palette = themeJson.settings.color.palette;
    const background = palette.find((c: any) => c.slug === 'background');
    const text = palette.find((c: any) => c.slug === 'text');
    
    if (background && text) {
      // Mock contrast check
      issues.push({
        severity: 'warning',
        where: 'Color palette',
        message: 'Text contrast may not meet WCAG AA standards',
        fix: 'Consider adjusting text or background colors for better contrast'
      });
    }
  }
  
  // Check for missing alt text
  patterns.forEach((pattern: string, index: number) => {
    if (pattern.includes('<img') && !pattern.includes('alt=')) {
      issues.push({
        severity: 'error',
        where: `Pattern ${index + 1}`,
        message: 'Images missing alt text',
        fix: 'Add descriptive alt text to all images'
      });
    }
  });
  
  // Check heading structure
  patterns.forEach((pattern: string, index: number) => {
    const h1Count = (pattern.match(/<h1/g) || []).length;
    if (h1Count > 1) {
      issues.push({
        severity: 'warning',
        where: `Pattern ${index + 1}`,
        message: 'Multiple H1 headings found',
        fix: 'Use only one H1 per page, use H2-H6 for subheadings'
      });
    }
  });
  
  return issues;
}

async function suggestPalette(input: typeof paletteSuggestSchema._type) {
  const { logoPath, primary, locked } = input;
  
  // Mock palette suggestions
  const suggestions = [
    { slug: 'primary', color: primary || '#3b82f6', reason: 'Current primary color' },
    { slug: 'secondary', color: '#10b981', reason: 'Complementary green for trust' },
    { slug: 'accent', color: '#f59e0b', reason: 'Warm accent for call-to-actions' },
    { slug: 'neutral', color: '#6b7280', reason: 'Neutral gray for balance' },
  ];
  
  // Filter out locked colors
  const lockedSlugs = locked.map(l => l.slug);
  return suggestions.filter(s => !lockedSlugs.includes(s.slug));
}

async function generatePlaygroundLink(input: typeof wpPlaygroundLinkSchema._type) {
  const { projectId } = input;
  
  const url = `${config.app.baseUrl}/preview/wp/${projectId}`;
  const expiresAt = new Date(Date.now() + config.preview.tokenExpiry * 1000);
  
  return {
    url,
    expiresAt: expiresAt.toISOString(),
  };
}

async function exportWordPressTheme(input: typeof exportWpThemeSchema._type) {
  const { projectId } = input;
  
  // This would integrate with the actual export system
  // For now, return mock data
  return {
    zipPath: `/exports/${projectId}/theme.zip`,
    sizeKB: 1024,
    checksum: 'abc123def456',
  };
}

// Chat message processing
export async function processChatMessage(
  messages: ChatMessage[],
  project?: Project
): Promise<{ message: ChatMessage; toolResults?: ToolResult[] }> {
  if (!config.ai.enabled) {
    return {
      message: {
        id: 'fallback',
        projectId: project?.id || null,
        role: 'ASSISTANT',
        content: 'AI assistant is not available. Please configure AI_API_KEY in your environment.',
        createdAt: new Date(),
      },
    };
  }
  
  const systemPrompt = getChatSystemPrompt(project);
  
  try {
    const response = await fetch(config.ai.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ 
            role: m.role.toLowerCase(), 
            content: m.content 
          })),
        ],
        tools: Object.entries(chatTools).map(([name, tool]) => ({
          type: 'function',
          function: {
            name,
            description: tool.description,
            parameters: tool.schema,
          },
        })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiMessage = data.choices[0]?.message;
    
    if (!aiMessage) {
      throw new Error('No response from AI');
    }
    
    // Handle function calls
    const toolResults: ToolResult[] = [];
    
    if (aiMessage.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const tool = chatTools[toolName as keyof typeof chatTools];
        
        if (tool) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args);
            
            toolResults.push({
              tool: toolName,
              result,
              timestamp: new Date(),
            });
          } catch (error) {
            console.error(`Tool ${toolName} failed:`, error);
          }
        }
      }
    }
    
    return {
      message: {
        id: `ai-${Date.now()}`,
        projectId: project?.id || null,
        role: 'ASSISTANT',
        content: aiMessage.content || 'I apologize, but I couldn\\'t generate a response.',
        createdAt: new Date(),
      },
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    };
    
  } catch (error) {
    console.error('Chat processing error:', error);
    
    return {
      message: {
        id: `error-${Date.now()}`,
        projectId: project?.id || null,
        role: 'ASSISTANT',
        content: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        createdAt: new Date(),
      },
    };
  }
}"