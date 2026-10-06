import { useQuery } from '@tanstack/react-query';
import { customersApi, productsApi } from '../services/api';

export interface Snapshot {
  products: Awaited<ReturnType<typeof productsApi.all>>;
  customers: Awaited<ReturnType<typeof customersApi.all>>;
}

export function useSnapshot(enabled = true) {
  return useQuery<Snapshot>({
    queryKey: ['snapshot'],
    queryFn: async () => {
      const [products, customers] = await Promise.all([productsApi.all(), customersApi.all()]);
      return { products, customers };
    },
    enabled,
    staleTime: 60_000,
  });
}
