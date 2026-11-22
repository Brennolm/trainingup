import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

export type TabItem = { value: string; label: string; content: ReactNode }

type TabsProps = {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ items, defaultValue, value, onValueChange }: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className="grid gap-4"
    >
      <RadixTabs.List className="bg-surface-2 flex gap-1 overflow-x-auto rounded-xl p-1">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="text-muted hover:text-text data-[state=active]:bg-surface data-[state=active]:text-text h-10 flex-1 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors data-[state=active]:shadow-sm"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="focus:outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
