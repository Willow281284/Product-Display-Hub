import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Truck,
  Percent,
  DollarSign,
  Gift,
  Clock,
  Sparkles,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Offer,
  OfferStatus,
  getOfferStatus,
  formatOfferDiscount,
  getOfferDaysRemaining,
  offerStatusConfig,
} from '@/types/offer';

interface OfferBadgeProps {
  offer: Offer;
  showStatus?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function OfferBadge({ offer, showStatus = true, compact = false, onClick }: OfferBadgeProps) {
  const status = getOfferStatus(offer);
  const statusConfig = offerStatusConfig[status];
  const daysRemaining = getOfferDaysRemaining(offer);
  const discountText = formatOfferDiscount(offer);

  const getOfferIcon = () => {
    switch (offer.type) {
      case 'free_shipping':
        return <Truck className="w-3 h-3" />;
      case 'percent_discount':
      case 'quantity_discount':
      case 'bulk_purchase':
        return <Percent className="w-3 h-3" />;
      case 'fixed_discount':
        return <DollarSign className="w-3 h-3" />;
      case 'bogo_half':
      case 'bogo_free':
        return <Gift className="w-3 h-3" />;
      default:
        return <Percent className="w-3 h-3" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ending_soon':
        return <Clock className="w-3 h-3" />;
      case 'just_created':
        return <Sparkles className="w-3 h-3" />;
      case 'scheduled':
        return <CalendarClock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer gap-1 text-[10px] px-1.5 py-0.5",
              statusConfig.bgColor,
              statusConfig.color,
              onClick && "hover:opacity-80"
            )}
            onClick={onClick}
          >
            {getOfferIcon()}
            {discountText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{offer.name}</p>
            <p className="text-xs text-muted-foreground">{discountText}</p>
            {showStatus && (
              <div className="flex items-center gap-1 text-xs">
                {getStatusIcon()}
                <span className={statusConfig.color}>{statusConfig.label}</span>
                {status === 'active' || status === 'ending_soon' ? (
                  <span className="text-muted-foreground">• {daysRemaining} days left</span>
                ) : null}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md border",
        statusConfig.bgColor,
        "border-transparent",
        onClick && "cursor-pointer hover:opacity-80"
      )}
      onClick={onClick}
    >
      <div className={cn("flex items-center gap-1", statusConfig.color)}>
        {getOfferIcon()}
        <span className="text-xs font-medium">{discountText}</span>
      </div>
      
      {showStatus && (
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 gap-1",
              statusConfig.bgColor,
              statusConfig.color,
              "border-current/20"
            )}
          >
            {getStatusIcon()}
            {statusConfig.label}
          </Badge>
          {(status === 'active' || status === 'ending_soon') && (
            <span className="text-[10px] text-muted-foreground">
              {daysRemaining}d
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface OffersBadgeGroupProps {
  offers: Offer[];
  maxDisplay?: number;
  onViewAll?: () => void;
}

export function OffersBadgeGroup({ offers, maxDisplay = 2, onViewAll }: OffersBadgeGroupProps) {
  if (offers.length === 0) return null;

  const displayOffers = offers.slice(0, maxDisplay);
  const remainingCount = offers.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayOffers.map((offer) => (
        <OfferBadge key={offer.id} offer={offer} compact onClick={onViewAll} />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0.5 cursor-pointer hover:bg-muted"
          onClick={onViewAll}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
