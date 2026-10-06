import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, customersApi, productsApi, authApi } from '../services/api';
import { toast } from '../stores/ui';
import type { CustomerPayload, CustomerQuery, ProductPayload, ProductQuery } from '../types/models';
import type { ApiError } from '../services/http';

export const queryKeys = {
  products: (query: ProductQuery) => ['products', query] as const,
  customers: (query: CustomerQuery) => ['customers', query] as const,
  categories: ['categories'] as const,
};

function fail(message: string) {
  return (error: unknown) => {
    toast.error(error instanceof Error ? error.message : message);
  };
}

export function useProducts(query: ProductQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCustomers(query: CustomerQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.customers(query),
    queryFn: () => customersApi.list(query),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; payload: ProductPayload }) =>
      input.id ? productsApi.update(input.id, input.payload) : productsApi.create(input.payload),
    onSuccess: (_data, input) => {
      toast.success(input.id ? 'کالا به‌روزرسانی شد' : 'کالا ثبت شد');
      void client.invalidateQueries({ queryKey: ['products'] });
    },
    onError: fail('ثبت کالا ناموفق بود'),
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      toast.success('کالا حذف شد');
      void client.invalidateQueries({ queryKey: ['products'] });
    },
    onError: fail('حذف کالا ناموفق بود'),
  });
}

export function useSaveCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; payload: CustomerPayload }) =>
      input.id ? customersApi.update(input.id, input.payload) : customersApi.create(input.payload),
    onSuccess: (_data, input) => {
      if (input.id) {
        toast.success('مشتری به‌روزرسانی شد');
      } else {
        toast.success('مشتری ثبت شد');
      }
      void client.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      const status = (error as ApiError).status;
      toast.error(status === 409 ? 'این شماره همراه قبلاً ثبت شده است' : (error as Error).message);
    },
  });
}

export function useDeleteCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      toast.success('مشتری حذف شد');
      void client.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: fail('حذف مشتری ناموفق بود'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { current: string; next: string }) => authApi.changePassword(input.current, input.next),
    onSuccess: () => toast.success('رمز عبور تغییر کرد'),
    onError: fail('تغییر رمز عبور ناموفق بود'),
  });
}
