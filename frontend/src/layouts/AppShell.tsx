import type { ReactNode } from 'react'
import { BottomNav } from '../components/navigation/BottomNav'
import { Sidebar } from '../components/navigation/Sidebar'
import type { NavItem } from '../components/navigation/navItems'

// Logged-in layout: sidebar on desktop, bottom nav on mobile.
export function AppShell({ items, children }: { items: NavItem[]; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar items={items} />
      <main className="min-w-0 flex-1 px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:px-10 md:pb-12">
        {children}
      </main>
      <BottomNav items={items} />
    </div>
  )
}
