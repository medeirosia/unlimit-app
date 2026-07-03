
-- Configurações de precificação da Pancada Joias
CREATE TABLE public.pj_pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value numeric NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing config"
  ON public.pj_pricing_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage pricing config"
  ON public.pj_pricing_config FOR ALL
  USING (is_admin_user());

-- Produtos da Pancada Joias
CREATE TABLE public.pj_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL,
  name text NOT NULL,
  category text NOT NULL, -- 'banhado_ouro' ou 'moeda_antiga'
  product_type text, -- 'corrente', 'pulseira', 'pingente', 'escapulario', 'brinco'
  weight numeric NOT NULL DEFAULT 0,
  raw_cost numeric NOT NULL DEFAULT 0,
  sale_price numeric DEFAULT 0,
  min_markup numeric NOT NULL DEFAULT 5.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.pj_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage products"
  ON public.pj_products FOR ALL
  USING (is_admin_user());

-- Inserir configurações iniciais
INSERT INTO public.pj_pricing_config (key, value, label) VALUES
  ('preco_grama_banho', 1.70, 'Preço por Grama do Banho (R$)'),
  ('markup_padrao_banhado', 5.00, 'Markup Padrão (Banhado)'),
  ('markup_padrao_moeda', 5.00, 'Markup Padrão (Moeda)');

-- Inserir produtos BANHADO A OURO - Correntes
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('BCT165', 'CORRENTE TIJOLINHO 1,5MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.40, 4.50, 109, 5.00),
  ('BCP265', 'CORRENTE PIASTRINE 2MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.60, 4.50, 119, 5.00),
  ('BCC265', 'CORRENTE CADEADO 2MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 5.10, 4.50, 109, 5.00),
  ('BC3X1265', 'CORRENTE 3X1 2MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 4.90, 4.50, 119, 5.00),
  ('BCTQ265I', 'CORRENTE TIJOLINHO DE QUINA 2MM - 70CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.90, 4.50, 159, 5.00),
  ('BCV170', 'CORRENTE VENEZIANA 1MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 2.50, 3.80, 109, 5.00),
  ('BCG265I', 'CORRENTE GRUMET 2MM - 70CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.60, 4.50, 119, 5.00),
  ('BCEP245', 'CORRENTE ELO PORTUGUÊS 2MM - 45CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.40, 3.70, 119, 5.00),
  ('BCT470B', 'CORRENTE TIJOLINHO 4MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 14.60, 14.50, 158, 5.00),
  ('BCCQ470B', 'CORRENTE CADEADO DE QUINA 4MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 37.00, 158, 5.00),
  ('BCTQ270B', 'CORRENTE TIJOLINHO DE QUINA 2MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 32.00, 159, 5.00),
  ('BCG370I', 'CORRENTE GRUMET 3MM - 70CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 11.50, 12.00, 149, 5.00),
  ('BCC270B', 'CORRENTE CUBINHO 2MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 11.60, 13.50, 149, 5.00),
  ('BCTA370B', 'CORRENTE TIJOLINHO ALONGADO 3MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 8.10, 14.00, 159, 5.00),
  ('BCCD370G', 'CORRENTE CADEADO DUPLO 3MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 8.80, 13.00, 187, 5.00),
  ('BCI470G', 'CORRENTE IMPERADOR 4MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 16.40, 19.00, 249, 5.00),
  ('BCI670G', 'CORRENTE IMPERADOR 6MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 25.00, 26.00, 267, 5.00),
  ('BCEP270', 'CORRENTE ELO PORTUGUÊS 2MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 3.80, 5.10, 119, 5.00),
  ('BCEB170', 'CORRENTE ELO BAIANO 1,5MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.10, 8.00, 129, 5.00),
  ('BCRR270B', 'CORRENTE RABO DE RATO 2MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 12.30, 15.90, 89, 5.00),
  ('BCV1570', 'CORRENTE VENEZIANA 1,5MM - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 7.90, 6.80, 129, 5.00),
  ('BCCQ570B', 'CORRENTE CADEADO DE QUINA 5MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 45.00, 197, 5.00),
  ('BCG570G', 'CORRENTE GRUMET 5MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 45.00, 249, 5.00),
  ('BCG670G', 'CORRENTE GRUMET 6MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 60.00, 267, 5.00),
  ('BCGF670G', 'CORRENTE GRUMET FLAT 6MM - 70CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 60.00, 249, 5.00),
  ('BCTP', 'CORRENTE TREVO PRETO - 55CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.00, 10.00, 159, 5.00),
  ('BCTB', 'CORRENTE TREVO BRANCO - 55CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.00, 10.00, 159, 5.00),
  ('BCTV', 'CORRENTE TREVO VERMELHO - 55CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.00, 10.00, 159, 5.00),
  ('BCTVE', 'CORRENTE TREVO VERDE - 55CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.00, 10.00, 159, 5.00),
  ('BCTA', 'CORRENTE TREVO AZUL - 55CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 6.00, 10.00, 159, 5.00),
  ('BCCQ870T', 'CORRENTE CADEADO DE QUINA 8MM - 70CM (FECHO 1 TRAVA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 0, 80.00, 297, 5.00),
  ('BCT270BO', 'CORRENTE TIJOLINHO 2MM - 70CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'corrente', 8.60, 13.50, 159, 5.00);

-- Pulseiras Banhado a Ouro
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('BPT121', 'PULSEIRA GRUMET 2MM - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.40, 2.00, 79, 5.00),
  ('BPP221', 'PULSEIRA PIASTRINE 2MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.20, 2.00, 79, 5.00),
  ('BPC221', 'PULSEIRA CADEADO 2MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.10, 2.70, 79, 5.00),
  ('BP3X1221', 'PULSEIRA 3X1 2MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.30, 1.90, 79, 5.00),
  ('BPTQ221I', 'PULSEIRA TIJOLINHO DE QUINA 2MM - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.30, 1.70, 86, 5.00),
  ('BPG221I', 'PULSEIRA GRUMET 2MM - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.40, 2.00, 79, 5.00),
  ('BPCQ421B', 'PULSEIRA CADEADO DE QUINA 4MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 18.00, 79, 5.00),
  ('BPC221B', 'PULSEIRA CUBINHO 2MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 4.20, 7.50, 99, 5.00),
  ('BPT421B', 'PULSEIRA TIJOLINHO 4MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 4.00, 9.50, 135, 5.00),
  ('BPG321I', 'PULSEIRA GRUMET 3MM - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 6.50, 99, 5.00),
  ('BPTQ221B', 'PULSEIRA TIJOLINHO DE QUINA 2MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 17.00, 99, 5.00),
  ('BPV121', 'PULSEIRA VENEZIANA 1MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.00, 2.00, 0, 5.00),
  ('BPTA321B', 'PULSEIRA TIJOLINHO ALONGADO 3MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.20, 9.50, 99, 5.00),
  ('BPCD321G', 'PULSEIRA CADEADO DUPLO 3MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 2.90, 7.90, 159, 5.00),
  ('BPI421G', 'PULSEIRA IMPERADOR 4MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 4.90, 9.00, 119, 5.00),
  ('BPI621G', 'PULSEIRA IMPERADOR 6MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 7.80, 10.00, 159, 5.00),
  ('BPEP221', 'PULSEIRA ELO PORTUGUÊS 2MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 1.40, 2.90, 119, 5.00),
  ('BPEB121', 'PULSEIRA ELO BAIANO 1,5MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 2.10, 3.95, 79, 5.00),
  ('BPRR221B', 'PULSEIRA RABO DE RATO 2MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 4.00, 11.00, 79, 5.00),
  ('BPV1521', 'PULSEIRA VENEZIANA 1,5MM - 21CM - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 2.20, 3.90, 86, 5.00),
  ('BPCQ521B', 'PULSEIRA CADEADO DE QUINA 5MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 20.00, 139, 5.00),
  ('BPG521G', 'PULSEIRA GRUMET 5MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 23.00, 139, 5.00),
  ('BPG621G', 'PULSEIRA GRUMET 6MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 30.00, 149, 5.00),
  ('BPGF621G', 'PULSEIRA GRUMET FLAT 6MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 30.00, 149, 5.00),
  ('BPTPR', 'PULSEIRA TREVO PRETO - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 10.00, 99, 5.00),
  ('BPTB', 'PULSEIRA TREVO BRANCO - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 10.00, 99, 5.00),
  ('BPTV', 'PULSEIRA TREVO VERMELHO - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 10.00, 99, 5.00),
  ('BPTVE', 'PULSEIRA TREVO VERDE - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 10.00, 99, 5.00),
  ('BPTA', 'PULSEIRA TREVO AZUL - 21CM (FECHO ITALIANO) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.50, 10.00, 99, 5.00),
  ('BPT221BO', 'PULSEIRA TIJOLINHO 2MM - 21CM (FECHO BOMBA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 3.00, 8.90, 129, 5.00),
  ('BPPE1621G', 'PULSEIRA PITBULL EGÍPCIO 16MM - 21CM (FECHO GAVETA) - BANHADO A OURO 18K', 'banhado_ouro', 'pulseira', 0, 75.00, 279, 5.00);

-- Pingentes Banhado a Ouro
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('BPCEP', 'PINGENTE CRUZ ENROLADA PEQUENA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.80, 0.95, 39, 5.00),
  ('BPCCC', 'PINGENTE CRUZ DE 3 PONTAS COM CRISTO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.40, 0.17, 39, 5.00),
  ('BPTP', 'PINGENTE TUDO POSSO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.60, 0.50, 39, 5.00),
  ('BPC3D', 'PINGENTE CRUZ 3D - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.00, 0.27, 39, 5.00),
  ('BPTEP', 'PINGENTE TUDO É POSSÍVEL - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.60, 2.10, 39, 5.00),
  ('BPCV', 'PINGENTE CRUZ VAZADA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.80, 1.50, 39, 5.00),
  ('BPPDL', 'PINGENTE PONTO DE LUZ - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.40, 0.60, 39, 5.00),
  ('BPFG', 'PINGENTE FERRADURA GRANDE - 4x3,3cm - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.70, 0.49, 39, 5.00),
  ('BPCEM', 'PINGENTE CRUZ ENROLADA MÉDIA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.50, 1.20, 39, 5.00),
  ('BPOSMP', 'PINGENTE O SENHOR É MEU PASTOR - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.60, 0.50, 39, 5.00),
  ('BPFP', 'PINGENTE FERRADURA PEQUENA - 2x1,1cm - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.90, 0.23, 39, 5.00),
  ('BPSJVP', 'PINGENTE SÃO JORGE NO ARO COM ORAÇÃO P - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.40, 0.49, 39, 5.00),
  ('BPCEG', 'PINGENTE CRUZ ENROLADA GRANDE - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 2.30, 1.40, 39, 5.00),
  ('BPMLTJ', 'PINGENTE MEDALHA LEÃO DA TRIBO DE JUDÁ - 2,5x2,5CM - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 2.20, 0.74, 39, 5.00),
  ('BPCPP', 'PINGENTE CRUZ PALITO PEQUENA - 2,5CM - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.23, 0.18, 39, 5.00),
  ('BPFM', 'PINGENTE FERRADURA MÉDIA - 3x2,3cm - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.50, 0.50, 39, 5.00),
  ('BPMSBM', 'PINGENTE MEDALHA DE SÃO BENTO MÉDIA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 2.69, 0.95, 39, 5.00),
  ('BPCSDP', 'PINGENTE COM SÍMBOLO DA PAZ - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.30, 0.38, 39, 5.00),
  ('BPCVBA', 'PINGENTE CRUZ VAZADA COM BORDA ARREDONDADA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 2.00, 0.62, 39, 5.00),
  ('BPFMAC', 'PINGENTE FERRADURA MACIÇA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.50, 0.23, 39, 5.00),
  ('BPMSBP', 'PINGENTE MEDALHA DE SÃO BENTO PEQUENA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 3.30, 0.58, 39, 5.00),
  ('BPEDV', 'PINGENTE ESTRELA DE DAVI VAZADA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.00, 0.31, 39, 5.00),
  ('BPCV3P', 'PINGENTE CRUZ VAZADA DE 3 PONTAS - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.70, 0.27, 39, 5.00),
  ('BPCVFC', 'PINGENTE CRUZ VAZADA COM ROSTO DE CRISTO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.30, 0.37, 39, 5.00),
  ('BPCPCC', 'PINGENTE CRUZ PONTEADA COM CRISTO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.50, 0.22, 39, 5.00),
  ('BPCPL', 'PINGENTE CRUZ PONTEADA LISA - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.60, 0.25, 39, 5.00),
  ('BPNSCP', 'PINGENTE NOSSA SENHORA CRAVEJADO PEQUENO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.80, 12.00, 59, 5.00),
  ('BPMFCP', 'PINGENTE MÃOS DE FÉ CRAVEJADO PEQUENO - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 1.40, 12.00, 59, 5.00),
  ('BPCER', 'PINGENTE CRUZ ENROLADA ROBUSTA - 6X3,5CM - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 14.60, 27.00, 129, 5.00),
  ('BPFPP', 'PINGENTE FERRADURA PP - 1x1,2cm - BANHADO A OURO 18K', 'banhado_ouro', 'pingente', 0.60, 0.26, 39, 5.00);

-- Escapulários Banhado a Ouro
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('BESBR70', 'ESCAPULÁRIO SÃO BENTO REDONDO (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 4.40, 6.80, 149, 5.00),
  ('BEDFESG70', 'ESCAPULÁRIO DEUS É FIEL E ESPIRITO SANTO (GRUMET 2MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 4.30, 6.50, 149, 5.00),
  ('BENSSCP70', 'ESCAPULÁRIO NOSSA SENHORA APARECIDA E SAGRADO CORAÇÃO P (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 3.40, 6.10, 149, 5.00),
  ('BEEDC70', 'ESCAPULÁRIO ESTRELA DE DAVI E CRUZ (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 4.80, 6.80, 149, 5.00),
  ('BEDEFG70', 'ESCAPULÁRIO DEUS É FIEL (GRUMET 2MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 7.70, 6.90, 149, 5.00),
  ('BEDEFV70', 'ESCAPULÁRIO DEUS É FIEL (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 5.40, 7.00, 149, 5.00),
  ('BENSSCM70', 'ESCAPULÁRIO NOSSA SENHORA DO CARMO E SAGRADO CORAÇÃO M (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 4.80, 6.90, 149, 5.00),
  ('BEDFESV70', 'ESCAPULÁRIO DEUS É FIEL E ESPIRITO SANTO (VENEZIANA 1MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 3.70, 6.60, 149, 5.00),
  ('BEDFOT27', 'ESCAPULÁRIO DEUS É FIEL COM ORAÇÃO (TIJOLINHO DE QUINA 2MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 6.40, 7.50, 149, 5.00),
  ('BESJC270', 'ESCAPULÁRIO SÃO JORGE (CADEADO 2MM) - 70CM - BANHADO A OURO 18K', 'banhado_ouro', 'escapulario', 7.90, 8.50, 149, 5.00);

-- Brincos Banhado a Ouro
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('BBCCP', 'PAR BRINCO CIRCULO CRAVEJADO P - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 1.50, 8.00, 79, 5.00),
  ('BBCCC', 'PAR BRINCO CRUCIFIXO CLICK CRAVEJADO - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 1.30, 9.00, 79, 5.00),
  ('BB8FQC', 'PAR BRINCO 8 FILEIRAS QUADRADO CRAVEJADO - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 2.10, 12.00, 79, 5.00),
  ('BBACL', 'PAR BRINCO ARGOLA DE CLICK LISO - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 1.30, 2.40, 79, 5.00),
  ('BBAC5F', 'PAR BRINCO ARGOLA CRAVEJADA 5 FILEIRAS - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 5.40, 12.00, 79, 5.00),
  ('BBCCD', 'PAR BRINCO CRAVEJADO COM CAIXA DETALHADA - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 2.80, 12.00, 79, 5.00),
  ('BBQCP', 'PAR BRINCO QUADRADO CRAVEJADO P - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 1.20, 11.00, 79, 5.00),
  ('BBSCM', 'PAR BRINCO SOLITÁRIO COROA M - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 0.90, 3.00, 79, 5.00),
  ('BBSZQ', 'PAR BRINCO SOLITÁRIO ZIRCÔNIA QUADRADA - BANHADO A OURO 18K', 'banhado_ouro', 'brinco', 1.40, 3.00, 79, 5.00);

-- Moeda Antiga - Correntes
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('MCCN465', 'CORRENTE CADEADO 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCCN665', 'CORRENTE CADEADO 6MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 187, 5.00),
  ('MCCN865', 'CORRENTE CADEADO 8MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 48.60, 197, 5.00),
  ('MCCQ265', 'CORRENTE CADEADO DE QUINA 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCCQ465', 'CORRENTE CADEADO DE QUINA 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 159, 5.00),
  ('MCCQ665', 'CORRENTE CADEADO DE QUINA 6MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 187, 5.00),
  ('CG3MM', 'CORRENTE GRUMET 3MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('CG4MM', 'CORRENTE GRUMET 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 187, 5.00),
  ('CG5MM', 'CORRENTE GRUMET 5MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 54.00, 197, 5.00),
  ('CEP4MM-65CM', 'CORRENTE ELO PORTUGUÊS 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('CP2MM', 'CORRENTE PIASTRINE 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('CEB4MM-65CM', 'CORRENTE ELO BAIANO 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 197, 5.00),
  ('CCD6MM', 'CORRENTE TIJOLINHO DUPLA 6MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 217, 5.00),
  ('CGL7MM', 'CORRENTE GRUMET LAMINADA 7MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 64.80, 197, 5.00),
  ('CGL10MM', 'CORRENTE GRUMET LAMINADA 10MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 64.80, 197, 5.00),
  ('CPB1MM', 'CORRENTE PITBULL 1,5MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('CCB5MM', 'CORRENTE CUBANA 5MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 48.60, 217, 5.00),
  ('CPB4MM', 'CORRENTE PITBULL 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 187, 5.00),
  ('CCB4MM', 'CORRENTE CUBANA 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 48.60, 187, 5.00),
  ('MCC265B', 'CORRENTE CUBINHO 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCT265', 'CORRENTE TIJOLINHO 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('CG7MM', 'CORRENTE GRUMET 7MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 54.00, 217, 5.00),
  ('CG10MM', 'CORRENTE GRUMET 10MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 54.00, 197, 5.00),
  ('CIMP10MM', 'CORRENTE IMPERADOR 10MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 70.20, 197, 5.00),
  ('CGET10MM', 'CORRENTE GRUMET ELO TRIPLO 10MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 59.40, 197, 5.00),
  ('MCT765', 'CORRENTE TIJOLINHO 7MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 197, 5.00),
  ('CCD8MM', 'CORRENTE TIJOLINHO DUPLA 8MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 0, 5.00),
  ('CTQ1MM', 'CORRENTE TIJOLINHO DE QUINA 1MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 0, 5.00),
  ('CEP2MM', 'CORRENTE ELO PORTUGUÊS 2MM - 45CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 0, 5.00),
  ('MCG3X13', 'CORRENTE GRUMET 3X1 3MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 38.88, 187, 5.00),
  ('CCF3MM', 'CORRENTE CAIXA DE FÓSFORO 3MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 0, 5.00),
  ('CP4MM', 'CORRENTE PIASTRINE 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 0, 5.00),
  ('CPBL2MM', 'CORRENTE PITBULL LAMINADA 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 0, 5.00),
  ('CEP4MM-45CM', 'CORRENTE ELO PORTUGUÊS 4MM - 45CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 179, 5.00),
  ('CEB4MM-45CM', 'CORRENTE ELO BAIANO 4MM - 45CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 43.20, 197, 5.00),
  ('MCT165', 'CORRENTE TIJOLINHO 1MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCTQ265', 'CORRENTE TIJOLINHO DE QUINA 2MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCT465', 'CORRENTE TIJOLINHO 4MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 149, 5.00),
  ('MCT565', 'CORRENTE TIJOLINHO 5MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 159, 5.00),
  ('MCT665', 'CORRENTE TIJOLINHO 6MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 197, 5.00),
  ('MCTL565', 'CORRENTE TIJOLINHO LONG 5MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 32.40, 159, 5.00),
  ('MCCQ865', 'CORRENTE CADEADO DE QUINA 8MM - 65CM - MOEDA ANTIGA', 'moeda_antiga', 'corrente', 0, 54.00, 197, 5.00);

-- Moeda Antiga - Pulseiras
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('MPT121', 'PULSEIRA TIJOLINHO 1MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('MPTQ221', 'PULSEIRA TIJOLINHO DE QUINA 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('BPT421', 'PULSEIRA TIJOLINHO 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPT521', 'PULSEIRA TIJOLINHO 5MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPT621', 'PULSEIRA TIJOLINHO 6MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPTL521', 'PULSEIRA TIJOLINHO LONG 5MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPCN421', 'PULSEIRA CADEADO 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPCN621', 'PULSEIRA CADEADO 6MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPCN821', 'PULSEIRA CADEADO 8MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 27.00, 149, 5.00),
  ('MPCQ221', 'PULSEIRA CADEADO DE QUINA 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('MPCQ421', 'PULSEIRA CADEADO DE QUINA 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('MPCQ621', 'PULSEIRA CADEADO DE QUINA 6MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('PG3MM', 'PULSEIRA GRUMET 3MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('PG4MM', 'PULSEIRA GRUMET 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 27.00, 137, 5.00),
  ('PG5MM', 'PULSEIRA GRUMET 5MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 32.40, 137, 5.00),
  ('PEP4MM-21CM', 'PULSEIRA ELO PORTUGUÊS 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('PP2MM', 'PULSEIRA PIASTRINE 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('PEB4MM-21CM', 'PULSEIRA ELO BAIANO 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('PCD6MM', 'PULSEIRA TIJOLINHO DUPLA 6MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('PGL10MM', 'PULSEIRA GRUMET LAMINADA 10MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 41.04, 149, 5.00),
  ('PGL7MM', 'PULSEIRA GRUMET LAMINADA 7MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 32.40, 137, 5.00),
  ('PCB5MM', 'PULSEIRA CUBANA 5MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 27.00, 169, 5.00),
  ('PCB4MM', 'PULSEIRA CUBANA 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('PG7MM', 'PULSEIRA GRUMET 7MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 32.40, 149, 5.00),
  ('PPB1MM', 'PULSEIRA PITBULL 1,5MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('PPB4MM', 'PULSEIRA PITBULL 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('MPC221B', 'PULSEIRA CUBINHO 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('PG10MM', 'PULSEIRA GRUMET 10MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 37.80, 169, 5.00),
  ('MPT221', 'PULSEIRA TIJOLINHO 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('PIMP10MM', 'PULSEIRA IMPERADOR 10MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 32.40, 169, 5.00),
  ('PGET10MM', 'PULSEIRA GRUMET ELO TRIPLO 10MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 37.80, 169, 5.00),
  ('PCD8MM', 'PULSEIRA TIJOLINHO DUPLA 8MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('MPT721', 'PULSEIRA TIJOLINHO 7MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('PTQ1MM', 'PULSEIRA TIJOLINHO DE QUINA 1MM - 21cm - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('MPG3X13', 'PULSEIRA GRUMET 3X1 3MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 119, 5.00),
  ('PCF3MM', 'PULSEIRA CAIXA DE FÓSFORO 3MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('PP4MM', 'PULSEIRA PIASTRINE 4MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('PPBL2MM', 'PULSEIRA PITBULL LAMINADA 2MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 0, 5.00),
  ('PEP4MM-17CM', 'PULSEIRA ELO PORTUGUÊS 4MM - 17CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 137, 5.00),
  ('PEB4MM-17CM', 'PULSEIRA ELO BAIANO 4MM - 17CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 21.60, 149, 5.00),
  ('MPCQ821', 'PULSEIRA CADEADO DE QUINA 8MM - 21CM - MOEDA ANTIGA', 'moeda_antiga', 'pulseira', 0, 27.00, 149, 5.00);

-- Moeda Antiga - Pingentes
INSERT INTO public.pj_products (sku, name, category, product_type, weight, raw_cost, sale_price, min_markup) VALUES
  ('MPCB', 'PINGENTE CRUZ BORDADA - 5x3cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPCEG', 'PINGENTE CRUZ ENROLADA GRANDE - 5x3cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPCEM', 'PINGENTE CRUZ ENROLADA MÉDIA - 4x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('MPCEP', 'PINGENTE CRUZ ENROLADA PEQUENA - 3x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 69, 5.00),
  ('PCFDG', 'PINGENTE CRUZ FINA DUPLA GRANDE - 4x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PCFDP', 'PINGENTE CRUZ FINA DUPLA PEQUENA - 3x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PEFM', 'PINGENTE ESCUDO DA FÉ MÉDIO - 3x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PEDG', 'PINGENTE ESTRELA DE DAVI VAZADO GRANDE - 3,5x3,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('PEDP', 'PINGENTE ESTRELA DE DAVI VAZADO PEQUENO - 1,7x1,7cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('MPFG', 'PINGENTE FERRADURA GRANDE - 4x3,3cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPFM', 'PINGENTE FERRADURA MÉDIA - 3x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('MPFP', 'PINGENTE FERRADURA PEQUENA - 2x1,7cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PNSP', 'PINGENTE NOSSA SENHORA NA PLACA - 3x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 27.00, 99, 5.00),
  ('PRC', 'PINGENTE ROSTO DE CRISTO PADRÃO - 3x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PRCC', 'PINGENTE ROSTO DE CRISTO CHORANDO - 3x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PRCM', 'PINGENTE ROSTO DE CRISTO NA MEDALHA - 2,8x2,8cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 0, 5.00),
  ('PSJF', 'PINGENTE SÃO JORGE COM ORAÇÃO - 3,5x3,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('PSJP', 'PINGENTE SÃO JORGE VAZADO COM ARO PEQUENO - 2x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PNSCR', 'PINGENTE NOSSA SENHORA CRAVEJADA REDONDA - 3x3cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 27.00, 149, 5.00),
  ('PMFCG', 'PINGENTE CRUZ COM MÃOS DE FÉ CRAVEJADA G - 4x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 149, 5.00),
  ('PRCL', 'PINGENTE ROSTO DE CRISTO LATERAL - 4x2,8cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PRCCP', 'PINGENTE ROSTO DE CRISTO CRAVEJADO PEQUENO - 3x2,5cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 30.24, 0, 5.00),
  ('PCNH', 'PINGENTE CRUZ NO HORIZONTE - 2,5x2cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PRCCG', 'PINGENTE ROSTO DE CRISTO CRAVEJADO GRANDE - MOEDA ANTIGA - 4,5x3,5cm', 'moeda_antiga', 'pingente', 0, 30.24, 149, 5.00),
  ('MPS23P', 'PINGENTE SALMO 23 PEQUENO - 1,8X1,2CM - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PSJM', 'PINGENTE SÃO JORGE VAZADO COM ARO MÉDIO - 3X3CM - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('PSJG', 'PINGENTE SÃO JORGE VAZADO COM ARO GRANDE - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('PFV', 'PINGENTE FAVELA VENCEU 4,3X4,0CM', 'moeda_antiga', 'pingente', 0, 48.60, 0, 5.00),
  ('PCDB', 'PINGENTE CABEÇA DE BOI - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPC3D', 'PINGENTE CRUZ 3D VAZADA - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PCCPNP', 'PINGENTE CRUZ COM PAI NOSSO P - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PCCBP', 'PINGENTE CRUZ COM BORDA P - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PLRC', 'PINGENTE LEÃO REI COM OLHOS CRAVEJADOS - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 30.24, 99, 5.00),
  ('PRDV', 'PINGENTE ROSA DOS VENTOS - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPMSBG', 'PINGENTE MEDALHA DE SÃO BENTO GRANDE - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPMSBM', 'PINGENTE MEDALHA DE SÃO BENTO MÉDIO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 87, 5.00),
  ('MPMSBP', 'PINGENTE MEDALHA DE SÃO BENTO P - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PCSB', 'PINGENTE CRUZ DE SÃO BENTO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('PEDMCM', 'PINGENTE ESTRELA DE DAVI MEDALHA NA CHAPA MÉDIO - 2,9x2,6cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 0, 5.00),
  ('PEDMCG', 'PINGENTE ESTRELA DE DAVI MEDALHA NA CHAPA GRANDE - 4,3x4cm - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 0, 5.00),
  ('PNSCV', 'PINGENTE NOSSA SENHORA CRAVEJADO VAZADO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 54.00, 0, 5.00),
  ('PFC', 'PINGENTE FUZIL CRAVEJADO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 30.24, 149, 5.00),
  ('PCBP', 'PINGENTE CORAÇÃO BOLEADO PEQUENO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('PCRP', 'PINGENTE CORAÇÃO RELICÁRIO PEQUENO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 17.28, 79, 5.00),
  ('MPCCM', 'PINGENTE CRISTO CRUCIFICADO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 99, 5.00),
  ('MPNSS', 'PINGENTE NOSSA SENHORA SIMPLES - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 15.12, 79, 5.00),
  ('MPCRM', 'PINGENTE CORAÇÃO RELICÁRIO MÉDIO - MOEDA ANTIGA', 'moeda_antiga', 'pingente', 0, 17.28, 0, 5.00);
