'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');

    return (
        <>
            {!isAdmin && <Navbar />}
            <main id="main" className={isAdmin ? undefined : 'min-h-screen'}>{children}</main>
            {!isAdmin && <Footer />}
        </>
    );
}
