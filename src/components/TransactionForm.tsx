import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast';
import { Transaction } from '../types';

const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  type: z.enum(['receita', 'despesa fixa', 'despesa variável'], { required_error: 'O tipo é obrigatório.' }),
  category: z.string().optional(),
  payment_method: z.string().optional(),
});

type TransactionFormProps = {
  setOpen: (open: boolean) => void;
  transaction?: Transaction;
};

export const TransactionForm = ({ setOpen, transaction }: TransactionFormProps) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || '',
      amount: transaction?.amount || undefined,
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      type: transaction?.type || undefined,
      category: transaction?.category || '',
      payment_method: transaction?.payment_method || '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error('Usuário não autenticado.');

      const transactionData = {
        ...values,
        user_id: user.id,
        date: format(values.date, 'yyyy-MM-dd'),
      };

      if (transaction) {
        // Update
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('transactions').insert([transactionData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Lançamento ${transaction ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error) => {
      showError(`Erro ao salvar lançamento: ${error.message}`);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Salário, Aluguel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => {
            const [displayValue, setDisplayValue] = React.useState(() =>
              typeof field.value === 'number' ? field.value.toFixed(2) : ''
            );

            React.useEffect(() => {
              const formValue = field.value;
              const displayNum = parseFloat(displayValue);

              if (typeof formValue === 'number' && formValue !== displayNum) {
                setDisplayValue(formValue.toFixed(2));
              }
              if (formValue === undefined || formValue === null) {
                  setDisplayValue('');
              }
            }, [field.value, displayValue]);

            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                setDisplayValue(value);
                field.onChange(value === '' ? undefined : parseFloat(value));
              }
            };

            const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                const roundedValue = parseFloat(value.toFixed(2));
                setDisplayValue(roundedValue.toFixed(2));
                field.onChange(roundedValue);
              } else {
                setDisplayValue('');
                field.onChange(undefined);
              }
              field.onBlur();
            };

            return (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...field}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date('1900-01-01')
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa fixa">Despesa Fixa</SelectItem>
                  <SelectItem value="despesa variável">Despesa Variável</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Moradia, Transporte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cartão de Crédito, PIX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar Lançamento'}
        </Button>
      </form>
    </Form>
  );
};