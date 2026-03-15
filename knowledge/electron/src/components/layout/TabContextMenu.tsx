import React from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { X, Pin, PinOff, Bug } from 'lucide-react';

interface TabContextMenuProps {
    children: React.ReactNode;
    tabId: string;
    isPinned?: boolean;
    isOverview?: boolean;
    canCloseOthers?: boolean;
    onClose: (id: string) => void;
    onTogglePin: (id: string) => void;
    onCloseOthers: (id: string) => void;
    onCloseRight: (id: string) => void;
    onCloseLeft: (id: string) => void;
}

export const TabContextMenu = ({
    children,
    tabId,
    isPinned,
    isOverview,
    canCloseOthers,
    onClose,
    onTogglePin,
    onCloseOthers,
    onCloseRight,
    onCloseLeft,
}: TabContextMenuProps) => {
    const handleReportBug = () => {
        const trigger = document.getElementById('bug-report-trigger-target');
        if (trigger) trigger.click();
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                {!isOverview && (
                    <>
                        <ContextMenuItem onClick={() => onTogglePin(tabId)}>
                            {isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                            {isPinned ? 'Unpin Tab' : 'Pin Tab'}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onClose(tabId)}>
                            <X className="w-4 h-4 mr-2" />
                            Close
                        </ContextMenuItem>
                    </>
                )}

                <ContextMenuItem disabled={!canCloseOthers} onClick={() => onCloseOthers(tabId)}>
                    Close Others
                </ContextMenuItem>

                <ContextMenuSeparator />

                {!isOverview && (
                    <>
                        <ContextMenuItem onClick={() => onCloseRight(tabId)}>
                            Close Tabs to the Right
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onCloseLeft(tabId)}>
                            Close Tabs to the Left
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}

                <ContextMenuItem onClick={handleReportBug}>
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
