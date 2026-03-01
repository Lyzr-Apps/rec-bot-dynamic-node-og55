'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FiCheck, FiColumns } from 'react-icons/fi'

export interface Recommendation {
  name: string
  price: string
  features: string[]
  fit_reason: string
}

interface ProductCardProps {
  recommendation: Recommendation
  onCompare?: (item: Recommendation) => void
  isSelected?: boolean
}

export default function ProductCard({ recommendation, onCompare, isSelected }: ProductCardProps) {
  const features = Array.isArray(recommendation?.features) ? recommendation.features : []

  return (
    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-medium tracking-wider leading-relaxed text-card-foreground">
            {recommendation?.name ?? 'Unnamed Product'}
          </h3>
          <Badge className="bg-primary/15 text-primary border-primary/30 font-sans text-sm px-3 py-1 shrink-0">
            {recommendation?.price ?? 'N/A'}
          </Badge>
        </div>

        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((feature, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs font-sans bg-secondary text-secondary-foreground px-2.5 py-1 border border-border">
                <FiCheck className="w-3 h-3 text-primary" />
                {feature}
              </span>
            ))}
          </div>
        )}

        {recommendation?.fit_reason && (
          <div className="border-t border-border pt-3">
            <p className="text-sm text-muted-foreground font-sans leading-relaxed italic">
              {recommendation.fit_reason}
            </p>
          </div>
        )}

        {onCompare && (
          <div className="pt-1">
            <Button
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCompare(recommendation)}
              className="text-xs font-sans tracking-wider"
            >
              <FiColumns className="w-3.5 h-3.5 mr-1.5" />
              {isSelected ? 'Selected' : 'Compare'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
