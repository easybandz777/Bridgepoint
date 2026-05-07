import { redirect } from 'next/navigation';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

export default async function PortalRoot() {
    const user = await getPortalUserFromCookie();
    if (user) {
        redirect('/portal/dashboard');
    }
    redirect('/portal/login');
}
