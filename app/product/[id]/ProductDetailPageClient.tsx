'use client';

import { useRouter } from 'next/navigation';
import { ProductData } from '@/lib/productData';
import ProductDetailContent from '@/components/ProductDetailContent';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { trackFacebookEvent } from '@/components/FacebookPixel';

interface ProductDetailPageClientProps {
  product: ProductData;
  productId: 'youth' | 'roman';
}

const getProductPlanId = (productId: 'youth' | 'roman'): string => {
  if (productId === 'youth') {
    return process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH 
      || process.env.NEXT_PUBLIC_WHOP_PLAN_ID 
      || 'plan_x3WmiSOReZ9yc';
  }
  return process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN
    || process.env.NEXT_PUBLIC_WHOP_PLAN_ID
    || 'plan_yl6F67ovs2E19';
};

export default function ProductDetailPageClient({ product, productId }: ProductDetailPageClientProps) {
  const router = useRouter();

  const handleBuyNow = () => {
    const planId = getProductPlanId(productId);
    trackFacebookEvent('AddToCart', {
      content_name: product.name,
      content_category: product.subtitle,
      value: parseFloat(product.price.replace('$', '')),
      currency: 'USD',
    });
    router.push(`/checkout?planId=${planId}`);
  };

  return (
    <>
      <ProductDetailContent product={product} onBuyNow={handleBuyNow} />
      <FloatingChatWidget selectedProduct={productId} />
    </>
  );
}





