-- Módulo financeiro (uso simplificado)
-- 1) Impede fechar o mesmo mês duas vezes.
CREATE UNIQUE INDEX IF NOT EXISTS monthly_closures_month_year_unique
  ON monthly_closures (month, year);

-- 2) Lançamentos passam a guardar só o dia (meio-dia UTC do dia no horário de Brasília),
--    para nunca caírem no mês errado por causa do fuso horário.
UPDATE financial_transactions
SET transaction_date = date_trunc('day', (transaction_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo') + interval '12 hours';
