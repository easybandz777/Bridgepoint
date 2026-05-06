/**
 * Layout for /admin/subcontractors/[id]/*.
 *
 * Verification of the sub's existence happens client-side in each page since the
 * data lives in the DB and we want a single source of truth at the API layer.
 */
export default function SubcontractorLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
