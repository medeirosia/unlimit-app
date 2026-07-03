-- Update returns commission from 200 to 300
UPDATE pj_aftersales_config SET value = '300', updated_at = now() WHERE key = 'returns_commission';

-- Add resends commission config
INSERT INTO pj_aftersales_config (key, label, value) VALUES ('resends_commission', 'Comissão reenvios (R$)', '300')
ON CONFLICT DO NOTHING;