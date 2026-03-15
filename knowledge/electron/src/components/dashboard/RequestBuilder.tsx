
import { useState } from 'react';
import { Send } from 'lucide-react';
import { ChevronDownIcon } from '../shared/icons/PostmanIcons';

export const RequestBuilder = () => {
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('');
    const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'authorization' | 'headers' | 'body'>('params');

    const methodColors: Record<string, string> = {
        GET: 'text-green-600',
        POST: 'text-yellow-600',
        PUT: 'text-blue-600',
        DELETE: 'text-red-600',
        PATCH: 'text-purple-600',
        HEAD: 'text-green-600',
        OPTIONS: 'text-pink-600',
    };

    return (
        <div className="flex-1 bg-panel overflow-auto flex flex-col">
            {/* Request URL bar */}
            <div className="bg-card border-b border-border px-4 py-3">
                <div className="flex gap-2">
                    {/* Method selector */}
                    <div className="relative">
                        <button className={`h-9 px-3 bg-background border border-border rounded-l flex items-center gap-2 font-medium text-sm ${methodColors[method]}`}>
                            {method}
                            <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* URL input */}
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter request URL"
                        className="flex-1 h-9 px-3 bg-background border border-l-0 border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    />

                    {/* Send button */}
                    <button className="h-9 px-4 bg-primary text-primary-foreground rounded-r font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
                        <Send className="w-4 h-4" />
                        Send
                    </button>
                </div>
            </div>

            {/* Request tabs */}
            <div className="bg-card border-b border-border px-4">
                <div className="flex items-center gap-1">
                    {(['params', 'authorization', 'headers', 'body'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveRequestTab(tab)}
                            className={`px-3 py-2 text-sm capitalize transition-colors ${activeRequestTab === tab
                                ? 'text-foreground border-b-2 border-primary -mb-px font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab === 'authorization' ? 'Auth' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request content area */}
            <div className="flex-1 bg-card p-4">
                {activeRequestTab === 'params' && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">Query Params</p>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Key"
                                className="flex-1 h-8 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                className="flex-1 h-8 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                )}
                {activeRequestTab === 'authorization' && (
                    <p className="text-sm text-muted-foreground">Authorization settings...</p>
                )}
                {activeRequestTab === 'headers' && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">Headers</p>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Key"
                                className="flex-1 h-8 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                className="flex-1 h-8 px-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                )}
                {activeRequestTab === 'body' && (
                    <p className="text-sm text-muted-foreground">Request body editor...</p>
                )}
            </div>
        </div>
    );
};
