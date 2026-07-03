-- Increase RA pool from 600 to 800
UPDATE pj_aftersales_config SET value = '800' WHERE key = 'ra_commission_pool';

-- Set top bonus to 0 (removing it)
UPDATE pj_aftersales_config SET value = '0' WHERE key = 'ra_top_bonus';