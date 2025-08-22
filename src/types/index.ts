import { 
  Project as PrismaProject, 
  Brand as PrismaBrand,
  Assets as PrismaAssets,
  Content as PrismaContent,
  Layout as PrismaLayout,
  Generated as PrismaGenerated,
  Export as PrismaExport,
  ChatMessage as PrismaChatMessage,
  ExportKind,
  MessageRole
} from '@prisma/client';

// Re-export Prisma types
export type { ExportKind, MessageRole };

// Extended types with relations
export type Project = PrismaProject & {
  brand?: Brand;
  assets?: Assets;
  content?: Content;
  layout?: Layout;
  generated?: Generated[];
  exports?: Export[];
  chatMessages?: ChatMessage[];
};

export type Brand = PrismaBrand;
export type Assets = PrismaAssets;
export type Content = PrismaContent;
export type Layout = PrismaLayout;
export type Generated = PrismaGenerated;
export type Export = PrismaExport;
export type ChatMessage = PrismaChatMessage;

// Color palette types
export interface ColorToken {
  slug: string;
  color: string;
  locked?: boolean;
  source?: 'user' | 'logo_ai' | 'manual';
}

// Font configuration types
export interface FontConfig {
  family: string;
  weights: number[];
  fallback: string;
}

// Theme generation types
export interface ThemeJson {
  version: number;
  settings: {
    appearanceTools: boolean;
    color: {
      palette: Array<{
        slug: string;
        name: string;
        color: string;
      }>;
    };
    typography: {
      fluid: boolean;
      fontFamilies: Array<{
        slug: string;
        name: string;
        fontFamily: string;
      }>;
      fontSizes: Array<{
        slug: string;
        size: string;
        name?: string;
      }>;
    };
    spacing: {
      units: string[];
      spacingScale?: {
        steps: number;
      };
    };
  };
  styles: Record<string, any>;
}

export interface BlockPattern {
  slug: string;
  title: string;
  html: string;
  categories?: string[];
}

export interface GeneratedTheme {
  themeJson: ThemeJson;
  patterns: BlockPattern[];
  templateFront: string;
}

// Upload types
export interface UploadResult {
  path: string;
  url: string;
  size: number;
}

// Tab navigation types
export type TabName = 'details' | 'brand' | 'assets' | 'content' | 'layout' | 'generate' | 'preview' | 'export';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface ProjectFormData {
  name: string;
  sector?: string;
  locale: string;
  styleTags: string[];
}

export interface BrandFormData {
  primary?: string;
  secondary?: string;
  palette: ColorToken[];
  headingFont: FontConfig;
  bodyFont: FontConfig;
  logoPath?: string;
}

export interface ContentFormData {
  headline?: string;
  benefits: Array<{
    title: string;
    description: string;
  }>;
  cta?: string;
  contact: {
    phone?: string;
    whatsapp?: string;
    address?: string;
  };
}

export interface LayoutFormData {
  sections: string[];
}

// Chat types
export interface ChatContext {
  projectId?: string;
  project?: Project;
}

export interface ToolResult {
  tool: string;
  result: any;
  timestamp: Date;
}

// Preview types
export interface PreviewData {
  html: string;
  css: string;
}

// Export types
export interface ExportData {
  zipPath: string;
  sizeKB: number;
  checksum: string;
  downloadUrl: string;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Session types
export interface SessionData {
  userId?: string;
  isAuthenticated?: boolean;
}

// WordPress types
export interface WordPressThemeInfo {
  name: string;
  description?: string;
  author: string;
  version: string;
  requiresAt: string;
  requiresPHP: string;
  textDomain?: string;
}