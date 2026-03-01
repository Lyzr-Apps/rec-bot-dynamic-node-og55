'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiCheck, FiX } from 'react-icons/fi'

export interface Recommendation {
  name: string
  price: string
  features: string[]
  fit_reason: string
}

interface ComparisonModalProps {
  open: boolean
  onClose: () => void
  items: Recommendation[]
  onRemoveItem: (index: number) => void
}

export default function ComparisonModal({ open, onClose, items, onRemoveItem }: ComparisonModalProps) {
  const safeItems = Array.isArray(items) ? items : []

  const allFeatures = Array.from(
    new Set(safeItems.flatMap((item) => (Array.isArray(item?.features) ? item.features : [])))
  )

  if (safeItems.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl w-full border border-border bg-card p-0">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="font-serif text-xl tracking-wider">Product Comparison</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-8 pb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted-foreground font-normal tracking-wider text-xs uppercase">Feature</th>
                  {safeItems.map((item, idx) => (
                    <th key={idx} className="text-left py-3 px-4 min-w-[180px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif font-medium text-card-foreground">{item?.name ?? 'Product'}</p>
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs mt-1">{item?.price ?? 'N/A'}</Badge>
                        </div>
                        <button onClick={() => onRemoveItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors mt-0.5">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, fIdx) => (
                  <tr key={fIdx} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-muted-foreground">{feature}</td>
                    {safeItems.map((item, iIdx) => {
                      const hasFeature = Array.isArray(item?.features) && item.features.includes(feature)
                      return (
                        <td key={iIdx} className="py-3 px-4">
                          {hasFeature ? (
                            <FiCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <span className="text-muted-foreground/40">--</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-4 text-muted-foreground font-medium">Why It Fits</td>
                  {safeItems.map((item, iIdx) => (
                    <td key={iIdx} className="py-3 px-4 text-muted-foreground text-xs leading-relaxed italic">
                      {item?.fit_reason ?? ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
