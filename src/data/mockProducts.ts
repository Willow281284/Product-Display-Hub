import { Product, MarketplaceStatus, ProductVariation, RestockStatus, ProductType, KitComponent } from '@/types/product';

// Extended marketplace platforms
export const marketplacePlatforms = [
  'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target', 
  'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot', 
  'lowes', 'wayfair', 'overstock'
] as const;

// Sample product names by category
const productNames = {
  gaming: [
    'Sniper Elite 3 Ultimate Edition - Nintendo Switch',
    'The Golf Club 2019 Featuring PGA Tour',
    'Paw Patrol On A Roll! for Nintendo Switch',
    'Evil West',
    'Monster Hunter Generations Ultimate',
    'ARK: Survival Evolved BL NSW',
    'Assassins Creed Odyssey',
    'Persona 3 Reload',
    'Final Fantasy XVI',
    'Hogwarts Legacy',
    'Spider-Man 2 PS5',
    'Call of Duty Modern Warfare III',
    'Zelda Tears of the Kingdom',
    'Mario Kart 8 Deluxe',
    'Super Smash Bros Ultimate',
    'Pokemon Scarlet',
    'Pokemon Violet',
    'FIFA 24',
    'NBA 2K24',
    'Madden NFL 24',
  ],
  electronics: [
    'Wireless Bluetooth Headphones Pro',
    'USB-C Fast Charging Cable 6ft',
    'Mechanical Gaming Keyboard RGB',
    'Wireless Gaming Mouse 16000 DPI',
    '4K HDMI Cable 10ft',
    'Portable Power Bank 20000mAh',
    'Webcam HD 1080p with Microphone',
    'USB Hub 7-Port with Power Adapter',
    'Noise Cancelling Earbuds',
    'Smart Watch Fitness Tracker',
    'Tablet Stand Adjustable',
    'Laptop Cooling Pad',
    'External SSD 1TB',
    'Wireless Charger Pad',
    'Bluetooth Speaker Waterproof',
  ],
  accessories: [
    'Phone Case Premium Leather',
    'Screen Protector Tempered Glass',
    'Camera Lens Kit Universal',
    'Tripod Stand Professional',
    'Memory Card 256GB',
    'Controller Grip Sleeves',
    'Headset Stand RGB',
    'Cable Management Kit',
    'Desk Mat XXL Gaming',
    'Monitor Light Bar',
  ],
};

const brandsList = [
  'Nintendo', 'Sony', 'Microsoft', 'Ubisoft', 'EA Sports', 'Capcom',
  'Atlus', 'Square Enix', '2K Games', 'Activision', 'Bandai Namco',
  'Sega', 'Konami', 'Bethesda', 'Rockstar', 'Take-Two',
  'Focus Entertainment', 'THQ Nordic', 'Deep Silver', 'Devolver Digital',
  'Anker', 'Logitech', 'Razer', 'SteelSeries', 'Corsair', 'HyperX',
  'JBL', 'Sony Audio', 'Bose', 'Samsung', 'SanDisk', 'Western Digital',
];

const vendors = [
  'GameStop Distribution', 'Amazon Wholesale', 'Best Buy Direct',
  'Target Supply', 'Walmart Vendors', 'Costco Wholesale',
  'Tech Distributors Inc', 'Gaming Supply Co', 'Electronics Hub',
  'Direct Import LLC', 'Prime Vendors', 'Quality Goods Inc',
];

// Helper to generate random string
const randomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Helper to generate random SKU
const generateSKU = () => `${randomString(2)}-${randomString(4)}-${randomString(4)}`;

// Helper to generate random ASIN
const generateASIN = () => `B${randomString(9)}`;

// Helper to generate random identifiers
const generateIdentifiers = () => ({
  fnsku: `X${randomString(3)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  gtin: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0'),
  ean: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0'),
  isbn: Math.random() > 0.7 ? `978${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}` : '',
});

// Helper to generate random marketplace statuses
const generateMarketplaces = (): MarketplaceStatus[] => {
  // 10% chance of being "Not Listed" (no marketplaces)
  if (Math.random() < 0.1) {
    return [];
  }
  
  const numMarketplaces = Math.floor(Math.random() * 10) + 3; // 3-12 marketplaces
  const shuffled = [...marketplacePlatforms].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, numMarketplaces);
  
  return selected.map((platform) => {
    const rand = Math.random();
    let status: 'live' | 'inactive' | 'error';
    if (rand < 0.5) status = 'live';
    else if (rand < 0.9) status = 'inactive';
    else status = 'error';
    
    return { platform, status };
  });
};

// Variation options
const variationTypes: ProductVariation['type'][] = ['color', 'size', 'style', 'material'];
const variationValues: Record<ProductVariation['type'], string[]> = {
  color: ['Black', 'White', 'Red', 'Blue', 'Green', 'Silver', 'Gold', 'Navy', 'Gray'],
  size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6ft', '10ft', '15ft'],
  style: ['Classic', 'Modern', 'Vintage', 'Sport', 'Casual'],
  material: ['Leather', 'Plastic', 'Metal', 'Wood', 'Fabric', 'Silicone'],
};

// Generate a single random product (base or variation)
const generateProduct = (id: number, isVariation: boolean = false, parentProductId?: string, variationNum?: number): Product => {
  const allNames = [...productNames.gaming, ...productNames.electronics, ...productNames.accessories];
  const baseName = allNames[Math.floor(Math.random() * allNames.length)];
  const edition = Math.random() > 0.5 ? ` - ${['Standard', 'Deluxe', 'Premium', 'Pro', 'Limited'][Math.floor(Math.random() * 5)]} Edition` : '';
  
  const salePrice = Math.floor(Math.random() * 150) + 10 + Math.random();
  const landedCost = salePrice * (0.4 + Math.random() * 0.3);
  const shippingCost = Math.random() * 10 + 2;
  const grossProfitAmount = salePrice - landedCost - shippingCost;
  const grossProfitPercent = (grossProfitAmount / salePrice) * 100;
  
  const purchaseQty = Math.floor(Math.random() * 100);
  const soldQty = Math.floor(Math.random() * purchaseQty);
  const soldQtyLastMonth = Math.floor(Math.random() * Math.min(soldQty, 20));
  const soldQtyLastQuarter = soldQtyLastMonth + Math.floor(Math.random() * Math.min(soldQty - soldQtyLastMonth, 30));
  const soldQtyLastYear = soldQtyLastQuarter + Math.floor(Math.random() * Math.min(soldQty - soldQtyLastQuarter, 50));
  const returnQty = Math.floor(Math.random() * soldQty * 0.1);
  const stockQty = purchaseQty - soldQty + returnQty;
  
  // Calculate velocity (units sold per day based on last month)
  const velocity = Math.round((soldQtyLastMonth / 30) * 100) / 100;
  
  // Calculate stock days (how many days of stock remaining)
  const stockDays = velocity > 0 ? Math.round(stockQty / velocity) : stockQty > 0 ? 999 : 0;
  
  // Determine restock status based on stock days
  let restockStatus: RestockStatus;
  if (stockQty === 0) {
    restockStatus = 'out_of_stock';
  } else if (stockDays <= 7) {
    restockStatus = 'reorder_now';
  } else if (stockDays <= 30) {
    restockStatus = 'low_stock';
  } else {
    restockStatus = 'in_stock';
  }
  
  // Calculate suggested restock quantity (target 60 days of stock)
  const targetDays = 60;
  const suggestedRestockQty = velocity > 0 ? Math.max(0, Math.ceil(velocity * targetDays - stockQty)) : 0;
  
  const identifiers = generateIdentifiers();
  
  // Generate variation info if this is a variation product
  let variation: ProductVariation | null = null;
  let variationId: string | null = null;
  const productId = parentProductId || (2800 + id).toString();
  
  if (isVariation && variationNum !== undefined) {
    const varType = variationTypes[Math.floor(Math.random() * variationTypes.length)];
    const varValue = variationValues[varType][Math.floor(Math.random() * variationValues[varType].length)];
    variationId = `${productId}-${variationNum}`;
    variation = {
      variationId: variationId,
      type: varType,
      value: varValue,
    };
  }

  // Determine product type
  const isKit = Math.random() > 0.7;
  let productType: ProductType;
  let kitComponents: KitComponent[] = [];
  
  if (isVariation) {
    productType = 'variation';
  } else if (isKit) {
    productType = 'kit';
    // Generate 2-5 random kit components (will be linked to actual products later)
    const numComponents = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numComponents; i++) {
      kitComponents.push({
        productId: (2800 + Math.floor(Math.random() * 400)).toString(),
        quantity: Math.floor(Math.random() * 3) + 1,
      });
    }
  } else {
    productType = 'single';
  }
  
  return {
    id: id.toString(),
    image: `https://picsum.photos/seed/${id}/100/100`,
    name: baseName + edition + (variation ? ` (${variation.value})` : ''),
    vendorSku: generateSKU(),
    manufacturerPart: `${randomString(3)}-${randomString(3)}-${Math.floor(Math.random() * 1000)}`,
    asin: generateASIN(),
    fnsku: identifiers.fnsku,
    gtin: identifiers.gtin,
    ean: identifiers.ean,
    isbn: identifiers.isbn,
    inventoryDifference: Math.floor(Math.random() * 10) - 5,
    productId,
    variationId,
    variation,
    vendorName: vendors[Math.floor(Math.random() * vendors.length)],
    brand: brandsList[Math.floor(Math.random() * brandsList.length)],
    kitProduct: isKit, // deprecated - kept for backward compatibility
    productType,
    kitComponents,
    landedCost: Math.round(landedCost * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    salePrice: Math.round(salePrice * 100) / 100,
    purchaseQty,
    soldQty,
    soldQtyLastMonth,
    soldQtyLastQuarter,
    soldQtyLastYear,
    stockQty,
    returnQty,
    grossProfitPercent: Math.round(grossProfitPercent * 100) / 100,
    grossProfitAmount: Math.round(grossProfitAmount * 100) / 100,
    marketplaces: generateMarketplaces(),
    velocity,
    stockDays,
    restockStatus,
    suggestedRestockQty,
  };
};

// Generate 500 mock products with some having variations
const generateAllProducts = (): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;
  
  while (products.length < 500) {
    // 30% chance of being a product with variations
    const hasVariations = Math.random() < 0.3;
    
    if (hasVariations && products.length < 495) {
      // Generate parent product ID
      const parentProductId = (2800 + idCounter).toString();
      const numVariations = Math.floor(Math.random() * 5) + 2; // 2-6 variations
      
      // Generate variation products
      for (let v = 1; v <= numVariations && products.length < 500; v++) {
        products.push(generateProduct(idCounter++, true, parentProductId, v));
      }
    } else {
      // Regular product without variations
      products.push(generateProduct(idCounter++, false));
    }
  }
  
  return products;
};

export const mockProducts: Product[] = generateAllProducts();

// Export unique brands from generated data (named 'brands' for backward compatibility)
export const brands = [...new Set(mockProducts.map(p => p.brand))].sort();
