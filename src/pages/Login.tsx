import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ThemeToggle';

const Login = () => {
  const { session } = useSession();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // You can add logic here if needed when the session changes
  }, [session]);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Acesse sua conta
          </h2>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu email',
                  password_label: 'Sua senha',
                  button_label: 'Entrar',
                  link_text: 'Já tem uma conta? Entre',
                },
                sign_up: {
                  email_label: 'Seu email',
                  password_label: 'Crie uma senha',
                  button_label: 'Cadastrar',
                  link_text: 'Não tem uma conta? Cadastre-se',
                },
                forgotten_password: {
                  email_label: 'Seu email',
                  button_label: 'Enviar instruções',
                  link_text: 'Esqueceu sua senha?',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;