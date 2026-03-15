import React, { useState, useEffect } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
    Copy,
    Scissors,
    Clipboard,
    MessageSquare,
    Bug,
    RefreshCw,
    MoreHorizontal,
    Search,
    ArrowBigUpDash
} from 'lucide-react';

interface GlobalContextMenuProps {
    children: React.ReactNode;
}

export const GlobalContextMenu = ({ children }: GlobalContextMenuProps) => {
    const [hasSelection, setHasSelection] = useState(false);
    const [selectedText, setSelectedText] = useState('');

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim() || '';
            setHasSelection(text.length > 0);
            setSelectedText(text);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const handleAction = (action: string) => {
        switch (action) {
            case 'copy':
                if (selectedText) {
                    navigator.clipboard.writeText(selectedText);
                }
                break;
            case 'bug':
                document.getElementById('bug-report-trigger-target')?.click();
                break;
            case 'reload':
                window.location.reload();
                break;
            case 'comment':
                console.log('Dropping comment on:', selectedText);
                // This could trigger a custom comment widget
                break;
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger className="flex h-full w-full">
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={() => handleAction('copy')} disabled={!hasSelection}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                    <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={!hasSelection}>
                    <Scissors className="mr-2 h-4 w-4" />
                    Cut
                    <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Paste
                    <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem onClick={() => handleAction('comment')} disabled={!hasSelection}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Drop Comment
                    <ContextMenuShortcut>⌘K</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem onClick={() => handleAction('reload')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload Interface
                </ContextMenuItem>

                <ContextMenuItem onClick={() => handleAction('bug')}>
                    <Bug className="mr-2 h-4 w-4" />
                    Report Interface Issue
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem>
                    <Search className="mr-2 h-4 w-4" />
                    Search Documentation
                </ContextMenuItem>

                <ContextMenuItem>
                    <ArrowBigUpDash className="mr-2 h-4 w-4" />
                    Check for Updates
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
