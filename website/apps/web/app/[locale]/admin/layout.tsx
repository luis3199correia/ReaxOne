import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 pt-18 md:p-8 md:pt-8 overflow-auto">{children}</main>
    </div>
  );
}
