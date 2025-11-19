import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionsTable } from '@/components/TransactionsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

const fetchTransactions = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as Transaction[];
};

const Transactions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useSession();

  const { data: transactions, isLoading, isError, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchTransactions(user?.id),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lançamentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <TransactionForm setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

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
        <TransactionsTable transactions={transactions} />
      )}
    </div>
  );
};

export default Transactions;