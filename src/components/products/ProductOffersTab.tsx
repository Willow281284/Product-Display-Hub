import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tag,
  Plus,
  TrendingUp,
  DollarSign,
  Percent,
  Eye,
  MousePointer,
  ShoppingCart,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  Store,
  Globe,
  ChevronDown,
  ChevronUp,
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Offer, 
  getOfferStatus, 
  formatOfferDiscount,
  offerStatusConfig,
  getOfferDaysRemaining,
} from '@/types/offer';
import { useOffers } from '@/hooks/useOffers';
import { CreateOfferDialog } from './CreateOfferDialog';
import { EditOfferDialog } from './EditOfferDialog';
import { mockProducts } from '@/data/mockProducts';
import { useToast } from '@/hooks/use-toast';

type AlertType = 'warning' | 'critical' | 'success' | 'info';

interface PerformanceAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  offer: Offer;
  metric?: string;
  action?: string;
}

interface ProductOffersTabProps {
  productId: string;
  productName: string;
}

interface OfferAnalytics {
  offer: Offer;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  adSpend: number;
  roas: number;
}

interface MarketplaceAnalytics {
  marketplace: string;
  status: 'active' | 'inactive' | 'not_listed';
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  adSpend: number;
  roas: number;
}

const MARKETPLACE_LIST = [
  'Amazon', 'Walmart', 'eBay', 'Target', 'Etsy', 'Shopify', 
  'Best Buy', 'Wayfair', 'Newegg', 'Home Depot'
];

function generateOfferAnalytics(offer: Offer, productId: string): OfferAnalytics {
  const seed = (offer.id + productId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };

  const status = getOfferStatus(offer);
  const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';
  const multiplier = isActive ? 1 : 0.3;

  const impressions = random(1000, 10000) * multiplier;
  const clicks = Math.floor(impressions * (random(5, 15) / 100));
  const conversions = Math.floor(clicks * (random(3, 12) / 100));
  const revenue = conversions * random(25, 150);
  const adSpend = random(50, 500) * multiplier;
  const roas = adSpend > 0 ? revenue / adSpend : 0;

  return {
    offer,
    impressions: Math.floor(impressions),
    clicks,
    conversions,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    revenue,
    adSpend,
    roas,
  };
}

function generateMarketplaceAnalytics(offer: Offer, productId: string): MarketplaceAnalytics[] {
  const offerMarketplaces = offer.marketplaces.length > 0 ? offer.marketplaces : MARKETPLACE_LIST.slice(0, 3);
  
  return MARKETPLACE_LIST.map((marketplace, mpIndex) => {
    const seed = (offer.id + productId + marketplace).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number) => {
      const x = Math.sin(seed * (mpIndex + 1)) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min) + min);
    };

    const isActive = offerMarketplaces.includes(marketplace);
    const status: MarketplaceAnalytics['status'] = isActive 
      ? (random(0, 10) > 2 ? 'active' : 'inactive')
      : 'not_listed';
    
    const multiplier = status === 'active' ? 1 : status === 'inactive' ? 0.1 : 0;
    
    const impressions = random(200, 3000) * multiplier;
    const clicks = Math.floor(impressions * (random(5, 15) / 100));
    const conversions = Math.floor(clicks * (random(3, 12) / 100));
    const revenue = conversions * random(25, 150);
    const adSpend = random(20, 200) * multiplier;
    const roas = adSpend > 0 ? revenue / adSpend : 0;

    return {
      marketplace,
      status,
      impressions: Math.floor(impressions),
      clicks,
      conversions,
      revenue,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      adSpend,
      roas,
    };
  });
}

export function ProductOffersTab({ productId, productName }: ProductOffersTabProps) {
  const { toast } = useToast();
  const { offers, addOffer, updateOffer, deleteOffer, getOffersForProduct } = useOffers();
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [editOfferOpen, setEditOfferOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [marketplacePopoverOpen, setMarketplacePopoverOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState('30');

  const handleMarketplaceToggle = (marketplace: string) => {
    setSelectedMarketplaces(prev => 
      prev.includes(marketplace)
        ? prev.filter(m => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  const handleSelectAllMarketplaces = () => {
    if (selectedMarketplaces.length === MARKETPLACE_LIST.length) {
      setSelectedMarketplaces([]);
    } else {
      setSelectedMarketplaces([...MARKETPLACE_LIST]);
    }
  };

  const marketplaceFilterLabel = useMemo(() => {
    if (selectedMarketplaces.length === 0) return 'All Marketplaces';
    if (selectedMarketplaces.length === 1) return selectedMarketplaces[0];
    if (selectedMarketplaces.length === MARKETPLACE_LIST.length) return 'All Marketplaces';
    return `${selectedMarketplaces.length} Marketplaces`;
  }, [selectedMarketplaces]);

  // Get offers for this product
  const productOffers = useMemo(() => {
    return offers.filter(o => o.productIds.includes(productId));
  }, [offers, productId]);

  // Filter offers based on selected marketplaces
  const filteredProductOffers = useMemo(() => {
    if (selectedMarketplaces.length === 0) {
      return productOffers;
    }
    
    return productOffers.filter(offer => {
      const offerMarketplaces = offer.marketplaces.length > 0 
        ? offer.marketplaces 
        : MARKETPLACE_LIST.slice(0, 3);
      return selectedMarketplaces.some(mp => offerMarketplaces.includes(mp));
    });
  }, [productOffers, selectedMarketplaces]);

  // Generate analytics for each offer
  const offerAnalytics = useMemo(() => {
    return filteredProductOffers.map(offer => generateOfferAnalytics(offer, productId));
  }, [filteredProductOffers, productId]);

  // Generate marketplace analytics for filtered offers
  const offerMarketplaceAnalytics = useMemo(() => {
    return filteredProductOffers.reduce((acc, offer) => {
      acc[offer.id] = generateMarketplaceAnalytics(offer, productId);
      return acc;
    }, {} as Record<string, MarketplaceAnalytics[]>);
  }, [filteredProductOffers, productId]);

  // Summary metrics - filtered by selected marketplaces
  const summaryMetrics = useMemo(() => {
    const activeOffers = offerAnalytics.filter(a => {
      const status = getOfferStatus(a.offer);
      return status === 'active' || status === 'ending_soon' || status === 'just_created';
    });

    // If specific marketplaces are selected, aggregate from marketplace-level data
    if (selectedMarketplaces.length > 0 && selectedMarketplaces.length < MARKETPLACE_LIST.length) {
      let totalRevenue = 0, totalConversions = 0, totalClicks = 0, totalImpressions = 0, totalAdSpend = 0;
      
      activeOffers.forEach(a => {
        const mpAnalytics = offerMarketplaceAnalytics[a.offer.id] || [];
        mpAnalytics.forEach(mp => {
          if (selectedMarketplaces.includes(mp.marketplace) && mp.status === 'active') {
            totalRevenue += mp.revenue;
            totalConversions += mp.conversions;
            totalClicks += mp.clicks;
            totalImpressions += mp.impressions;
            totalAdSpend += mp.adSpend;
          }
        });
      });

      const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

      return {
        activeOffers: activeOffers.length,
        totalOffers: filteredProductOffers.length,
        totalRevenue,
        totalConversions,
        totalClicks,
        totalImpressions,
        avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        totalAdSpend,
        avgRoas,
      };
    }

    const totalRevenue = activeOffers.reduce((sum, a) => sum + a.revenue, 0);
    const totalConversions = activeOffers.reduce((sum, a) => sum + a.conversions, 0);
    const totalClicks = activeOffers.reduce((sum, a) => sum + a.clicks, 0);
    const totalImpressions = activeOffers.reduce((sum, a) => sum + a.impressions, 0);
    const totalAdSpend = activeOffers.reduce((sum, a) => sum + a.adSpend, 0);
    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    return {
      activeOffers: activeOffers.length,
      totalOffers: filteredProductOffers.length,
      totalRevenue,
      totalConversions,
      totalClicks,
      totalImpressions,
      avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalAdSpend,
      avgRoas,
    };
  }, [offerAnalytics, filteredProductOffers.length, selectedMarketplaces, offerMarketplaceAnalytics]);

  // Generate performance alerts for this product's offers
  const performanceAlerts = useMemo((): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];
    const avgConversionRate = summaryMetrics.avgConversionRate;
    const avgRoas = summaryMetrics.avgRoas;

    offerAnalytics.forEach(analytics => {
      const status = getOfferStatus(analytics.offer);
      const daysRemaining = getOfferDaysRemaining(analytics.offer);
      const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';

      if (!isActive) return;

      // High-converting offer ending soon
      if (status === 'ending_soon' && analytics.conversionRate > avgConversionRate * 1.2) {
        alerts.push({
          id: `ending-high-${analytics.offer.id}`,
          type: 'warning',
          title: 'High-Performer Ending Soon',
          description: `"${analytics.offer.name}" has ${analytics.conversionRate.toFixed(1)}% conversion rate but ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider extending.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% conv.`,
          action: 'Extend Offer',
        });
      }

      // Underperforming offer - low conversion rate
      if (analytics.conversionRate < avgConversionRate * 0.5 && analytics.impressions > 500) {
        alerts.push({
          id: `low-conv-${analytics.offer.id}`,
          type: 'critical',
          title: 'Low Conversion Rate',
          description: `"${analytics.offer.name}" has only ${analytics.conversionRate.toFixed(1)}% conversion rate (avg: ${avgConversionRate.toFixed(1)}%). Review offer terms.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% vs ${avgConversionRate.toFixed(1)}%`,
          action: 'Review',
        });
      }

      // Low ROAS
      if (analytics.roas < 1.5 && analytics.adSpend > 100) {
        alerts.push({
          id: `low-roas-${analytics.offer.id}`,
          type: 'critical',
          title: 'Low ROAS',
          description: `"${analytics.offer.name}" has ${analytics.roas.toFixed(2)}x ROAS. Ad spend may exceed returns.`,
          offer: analytics.offer,
          metric: `${analytics.roas.toFixed(2)}x ROAS`,
          action: 'Adjust Budget',
        });
      }

      // Top performer
      if (analytics.conversionRate > avgConversionRate * 1.5 && analytics.roas > 3) {
        alerts.push({
          id: `top-${analytics.offer.id}`,
          type: 'success',
          title: 'Top Performer',
          description: `"${analytics.offer.name}" is outperforming with ${analytics.conversionRate.toFixed(1)}% conversion and ${analytics.roas.toFixed(2)}x ROAS.`,
          offer: analytics.offer,
          metric: `${analytics.roas.toFixed(2)}x ROAS`,
        });
      }

      // Low impressions warning
      if (analytics.impressions < 300 && daysRemaining < 7) {
        alerts.push({
          id: `low-imp-${analytics.offer.id}`,
          type: 'info',
          title: 'Low Visibility',
          description: `"${analytics.offer.name}" has only ${analytics.impressions} impressions. Consider promoting it more.`,
          offer: analytics.offer,
          metric: `${analytics.impressions} views`,
          action: 'Promote',
        });
      }
    });

    // Sort: critical first, then warning, then info, then success
    const priority: Record<AlertType, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    return alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  }, [offerAnalytics, summaryMetrics.avgConversionRate, summaryMetrics.avgRoas]);

  const handleCreateOffer = (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => {
    addOffer(offer);
    toast({
      title: "Offer Created",
      description: "The offer has been created successfully.",
    });
  };

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setEditOfferOpen(true);
  };

  const handleUpdateOffer = (offerId: string, updates: Partial<Offer>) => {
    updateOffer(offerId, updates);
    toast({
      title: "Offer Updated",
      description: "The offer has been updated successfully.",
    });
  };

  const handleDeleteClick = (offer: Offer) => {
    setOfferToDelete(offer);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (offerToDelete) {
      deleteOffer(offerToDelete.id);
      toast({
        title: "Offer Deleted",
        description: `"${offerToDelete.name}" has been removed.`,
      });
      setOfferToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleRemoveFromOffer = (offer: Offer) => {
    const updatedProductIds = offer.productIds.filter(id => id !== productId);
    updateOffer(offer.id, { productIds: updatedProductIds });
    toast({
      title: "Removed from Offer",
      description: `"${productName}" has been removed from "${offer.name}".`,
    });
  };

  const handleToggleMarketplace = (offerId: string, marketplace: string, currentlyActive: boolean) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    let updatedMarketplaces: string[];
    
    if (currentlyActive) {
      // Remove marketplace from offer
      updatedMarketplaces = offer.marketplaces.filter(m => m !== marketplace);
    } else {
      // Add marketplace to offer
      updatedMarketplaces = [...offer.marketplaces, marketplace];
    }

    updateOffer(offerId, { marketplaces: updatedMarketplaces });
    toast({
      title: currentlyActive ? "Marketplace Deactivated" : "Marketplace Activated",
      description: `${marketplace} has been ${currentlyActive ? 'removed from' : 'added to'} "${offer.name}".`,
    });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Product Offers
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage offers and promotions for this product
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Period Selector */}
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Marketplace Filter */}
          <Popover open={marketplacePopoverOpen} onOpenChange={setMarketplacePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[150px] justify-between">
                <Store className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{marketplaceFilterLabel}</span>
                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-popover" align="end">
              <div className="p-2 border-b">
                <div 
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={handleSelectAllMarketplaces}
                >
                  <Checkbox 
                    checked={selectedMarketplaces.length === MARKETPLACE_LIST.length}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">All Marketplaces</span>
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-2 space-y-1">
                  {MARKETPLACE_LIST.map(marketplace => (
                    <div 
                      key={marketplace}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                      onClick={() => handleMarketplaceToggle(marketplace)}
                    >
                      <Checkbox 
                        checked={selectedMarketplaces.includes(marketplace)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{marketplace}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedMarketplaces.length > 0 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setSelectedMarketplaces([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Link to="/offer-analytics">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              All Offers
            </Button>
          </Link>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={() => setCreateOfferOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add to Offer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Offers</p>
                <p className="text-xl font-bold">{summaryMetrics.activeOffers}</p>
                <p className="text-xs text-muted-foreground">of {summaryMetrics.totalOffers} total</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Tag className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(summaryMetrics.totalConversions)} conv.</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conv. Rate</p>
                <p className="text-xl font-bold">{summaryMetrics.avgConversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{formatNumber(summaryMetrics.totalClicks)} clicks</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Percent className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ad Spend</p>
                <p className="text-xl font-bold">{formatCurrency(summaryMetrics.totalAdSpend)}</p>
                <p className="text-xs text-muted-foreground">total spend</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <DollarSign className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ROAS</p>
                <p className="text-xl font-bold">{summaryMetrics.avgRoas.toFixed(2)}x</p>
                <p className="text-xs text-muted-foreground">return on ad spend</p>
              </div>
              <div className={cn(
                "p-2 rounded-full",
                summaryMetrics.avgRoas >= 3 ? "bg-emerald-500/10" : summaryMetrics.avgRoas >= 2 ? "bg-amber-500/10" : "bg-red-500/10"
              )}>
                <TrendingUp className={cn(
                  "w-4 h-4",
                  summaryMetrics.avgRoas >= 3 ? "text-emerald-500" : summaryMetrics.avgRoas >= 2 ? "text-amber-500" : "text-red-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      {performanceAlerts.length > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Performance Alerts ({performanceAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[220px] overflow-y-auto">
              {performanceAlerts.map((alert) => {
                const alertStyles: Record<AlertType, { icon: React.ReactNode; bg: string; iconColor: string }> = {
                  critical: {
                    icon: <XCircle className="w-4 h-4" />,
                    bg: 'bg-red-500/10',
                    iconColor: 'text-red-500',
                  },
                  warning: {
                    icon: <AlertTriangle className="w-4 h-4" />,
                    bg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                  },
                  info: {
                    icon: <AlertCircle className="w-4 h-4" />,
                    bg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                  },
                  success: {
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    bg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                  },
                };

                const style = alertStyles[alert.type];
                const status = getOfferStatus(alert.offer);
                const statusConfig = offerStatusConfig[status];

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors hover:bg-muted/30",
                      style.bg
                    )}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", style.iconColor)}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        {alert.metric && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {alert.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                    {alert.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 text-xs h-7"
                        onClick={() => handleEditOffer(alert.offer)}
                      >
                        {alert.action}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Performance Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center p-3 bg-muted/50 rounded-lg">
              <Eye className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-lg font-bold">{formatNumber(summaryMetrics.totalImpressions)}</p>
              <p className="text-xs text-muted-foreground">Impressions</p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex-1 text-center p-3 bg-muted/50 rounded-lg">
              <MousePointer className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-lg font-bold">{formatNumber(summaryMetrics.totalClicks)}</p>
              <p className="text-xs text-muted-foreground">Clicks ({(summaryMetrics.totalImpressions > 0 ? (summaryMetrics.totalClicks / summaryMetrics.totalImpressions) * 100 : 0).toFixed(1)}%)</p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex-1 text-center p-3 bg-muted/50 rounded-lg">
              <ShoppingCart className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-lg font-bold">{formatNumber(summaryMetrics.totalConversions)}</p>
              <p className="text-xs text-muted-foreground">Conversions ({summaryMetrics.avgConversionRate.toFixed(1)}%)</p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex-1 text-center p-3 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 mx-auto mb-1.5 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(summaryMetrics.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Offers Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {offerAnalytics.length > 0 ? (
            <div className="divide-y">
              {offerAnalytics.map((analytics) => {
                const status = getOfferStatus(analytics.offer);
                const statusConfig = offerStatusConfig[status];
                const daysRemaining = getOfferDaysRemaining(analytics.offer);
                const marketplaceAnalytics = generateMarketplaceAnalytics(analytics.offer, productId);
                const activeMarketplaces = marketplaceAnalytics.filter(m => m.status === 'active').length;
                const isExpanded = expandedOffer === analytics.offer.id;

                return (
                  <Collapsible 
                    key={analytics.offer.id}
                    open={isExpanded}
                    onOpenChange={() => setExpandedOffer(isExpanded ? null : analytics.offer.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{analytics.offer.name}</p>
                              <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>
                              {status === 'ending_soon' && (
                                <span className="text-xs text-amber-500">{daysRemaining}d left</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatOfferDiscount(analytics.offer)}</span>
                              <span className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                {activeMarketplaces}/{MARKETPLACE_LIST.length} marketplaces
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-right">
                            <div>
                              <p className="text-xs text-muted-foreground">Conv.</p>
                              <p className="font-semibold">{analytics.conversions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Revenue</p>
                              <p className="font-semibold text-emerald-500">{formatCurrency(analytics.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">ROAS</p>
                              <p className={cn(
                                "font-semibold",
                                analytics.roas >= 3 ? "text-emerald-500" : analytics.roas >= 2 ? "text-amber-500" : "text-red-500"
                              )}>
                                {analytics.roas.toFixed(2)}x
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditOffer(analytics.offer)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Offer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRemoveFromOffer(analytics.offer)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from Offer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(analytics.offer)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Offer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground py-2 border-b mb-2 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          Marketplace Performance
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                          {marketplaceAnalytics.map((ma) => {
                            const isMarketplaceActive = analytics.offer.marketplaces.includes(ma.marketplace);
                            const statusColors = {
                              active: 'border-emerald-500/50 bg-emerald-500/5',
                              inactive: 'border-amber-500/50 bg-amber-500/5',
                              not_listed: 'border-slate-500/30 bg-slate-500/5 opacity-60',
                            };
                            
                            return (
                              <div
                                key={ma.marketplace}
                                className={cn(
                                  "p-3 rounded-lg border transition-colors",
                                  isMarketplaceActive ? statusColors.active : statusColors.not_listed
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{ma.marketplace}</span>
                                  <Switch
                                    checked={isMarketplaceActive}
                                    onCheckedChange={() => handleToggleMarketplace(
                                      analytics.offer.id, 
                                      ma.marketplace, 
                                      isMarketplaceActive
                                    )}
                                    className="scale-75"
                                  />
                                </div>
                                {isMarketplaceActive ? (
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Revenue</span>
                                      <span className="font-mono text-emerald-500">{formatCurrency(ma.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Conv. Rate</span>
                                      <span className="font-mono">{ma.conversionRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">ROAS</span>
                                      <span className={cn(
                                        "font-mono",
                                        ma.roas >= 3 ? "text-emerald-500" : ma.roas >= 2 ? "text-amber-500" : "text-red-500"
                                      )}>
                                        {ma.roas.toFixed(2)}x
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Ad Spend</span>
                                      <span className="font-mono text-orange-500">{formatCurrency(ma.adSpend)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">
                                    Click toggle to activate
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No offers for this product</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2"
                onClick={() => setCreateOfferOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create an Offer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Offer Dialog */}
      <CreateOfferDialog
        open={createOfferOpen}
        onOpenChange={setCreateOfferOpen}
        onCreateOffer={handleCreateOffer}
        products={mockProducts}
        preselectedProductIds={[productId]}
        hideProductSelection={true}
      />

      {/* Edit Offer Dialog */}
      {selectedOffer && (
        <EditOfferDialog
          open={editOfferOpen}
          onOpenChange={setEditOfferOpen}
          onUpdateOffer={handleUpdateOffer}
          offer={selectedOffer}
          products={mockProducts}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{offerToDelete?.name}"? This will remove the offer from all products. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOfferToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
