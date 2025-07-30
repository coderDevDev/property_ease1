import '../globals.css';
import { PropertyOwnerSidebar } from '@/components/property-owner-sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PropertyOwnerSidebar />
      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  );
}
