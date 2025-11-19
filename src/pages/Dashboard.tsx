import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Transaction } from '../types';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { SummaryCard } from '@/components/SummaryCard';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ExpensesPieChart } from '../components/charts/ExpensesPieChart';
import { MonthlySummaryChart } from '../components/charts/MonthlySummaryChart';

const fetchMonthTransactions = async (userId: string | undefined) => {
  if (!userId) return [];

  const today = new Date();
  const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, category, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    throw new Error(error.message);
  }
  return data as Pick<Transaction, 'amount' | 'type' | 'category' | 'date'>[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

const Dashboard = () => {
  const { user } = useSession();

  const { data: transactions, isLoading, isError, error } = useQuery({
    queryKey: ['monthTransactions', user?.id],
    queryFn: () => fetchMonthTransactions(user?.id),
    enabled: !!user,
  });

  const { summary, pieChartData, barChartData } = useMemo(() => {
    if (!transactions) {
      return { summary: { totalRevenue: 0, totalExpenses: 0, balance: 0 }, pieChartData: [], barChartData: [] };
    }

    const totalRevenue = transactions
      .filter((t) => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type.startsWith('despesa'))
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalRevenue - totalExpenses;

    const expensesByCategory = transactions
      .filter((t) => t.type.startsWith('despesa') && t.category)
      .reduce((acc, t) => {
        const category = t.category || 'Outros';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const dailySummary = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTransactions = transactions.filter(t => t.date === dayStr);

        const receitas = dayTransactions
            .filter(t => t.type === 'receita')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const despesas = dayTransactions
            .filter(t => t.type.startsWith('despesa'))
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            name: format(day, 'dd'),
            receitas,
            despesas
        };
    });

    return {
      summary: { totalRevenue, totalExpenses, balance },
      pieChartData,
      barChartData: dailySummary,
    };
  }, [transactions]);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return '';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard do Mês</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os dados do dashboard.
          <br />
          <small>{error.message}</small>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard do Mês</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Receitas"
          value={formatCurrency(summary.totalRevenue)}
          icon={ArrowUpCircle}
          valueClassName="text-green-600"
        />
        <SummaryCard
          title="Despesas"
          value={formatCurrency(summary.totalExpenses)}
          icon={ArrowDownCircle}
          valueClassName="text-red-600"
        />
        <SummaryCard
          title="Saldo"
          value={formatCurrency(summary.balance)}
          icon={DollarSign}
          valueClassName={getBalanceColor(summary.balance)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ExpensesPieChart data={pieChartData} />
        <MonthlySummaryChart data={barChartData} />
      </div>
    </div>
  );
};

export default Dashboard;