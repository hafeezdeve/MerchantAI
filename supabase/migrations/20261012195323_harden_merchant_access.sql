-- Profile membership is established only by the authenticated business owner.
DROP POLICY IF EXISTS insert_own_profile ON public.profiles;
CREATE POLICY insert_own_profile ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND role = 'owner' AND is_active = true
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = profiles.business_id AND b.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS update_own_profile ON public.profiles;
CREATE POLICY update_own_profile ON public.profiles FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()) AND role = 'owner'
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = profiles.business_id AND b.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS update_own_business ON public.businesses;
CREATE POLICY update_own_business ON public.businesses FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));

-- Only authenticated callers can execute application functions; retain RLS.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'get_business_id', 'create_sale', 'create_purchase', 'create_expense',
      'record_customer_payment', 'record_supplier_payment', 'get_dashboard_metrics',
      'get_customer_balance', 'get_supplier_balance', 'get_low_stock_products',
      'get_top_products', 'get_monthly_comparison', 'get_inventory_value',
      'get_outstanding_receivables', 'get_outstanding_payables', 'get_invoice_summary', 'adjust_inventory'
    )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.signature);
  END LOOP;
END $$;

-- SQL-created tables must have API grants in addition to row policies.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.businesses, public.profiles, public.products, public.inventory_movements,
  public.customers, public.suppliers, public.transactions, public.transaction_items,
  public.invoices, public.invoice_items, public.payments, public.solana_payment_records,
  public.audit_logs, public.ai_proposals TO authenticated;
REVOKE ALL ON TABLE
  public.businesses, public.profiles, public.products, public.inventory_movements,
  public.customers, public.suppliers, public.transactions, public.transaction_items,
  public.invoices, public.invoice_items, public.payments, public.solana_payment_records,
  public.audit_logs, public.ai_proposals FROM anon;
