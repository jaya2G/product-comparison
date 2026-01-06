import { NextRequest, NextResponse } from 'next/server';
import { handleChatMessage } from '@/lib/chat';
import { chatMessageSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = chatMessageSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid message', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { message } = validation.data;

        // Handle chat message
        const result = await handleChatMessage(message);

        return NextResponse.json({
            message: result.response,
            products: result.products,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Chat processing failed' },
            { status: 500 }
        );
    }
}
