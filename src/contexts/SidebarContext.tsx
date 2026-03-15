import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextType {
  expanded: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
  mobileOpen: false,
  isMobile: false,
  toggle: () => {},
  setMobileOpen: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

export const SidebarStateProvider = ({ children }: { children: ReactNode }) => {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile drawer on route change / resize
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        expanded,
        mobileOpen,
        isMobile,
        toggle: () => {
          if (isMobile) {
            setMobileOpen((v) => !v);
          } else {
            setExpanded((v) => !v);
          }
        },
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
