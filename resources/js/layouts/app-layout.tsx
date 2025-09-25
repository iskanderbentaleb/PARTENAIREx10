import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from "@/components/ui/sonner"


interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, actions , ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} actions={actions} {...props}>
        {children}
        {/* <Toaster /> */}
        <Toaster
        position="top-center"
        richColors={true} // uses colors from success/error/warning instead of default black
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "0.875rem",
            borderRadius: "0.5rem",
          },
        }}
      />
    </AppLayoutTemplate>
);
