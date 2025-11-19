export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  type: 'receita' | 'despesa fixa' | 'despesa variável';
  category: string | null;
  payment_method: string | null;
  created_at: string;
};