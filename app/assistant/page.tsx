'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    products?: any[];
}

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your product assistant. I can help you find the perfect phone or camera. Try asking me something like 'best phone under $500' or 'cameras with 4K video'.",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message || 'Sorry, I encountered an error.',
                products: data.products || [],
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Product Assistant</h1>

            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                            >
                                <p className="whitespace-pre-line">{message.content}</p>

                                {/* Display product recommendations */}
                                {message.products && message.products.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {message.products.map((product: any) => (
                                            <Link
                                                key={product.id}
                                                href={`/product/${product.slug}`}
                                                className="block p-3 bg-background rounded border hover:border-primary transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">{product.brand_name}</p>
                                                    </div>
                                                    {product.price && (
                                                        <p className="font-bold">{formatPrice(product.price)}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-4">
                                <p className="text-muted-foreground">Thinking...</p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter>
                    <div className="flex w-full gap-2">
                        <Input
                            placeholder="Ask me about phones or cameras..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Example questions */}
            <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        'best phone under $500',
                        'cameras with 4K video',
                        'latest Samsung phones',
                        'Canon cameras for beginners',
                    ].map((example) => (
                        <Button
                            key={example}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(example)}
                        >
                            {example}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
