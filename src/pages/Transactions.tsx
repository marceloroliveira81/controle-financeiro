import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionsTable } from '@/components/TransactionsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';
import { showSuccess, showError } from '@/utils/toast';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import {
  TransactionsFilter,
  Filters,
} from '@/components/TransactionsFilter';
import { format } from 'date-fns';

const fetchTransactions = async (
  userId: string | undefined,
  filters: Filters
) => {
  if (!userId) return [];

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (filters.dateRange?.from) {
    query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'));
  }
  if (filters.dateRange?.to) {
    query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'));
  }
  if (filters.description) {
    query = query.ilike('description', `%${filters.description}%`);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as Transaction[];
};

const Transactions = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [filters, setFilters] = useState<Filters>({
    dateRange: undefined,
    description: '',
    type: '',
  });
  const { user } = useSession();
  const queryClient = useQueryClient();

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: () => fetchTransactions(user?.id, filters),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Lançamento excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsConfirmDeleteOpen(false);
    },
    onError: (error) => {
      showError(`Erro ao excluir lançamento: ${error.message}`);
    },
  });

  const handleAdd = () => {
    setSelectedTransaction(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteMutation.mutate(selectedTransaction.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lançamentos</h1>
        <Button onClick={handleAdd}>Adicionar Lançamento</Button>
      </div>

      <TransactionsFilter filters={filters} onFilterChange={setFilters} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            setOpen={setIsFormOpen}
            transaction={selectedTransaction}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os lançamentos. Tente novamente mais tarde.
            <br />
            <small>{error.message}</small>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && transactions && (
        <TransactionsTable
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Transactions;