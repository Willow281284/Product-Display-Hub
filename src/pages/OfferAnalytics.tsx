import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ShoppingCart,
  Tag,
  Eye,
  MousePointer,
  ArrowUpRight,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  Package,
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  Pencil,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  Store,
  Globe,
  Filter,
} from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  Offer, 
  getOfferStatus, 
  formatOfferDiscount,
  offerStatusConfig,
  offerTypeLabels,
  getOfferDaysRemaining,
} from '@/types/offer';
import { useOffers } from '@/hooks/useOffers';
import { mockProducts } from '@/data/mockProducts';
import { Product } from '@/types/product';
import { EditOfferDialog } from '@/components/products/EditOfferDialog';
import { useToast } from '@/hooks/use-toast';

interface OfferAnalytics {
  offer: Offer;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenueImpact: number;
  averageOrderValue: number;
  costPerConversion: number;
  roi: number;
  adSpend: number;
  roas: number; // Return on Ad Spend
}

type AlertType = 'warning' | 'critical' | 'success' | 'info';

interface PerformanceAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  offer: Offer;
  metric?: string;
  action?: 'extend' | 'review' | 'adjust' | 'promote';
}

interface ProductAnalytics {
  product: Product;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(0, 84%, 60%)',
];

function generateOfferAnalytics(offer: Offer, index: number): OfferAnalytics {
  const seed = offer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (index + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };

  const status = getOfferStatus(offer);
  const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';
  const multiplier = isActive ? 1 : 0.3;

  const impressions = random(5000, 50000) * multiplier;
  const clicks = Math.floor(impressions * (random(5, 15) / 100));
  const conversions = Math.floor(clicks * (random(3, 12) / 100));
  const revenue = conversions * random(25, 150);
  const revenueImpact = revenue * (random(10, 35) / 100);
  const averageOrderValue = conversions > 0 ? revenue / conversions : 0;
  const discountCost = revenue * ((offer.discountPercent || 10) / 100);
  const costPerConversion = conversions > 0 ? discountCost / conversions : 0;
  const roi = discountCost > 0 ? ((revenueImpact - discountCost) / discountCost) * 100 : 0;
  const adSpend = random(100, 2000) * multiplier;
  const roas = adSpend > 0 ? revenue / adSpend : 0;

  return {
    offer,
    impressions: Math.floor(impressions),
    clicks,
    conversions,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    revenue,
    revenueImpact,
    averageOrderValue,
    costPerConversion,
    roi,
    adSpend,
    roas,
  };
}

function generateProductAnalytics(product: Product, offerIndex: number, productIndex: number): ProductAnalytics {
  const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (offerIndex + 1) * (productIndex + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };

  const impressions = random(500, 5000);
  const clicks = Math.floor(impressions * (random(5, 15) / 100));
  const conversions = Math.floor(clicks * (random(3, 12) / 100));
  const revenue = conversions * random(25, 150);

  return {
    product,
    impressions,
    clicks,
    conversions,
    revenue,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
  };
}

function generateMarketplaceAnalytics(offer: Offer, offerIndex: number): MarketplaceAnalytics[] {
  const offerMarketplaces = offer.marketplaces.length > 0 ? offer.marketplaces : MARKETPLACE_LIST.slice(0, 3);
  
  return MARKETPLACE_LIST.map((marketplace, mpIndex) => {
    const seed = (offer.id + marketplace).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number) => {
      const x = Math.sin(seed * (offerIndex + 1) * (mpIndex + 1)) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min) + min);
    };

    const isActive = offerMarketplaces.includes(marketplace);
    const status: MarketplaceAnalytics['status'] = isActive 
      ? (random(0, 10) > 2 ? 'active' : 'inactive')
      : 'not_listed';
    
    const multiplier = status === 'active' ? 1 : status === 'inactive' ? 0.1 : 0;
    
    const impressions = random(1000, 15000) * multiplier;
    const clicks = Math.floor(impressions * (random(5, 15) / 100));
    const conversions = Math.floor(clicks * (random(3, 12) / 100));
    const revenue = conversions * random(25, 150);
    const adSpend = random(50, 800) * multiplier;
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

export default function OfferAnalyticsPage() {
  const { toast } = useToast();
  const { offers, updateOffer, deleteOffer } = useOffers();
  const [timePeriod, setTimePeriod] = useState('30');
  const [sortBy, setSortBy] = useState<'revenue' | 'conversions' | 'roi'>('revenue');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [editOfferOpen, setEditOfferOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [marketplacePopoverOpen, setMarketplacePopoverOpen] = useState(false);

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

  const toggleOfferExpanded = (offerId: string) => {
    setExpandedOffers(prev => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  };

  const offerAnalytics = useMemo(() => {
    return offers.map((offer, index) => generateOfferAnalytics(offer, index));
  }, [offers]);

  // Generate marketplace analytics for all offers
  const offerMarketplaceAnalytics = useMemo(() => {
    return offers.reduce((acc, offer, index) => {
      acc[offer.id] = generateMarketplaceAnalytics(offer, index);
      return acc;
    }, {} as Record<string, MarketplaceAnalytics[]>);
  }, [offers]);

  // Filter offers based on selected marketplaces
  const filteredOfferAnalytics = useMemo(() => {
    if (selectedMarketplaces.length === 0) {
      return offerAnalytics;
    }
    
    return offerAnalytics.filter(a => {
      const offerMarketplaces = a.offer.marketplaces.length > 0 
        ? a.offer.marketplaces 
        : MARKETPLACE_LIST.slice(0, 3);
      return selectedMarketplaces.some(mp => offerMarketplaces.includes(mp));
    });
  }, [offerAnalytics, selectedMarketplaces]);

  // Compute summary metrics based on filtered offers and selected marketplaces
  const summaryMetrics = useMemo(() => {
    const activeOffers = filteredOfferAnalytics.filter(a => {
      const status = getOfferStatus(a.offer);
      return status === 'active' || status === 'ending_soon' || status === 'just_created';
    });

    // If specific marketplaces are selected, aggregate from marketplace-level data
    if (selectedMarketplaces.length > 0 && selectedMarketplaces.length < MARKETPLACE_LIST.length) {
      let totalRevenue = 0, totalRevenueImpact = 0, totalConversions = 0, totalClicks = 0, totalImpressions = 0, totalAdSpend = 0;
      
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
        totalRevenueImpact += a.revenueImpact * (selectedMarketplaces.length / MARKETPLACE_LIST.length);
      });

      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const avgROI = activeOffers.length > 0 
        ? activeOffers.reduce((sum, a) => sum + a.roi, 0) / activeOffers.length 
        : 0;
      const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

      return {
        activeOffers: activeOffers.length,
        totalOffers: filteredOfferAnalytics.length,
        totalRevenue,
        totalRevenueImpact,
        totalConversions,
        totalClicks,
        totalImpressions,
        avgConversionRate,
        avgROI,
        clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        totalAdSpend,
        avgRoas,
      };
    }

    // Default: aggregate from offer-level data
    const totalRevenue = activeOffers.reduce((sum, a) => sum + a.revenue, 0);
    const totalRevenueImpact = activeOffers.reduce((sum, a) => sum + a.revenueImpact, 0);
    const totalConversions = activeOffers.reduce((sum, a) => sum + a.conversions, 0);
    const totalClicks = activeOffers.reduce((sum, a) => sum + a.clicks, 0);
    const totalImpressions = activeOffers.reduce((sum, a) => sum + a.impressions, 0);
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgROI = activeOffers.length > 0 
      ? activeOffers.reduce((sum, a) => sum + a.roi, 0) / activeOffers.length 
      : 0;
    const totalAdSpend = activeOffers.reduce((sum, a) => sum + a.adSpend, 0);
    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    return {
      activeOffers: activeOffers.length,
      totalOffers: filteredOfferAnalytics.length,
      totalRevenue,
      totalRevenueImpact,
      totalConversions,
      totalClicks,
      totalImpressions,
      avgConversionRate,
      avgROI,
      clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalAdSpend,
      avgRoas,
    };
  }, [filteredOfferAnalytics, selectedMarketplaces, offerMarketplaceAnalytics]);

  const performanceAlerts = useMemo((): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];
    const avgConversionRate = summaryMetrics.avgConversionRate;
    const avgROI = summaryMetrics.avgROI;

    filteredOfferAnalytics.forEach(analytics => {
      const status = getOfferStatus(analytics.offer);
      const daysRemaining = getOfferDaysRemaining(analytics.offer);
      const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';

      if (!isActive) return;

      if (status === 'ending_soon' && analytics.conversionRate > avgConversionRate * 1.2) {
        alerts.push({
          id: `ending-high-${analytics.offer.id}`,
          type: 'warning',
          title: 'High-Performer Ending Soon',
          description: `"${analytics.offer.name}" has ${analytics.conversionRate.toFixed(1)}% conversion rate but ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider extending.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% conv.`,
          action: 'extend',
        });
      }

      if (analytics.conversionRate < avgConversionRate * 0.5 && analytics.impressions > 1000) {
        alerts.push({
          id: `low-conv-${analytics.offer.id}`,
          type: 'critical',
          title: 'Low Conversion Rate',
          description: `"${analytics.offer.name}" has only ${analytics.conversionRate.toFixed(1)}% conversion rate (avg: ${avgConversionRate.toFixed(1)}%). Review offer terms.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% vs ${avgConversionRate.toFixed(1)}%`,
          action: 'review',
        });
      }

      if (analytics.roi < 0) {
        alerts.push({
          id: `neg-roi-${analytics.offer.id}`,
          type: 'critical',
          title: 'Negative ROI',
          description: `"${analytics.offer.name}" has ${analytics.roi.toFixed(0)}% ROI. The discount cost exceeds revenue impact.`,
          offer: analytics.offer,
          metric: `${analytics.roi.toFixed(0)}% ROI`,
          action: 'adjust',
        });
      }

      if (analytics.conversionRate > avgConversionRate * 1.5 && analytics.roi > avgROI * 1.5) {
        alerts.push({
          id: `top-${analytics.offer.id}`,
          type: 'success',
          title: 'Top Performer',
          description: `"${analytics.offer.name}" is outperforming with ${analytics.conversionRate.toFixed(1)}% conversion and ${analytics.roi.toFixed(0)}% ROI.`,
          offer: analytics.offer,
          metric: `${analytics.roi.toFixed(0)}% ROI`,
        });
      }

      if (analytics.impressions < 500 && daysRemaining < 7) {
        alerts.push({
          id: `low-imp-${analytics.offer.id}`,
          type: 'info',
          title: 'Low Visibility',
          description: `"${analytics.offer.name}" has only ${analytics.impressions} impressions. Consider promoting it more.`,
          offer: analytics.offer,
          metric: `${analytics.impressions} views`,
          action: 'promote',
        });
      }
    });

    const priority: Record<AlertType, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    return alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  }, [filteredOfferAnalytics, summaryMetrics]);

  const handleAlertAction = (alert: PerformanceAlert) => {
    setSelectedOffer(alert.offer);
    setEditOfferOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setEditOfferOpen(true);
  };

  const handleDeleteClick = (offer: Offer, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleRemoveProductFromOffer = (offerId: string, productId: string, productName: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      const updatedProductIds = offer.productIds.filter(id => id !== productId);
      updateOffer(offerId, { productIds: updatedProductIds });
      toast({
        title: "Product Removed",
        description: `"${productName}" has been removed from the offer.`,
      });
    }
  };

  const handleUpdateOffer = (offerId: string, updates: Partial<Offer>) => {
    updateOffer(offerId, updates);
    toast({
      title: "Offer Updated",
      description: "The offer has been updated successfully.",
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

  const performanceChartData = useMemo(() => {
    return filteredOfferAnalytics
      .filter(a => {
        const status = getOfferStatus(a.offer);
        return status !== 'expired';
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, 6)
      .map(a => ({
        name: a.offer.name.length > 15 ? a.offer.name.slice(0, 15) + '...' : a.offer.name,
        revenue: Math.round(a.revenue),
        conversions: a.conversions,
        roi: Math.round(a.roi),
      }));
  }, [filteredOfferAnalytics, sortBy]);

  const typeDistribution = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    filteredOfferAnalytics.forEach(a => {
      const type = offerTypeLabels[a.offer.type];
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [filteredOfferAnalytics]);

  const revenueTrendData = useMemo(() => {
    const days = parseInt(timePeriod);
    return Array.from({ length: Math.min(days, 14) }, (_, i) => ({
      day: `Day ${i + 1}`,
      revenue: Math.floor(Math.random() * 5000 + 2000),
      conversions: Math.floor(Math.random() * 100 + 20),
    }));
  }, [timePeriod]);

  const sortedAnalytics = useMemo(() => {
    return [...filteredOfferAnalytics].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [filteredOfferAnalytics, sortBy]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(value));

  const getActionLabel = (action: PerformanceAlert['action']) => {
    switch (action) {
      case 'extend': return 'Extend Offer';
      case 'review': return 'Review';
      case 'adjust': return 'Adjust Discount';
      case 'promote': return 'Promote';
      default: return 'View';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Products
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Offers Analytics</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Marketplace Filter */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="w-4 h-4" />
            </div>
            <Popover open={marketplacePopoverOpen} onOpenChange={setMarketplacePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[160px] justify-between">
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

            {/* Period Selector */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Period:</span>
            </div>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Offers</p>
                    <p className="text-2xl font-bold">{summaryMetrics.activeOffers}</p>
                    <p className="text-xs text-muted-foreground">of {summaryMetrics.totalOffers} total</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</p>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-xs">+{formatCurrency(summaryMetrics.totalRevenueImpact)} impact</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{summaryMetrics.avgConversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(summaryMetrics.totalConversions)} conversions</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Percent className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. ROI</p>
                    <p className="text-2xl font-bold">{summaryMetrics.avgROI.toFixed(0)}%</p>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      summaryMetrics.avgROI > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {summaryMetrics.avgROI > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>vs baseline</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Zap className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ad Spend Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Ad Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalAdSpend)}</p>
                    <p className="text-xs text-muted-foreground">across active offers</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className="text-2xl font-bold">{summaryMetrics.avgRoas.toFixed(2)}x</p>
                    <p className="text-xs text-muted-foreground">Return on Ad Spend</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-full",
                    summaryMetrics.avgRoas >= 3 ? "bg-emerald-500/10" : summaryMetrics.avgRoas >= 2 ? "bg-amber-500/10" : "bg-red-500/10"
                  )}>
                    <TrendingUp className={cn(
                      "w-5 h-5",
                      summaryMetrics.avgRoas >= 3 ? "text-emerald-500" : summaryMetrics.avgRoas >= 2 ? "text-amber-500" : "text-red-500"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost per Click</p>
                    <p className="text-2xl font-bold">
                      {summaryMetrics.totalClicks > 0 
                        ? formatCurrency(summaryMetrics.totalAdSpend / summaryMetrics.totalClicks)
                        : '$0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatNumber(summaryMetrics.totalClicks)} clicks</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-full">
                    <MousePointer className="w-5 h-5 text-cyan-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost per Conversion</p>
                    <p className="text-2xl font-bold">
                      {summaryMetrics.totalConversions > 0 
                        ? formatCurrency(summaryMetrics.totalAdSpend / summaryMetrics.totalConversions)
                        : '$0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatNumber(summaryMetrics.totalConversions)} conversions</p>
                  </div>
                  <div className="p-3 bg-violet-500/10 rounded-full">
                    <ShoppingCart className="w-5 h-5 text-violet-500" />
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
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {performanceAlerts.map((alert) => {
                    const alertStyles: Record<AlertType, { icon: React.ReactNode; bg: string; iconColor: string }> = {
                      critical: {
                        icon: <XCircle className="w-5 h-5" />,
                        bg: 'bg-red-500/10',
                        iconColor: 'text-red-500',
                      },
                      warning: {
                        icon: <AlertTriangle className="w-5 h-5" />,
                        bg: 'bg-amber-500/10',
                        iconColor: 'text-amber-500',
                      },
                      info: {
                        icon: <AlertCircle className="w-5 h-5" />,
                        bg: 'bg-blue-500/10',
                        iconColor: 'text-blue-500',
                      },
                      success: {
                        icon: <CheckCircle2 className="w-5 h-5" />,
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
                          "flex items-start gap-3 p-4 transition-colors hover:bg-muted/30",
                          style.bg
                        )}
                      >
                        <div className={cn("mt-0.5 flex-shrink-0", style.iconColor)}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            {alert.metric && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {alert.metric}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatOfferDiscount(alert.offer)}
                            </span>
                          </div>
                        </div>
                        {alert.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0 text-xs"
                            onClick={() => handleAlertAction(alert)}
                          >
                            {getActionLabel(alert.action)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funnel Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center p-4 bg-muted/50 rounded-lg">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatNumber(summaryMetrics.totalImpressions)}</p>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1 text-center p-4 bg-muted/50 rounded-lg">
                  <MousePointer className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatNumber(summaryMetrics.totalClicks)}</p>
                  <p className="text-xs text-muted-foreground">Clicks ({summaryMetrics.clickThroughRate.toFixed(1)}%)</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1 text-center p-4 bg-muted/50 rounded-lg">
                  <ShoppingCart className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatNumber(summaryMetrics.totalConversions)}</p>
                  <p className="text-xs text-muted-foreground">Conversions ({summaryMetrics.avgConversionRate.toFixed(1)}%)</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1 text-center p-4 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summaryMetrics.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Offers List with Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Active Offers ({offerAnalytics.filter(a => {
                  const status = getOfferStatus(a.offer);
                  return status === 'active' || status === 'ending_soon' || status === 'just_created';
                }).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {offerAnalytics
                  .filter(a => {
                    const status = getOfferStatus(a.offer);
                    return status === 'active' || status === 'ending_soon' || status === 'just_created';
                  })
                  .map((analytics, offerIndex) => {
                    const status = getOfferStatus(analytics.offer);
                    const statusConfig = offerStatusConfig[status];
                    const daysRemaining = getOfferDaysRemaining(analytics.offer);
                    const isExpanded = expandedOffers.has(analytics.offer.id);
                    
                    const offerProducts = mockProducts.filter(p => 
                      analytics.offer.productIds.includes(p.id)
                    );
                    
                    const productAnalytics = offerProducts.map((product, pIndex) => 
                      generateProductAnalytics(product, offerIndex, pIndex)
                    );
                    
                    const marketplaceAnalytics = generateMarketplaceAnalytics(analytics.offer, offerIndex);

                    return (
                      <Collapsible 
                        key={analytics.offer.id} 
                        open={isExpanded}
                        onOpenChange={() => toggleOfferExpanded(analytics.offer.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{analytics.offer.name}</h4>
                                  <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                    {statusConfig.label}
                                  </Badge>
                                  {status === 'ending_soon' && (
                                    <span className="text-xs text-amber-500">{daysRemaining}d left</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{formatOfferDiscount(analytics.offer)}</span>
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {analytics.offer.productIds.length} product{analytics.offer.productIds.length > 1 ? 's' : ''}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    {marketplaceAnalytics.filter(m => m.status === 'active').length}/{MARKETPLACE_LIST.length} marketplaces
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-right">
                                <div>
                                  <p className="text-xs text-muted-foreground">Conversions</p>
                                  <p className="font-semibold">{formatNumber(analytics.conversions)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Conv. Rate</p>
                                  <p className="font-semibold">{analytics.conversionRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Revenue</p>
                                  <p className="font-semibold text-emerald-500">{formatCurrency(analytics.revenue)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Ad Spend</p>
                                  <p className="font-semibold text-orange-500">{formatCurrency(analytics.adSpend)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">ROAS</p>
                                  <p className={cn("font-semibold", analytics.roas >= 3 ? "text-emerald-500" : analytics.roas >= 2 ? "text-amber-500" : "text-red-500")}>
                                    {analytics.roas.toFixed(2)}x
                                  </p>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 ml-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditOffer(analytics.offer);
                                    }}>
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Edit Offer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onClick={(e) => handleDeleteClick(analytics.offer, e)}
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
                          <div className="px-4 pb-4 bg-muted/30 space-y-4">
                            {/* Marketplace Performance Section */}
                            <div>
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
                                  const statusLabels = {
                                    active: { label: 'Active', color: 'text-emerald-500' },
                                    inactive: { label: 'Inactive', color: 'text-amber-500' },
                                    not_listed: { label: 'Not Listed', color: 'text-slate-400' },
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
                            
                            {/* Product Performance Section */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground py-2 border-b mb-2 flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" />
                                Product Performance
                              </p>
                              <div className="space-y-2">
                                {productAnalytics.slice(0, 5).map((pa) => (
                                  <div 
                                    key={pa.product.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-background group"
                                  >
                                    <img 
                                      src={pa.product.image} 
                                      alt={pa.product.name}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{pa.product.name}</p>
                                      <p className="text-xs text-muted-foreground">{pa.product.vendorSku}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-right text-sm">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Views</p>
                                        <p className="font-mono">{formatNumber(pa.impressions)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Conv.</p>
                                        <p className="font-mono">{pa.conversions}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Rate</p>
                                        <p className="font-mono">{pa.conversionRate.toFixed(1)}%</p>
                                      </div>
                                      <div className="w-20">
                                        <p className="text-xs text-muted-foreground">Revenue</p>
                                        <p className="font-mono text-emerald-500">{formatCurrency(pa.revenue)}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Link to={`/product/${pa.product.id}`}>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                            Edit
                                          </Button>
                                        </Link>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                          onClick={() => handleRemoveProductFromOffer(analytics.offer.id, pa.product.id, pa.product.name)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {productAnalytics.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    +{productAnalytics.length - 5} more products
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
              </div>
              {offerAnalytics.filter(a => {
                const status = getOfferStatus(a.offer);
                return status === 'active' || status === 'ending_soon' || status === 'just_created';
              }).length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active offers</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Comparison Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Offer Performance</CardTitle>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="conversions">Conversions</SelectItem>
                      <SelectItem value="roi">ROI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100} 
                        tick={{ fontSize: 11 }} 
                      />
                      <Bar 
                        dataKey={sortBy} 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Offer Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Offer Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {typeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue & Conversions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      name="Revenue ($)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      dot={false}
                      name="Conversions"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Offers Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Offer Performance Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Offer</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalytics.slice(0, 10).map((analytics) => {
                      const status = getOfferStatus(analytics.offer);
                      const statusConfig = offerStatusConfig[status];
                      
                      return (
                        <TableRow key={analytics.offer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium truncate max-w-[180px]">{analytics.offer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatOfferDiscount(analytics.offer)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatNumber(analytics.impressions)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatNumber(analytics.clicks)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatNumber(analytics.conversions)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {analytics.conversionRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-500">
                            {formatCurrency(analytics.revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-mono text-sm",
                              analytics.roi > 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {analytics.roi > 0 ? '+' : ''}{analytics.roi.toFixed(0)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

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
              Are you sure you want to delete "{offerToDelete?.name}"? This action cannot be undone.
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
