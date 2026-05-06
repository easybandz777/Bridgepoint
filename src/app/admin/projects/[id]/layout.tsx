// Each [id]/* page handles its own data loading + 404 client-side; this layout
// is now a thin wrapper that just provides consistent padding.
export default async function ProjectLayout({
    children,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
