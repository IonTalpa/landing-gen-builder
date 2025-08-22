import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { processChatMessage } from '@/lib/chat';
import { z } from 'zod';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['USER', 'ASSISTANT', 'TOOL']),
    content: z.string(),
  })),
  projectId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { messages, projectId } = chatSchema.parse(body);

    // Fetch project if provided
    let project = null;
    if (projectId) {
      project = await prisma.project.findUnique({
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
    }

    // Convert input messages to proper format
    const chatMessages = messages.map(m => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      projectId: projectId || null,
      role: m.role,
      content: m.content,
      createdAt: new Date(),
    }));

    // Process the conversation
    const result = await processChatMessage(chatMessages, project || undefined);

    // Store messages in database
    if (projectId) {
      // Store user message if it's the last one
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'USER') {
        await prisma.chatMessage.create({
          data: {
            projectId,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
          },
        });
      }
      
      // Store assistant response
      await prisma.chatMessage.create({
        data: {
          projectId,
          role: result.message.role,
          content: result.message.content,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        toolResults: result.toolResults,
        project: project ? {
          id: project.id,
          name: project.name,
          slug: project.slug,
        } : null,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Chat error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Chat processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get chat history for a project
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

    // Fetch chat history
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit to last 50 messages
    });

    return NextResponse.json({
      success: true,
      data: { messages },
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}"