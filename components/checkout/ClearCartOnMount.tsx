'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/store';

/**
 * Drop the cart on mount. Used on the confirmation page so that once a
 * card payment has redirected back, the basket is empty for the next
 * order. Kept tiny so it doesn't pull cart state into the SSR'd page.
 */
export default function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
