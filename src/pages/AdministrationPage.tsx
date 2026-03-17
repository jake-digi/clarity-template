import { useSearchParams } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, ImageIcon } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminEmailTemplatesTab from "@/components/admin/AdminEmailTemplatesTab";
import AdminProductImagesTab from "@/components/admin/AdminProductImagesTab";

const tabs = [
  { value: "users", label: "Users", icon: Users },
  { value: "email_templates", label: "Email Templates", icon: Mail },
  { value: "product_images", label: "Product Images", icon: ImageIcon },
];

const AdministrationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "users";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
            {/* Page banner */}
            <div className="border-b border-border bg-card px-6 py-5 shrink-0">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Administration</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage users, email templates, and product images</p>
            </div>

            {/* Tab bar */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 shrink-0">
              <TabsList className="h-auto p-0 bg-transparent rounded-none border-none gap-0">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="relative rounded-none border-none bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent gap-1.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary transition-colors hover:text-foreground"
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="users" className="mt-0">
                <AdminUsersTab />
              </TabsContent>
              <TabsContent value="email_templates" className="mt-0 p-6">
                <AdminEmailTemplatesTab />
              </TabsContent>
              <TabsContent value="product_images" className="mt-0 flex flex-col flex-1 min-h-0 data-[state=inactive]:hidden">
                <AdminProductImagesTab />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdministrationPage;
