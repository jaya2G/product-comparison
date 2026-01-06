'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [message, setMessage] = useState('');

    // CSV Import state
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handleAuth = () => {
        if (adminKey) {
            setIsAuthenticated(true);
            setMessage('Authenticated! You can now use admin features.');
        }
    };

    const handleCsvImport = async () => {
        if (!csvFile) {
            setMessage('Please select a CSV file');
            return;
        }

        setImporting(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', csvFile);

        try {
            const response = await fetch('/api/admin/import/csv', {
                method: 'POST',
                headers: {
                    'x-admin-key': adminKey,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(
                    `✅ Import complete!\nSuccess: ${data.success}/${data.total}\nFailed: ${data.failed}/${data.total}`
                );
                setCsvFile(null);
            } else {
                setMessage(`❌ Error: ${data.error || 'Import failed'}`);
            }
        } catch (error) {
            setMessage('❌ Network error during import');
        } finally {
            setImporting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-16">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Admin Access</CardTitle>
                        <CardDescription>Enter your admin key to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Admin Key"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                        <Button onClick={handleAuth} className="w-full">
                            Authenticate
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Admin key is set in <code className="bg-muted px-1">.env.local</code>
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                    Logout
                </Button>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-muted rounded-lg whitespace-pre-line">
                    {message}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* CSV Import */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Import (CSV)</CardTitle>
                        <CardDescription>Upload a CSV file to import multiple products</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                disabled={importing}
                            />
                        </div>
                        <Button
                            onClick={handleCsvImport}
                            disabled={!csvFile || importing}
                            className="w-full"
                        >
                            {importing ? 'Importing...' : 'Import CSV'}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            <p className="mb-2">CSV Format:</p>
                            <code className="block bg-muted p-2 rounded text-xs">
                                name,category,brand,price,release_year,rating,description,main_image_url
                            </code>
                            <p className="mt-2">
                                See <code>products-import-template.csv</code> for example
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* API Reference */}
                <Card>
                    <CardHeader>
                        <CardTitle>API Endpoints</CardTitle>
                        <CardDescription>Use these endpoints with curl or Postman</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Badge className="mb-2">POST</Badge>
                            <code className="block bg-muted p-2 rounded text-xs">
                                /api/admin/products
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">Create new product</p>
                        </div>

                        <div>
                            <Badge className="mb-2" variant="secondary">PUT</Badge>
                            <code className="block bg-muted p-2 rounded text-xs">
                                /api/admin/products/:id
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">Update product</p>
                        </div>

                        <div>
                            <Badge className="mb-2" variant="destructive">DELETE</Badge>
                            <code className="block bg-muted p-2 rounded text-xs">
                                /api/admin/products/:id
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">Delete product</p>
                        </div>

                        <div className="text-sm text-muted-foreground pt-4">
                            <p>All requests require header:</p>
                            <code className="block bg-muted p-2 rounded text-xs mt-1">
                                x-admin-key: {adminKey.slice(0, 10)}...
                            </code>
                        </div>
                    </CardContent>
                </Card>

                {/* Example curl commands */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Example Commands</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2">Create Product:</p>
                            <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                                {`curl -X POST http://localhost:3000/api/admin/products \\
  -H "x-admin-key: ${adminKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "iPhone 16 Pro",
    "category": "phones",
    "brand": "Apple",
    "price": 1199,
    "release_year": 2024,
    "rating": 4.8,
    "description": "Latest iPhone",
    "specs": {
      "screen_size": 6.7,
      "processor": "A18 Pro",
      "ram": 8
    }
  }'`}
                            </code>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2">Update Product:</p>
                            <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                                {`curl -X PUT http://localhost:3000/api/admin/products/1 \\
  -H "x-admin-key: ${adminKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"price": 1099}'`}
                            </code>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2">Delete Product:</p>
                            <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                                {`curl -X DELETE http://localhost:3000/api/admin/products/1 \\
  -H "x-admin-key: ${adminKey}"`}
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
