import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/productData';
import ProductDetailPageClient from './ProductDetailPageClient';
import Footer from '@/components/Footer';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const productId = params.id as 'youth' | 'roman';
  
  if (productId !== 'youth' && productId !== 'roman') {
    notFound();
  }

  const product = getProductById(productId);
  
  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col pb-32 md:pb-24">
      <div className="flex-1">
        <ProductDetailPageClient product={product} productId={productId} />
      </div>
      <Footer />
    </div>
  );
}

