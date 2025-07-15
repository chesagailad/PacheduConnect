import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { href: '/super-admin', label: 'Dashboard', icon: HomeIcon },
  { href: '/super-admin/admins', label: 'Admins', icon: UsersIcon },
  { href: '/super-admin/transactions', label: 'Transactions', icon: CurrencyDollarIcon },
  { href: '/super-admin/kyc', label: 'KYC', icon: DocumentTextIcon },
  { href: '/super-admin/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function SuperAdminNav() {
  const router = useRouter();
  return (
    <nav className="w-64 min-h-screen bg-gray-900 text-white flex flex-col p-6">
      <div className="mb-10 flex items-center gap-2">
        <span className="text-2xl font-bold">PacheduConnect</span>
      </div>
      <ul className="flex-1">
        {navItems.map((item) => {
          const active = router.pathname === item.href;
          return (
            <li key={item.href} className={active ? 'mb-4 font-semibold' : 'mb-4'}>
              <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 relative">
                {active && <span className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r" />}
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
} 