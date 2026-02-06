'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  MessageSquarePlus,
  FileText,
  Mic,
  History,
  CreditCard,
  Settings,
  GraduationCap,
  LogIn,
  Library,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '../providers/user-provider';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat-fix', label: 'ChatFix', icon: MessageSquarePlus },
  { href: '/resume-generator', label: 'Resume Generator', icon: FileText },
  { href: '/voice-note', label: 'Voice-to-Note', icon: Mic },
  { href: '/ai-tutor', label: 'AI Tutor', icon: GraduationCap },
  { href: '/long-summary', label: 'Long Summary', icon: Library },
  { href: '/history', label: 'History', pro: true, icon: History },
  { href: '/pricing', label: 'Pricing & Plans', icon: CreditCard },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { user, plan } = useUser();
  const isSubscriber = plan === 'Pro' || plan === 'Premium+';

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/">
               <Image src="/icon.svg" alt="WryLyt Logo" width={28} height={28} />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight font-headline">WryLyt</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.pro && !isSubscriber && !user) return null;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {!user && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/new-login'}>
                 <Link href="/new-login">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={pathname === '/settings'}>
               <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
               </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
