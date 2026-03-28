-- Expand the local demo account with a fuller trade history for analytics and equity curve demos.

WITH demo_user AS (
    SELECT id
    FROM users
    WHERE email = 'demo@local.dev'
),
base_series AS (
    SELECT
        gs AS seq,
        (ARRAY['AAPL','MSFT','NVDA','AMD','META','TSLA','EURUSD','GBPUSD','BTCUSD','ETHUSD','QQQ','XAUUSD'])[1 + ((gs - 1) % 12)] AS ticker,
        (
            date_trunc('day', CURRENT_DATE - INTERVAL '200 days')
            + (gs * INTERVAL '2 days')
            + ((9 + (gs % 5)) || ' hours')::interval
            + ((gs % 4) * INTERVAL '11 minutes')
        ) AS opened_at,
        CASE
            WHEN gs BETWEEN 18 AND 24 OR gs BETWEEN 49 AND 55 OR gs BETWEEN 78 AND 82 THEN FALSE
            WHEN gs % 9 IN (0, 4, 7) THEN FALSE
            ELSE TRUE
        END AS is_win
    FROM generate_series(1, 94) AS gs
),
instrument_setup AS (
    SELECT
        seq,
        ticker,
        opened_at,
        opened_at + ((4 + (seq % 3) * 3) || ' hours')::interval AS closed_at,
        is_win,
        CASE
            WHEN ticker IN ('EURUSD', 'GBPUSD', 'XAUUSD') AND seq % 4 = 0 THEN 'SHORT'
            WHEN ticker IN ('BTCUSD', 'ETHUSD', 'TSLA') AND seq % 5 = 0 THEN 'SHORT'
            WHEN seq % 6 = 0 THEN 'SHORT'
            ELSE 'LONG'
        END AS direction,
        CASE ticker
            WHEN 'AAPL' THEN 172 + seq * 0.62
            WHEN 'MSFT' THEN 392 + seq * 0.58
            WHEN 'NVDA' THEN 760 + seq * 2.85
            WHEN 'AMD' THEN 144 + seq * 0.66
            WHEN 'META' THEN 425 + seq * 1.18
            WHEN 'TSLA' THEN 215 + seq * 0.52
            WHEN 'EURUSD' THEN 1.074 + (seq % 10) * 0.0022
            WHEN 'GBPUSD' THEN 1.241 + (seq % 9) * 0.0034
            WHEN 'BTCUSD' THEN 51800 + seq * 185
            WHEN 'ETHUSD' THEN 2780 + seq * 12.5
            WHEN 'QQQ' THEN 407 + seq * 0.57
            WHEN 'XAUUSD' THEN 2048 + seq * 3.05
        END AS base_entry,
        CASE
            WHEN ticker IN ('EURUSD', 'GBPUSD') THEN 4
            ELSE 2
        END AS price_scale,
        CASE
            WHEN ticker IN ('EURUSD', 'GBPUSD') THEN 0.32
            WHEN ticker IN ('XAUUSD', 'QQQ', 'AAPL', 'MSFT', 'META') THEN 0.70
            WHEN ticker IN ('NVDA', 'AMD', 'TSLA') THEN 0.95
            ELSE 1.25
        END AS volatility_factor
    FROM base_series
),
trade_shape AS (
    SELECT
        seq,
        ticker,
        opened_at,
        closed_at,
        is_win,
        direction,
        price_scale,
        ROUND(
            (
                CASE
                    WHEN ticker IN ('EURUSD', 'GBPUSD') THEN base_entry + ((seq % 5) - 2) * 0.0018
                    WHEN ticker = 'BTCUSD' THEN base_entry + ((seq % 5) - 2) * 420
                    WHEN ticker = 'ETHUSD' THEN base_entry + ((seq % 5) - 2) * 18
                    ELSE base_entry + ((seq % 5) - 2) * (base_entry * 0.006)
                END
            )::numeric,
            price_scale
        )::double precision AS entry_price,
        CASE
            WHEN is_win THEN (0.014 + (seq % 5) * 0.004) * volatility_factor
            ELSE (0.007 + (seq % 4) * 0.0025) * volatility_factor
        END AS move_pct,
        ROUND((0.70 + (seq % 5) * 0.13)::numeric, 2)::double precision AS risk_percent,
        CASE ticker
            WHEN 'AAPL' THEN (55 + (seq % 5) * 6)::double precision
            WHEN 'MSFT' THEN (26 + (seq % 4) * 4)::double precision
            WHEN 'NVDA' THEN (10 + (seq % 4) * 2)::double precision
            WHEN 'AMD' THEN (42 + (seq % 5) * 5)::double precision
            WHEN 'META' THEN (14 + (seq % 4) * 2)::double precision
            WHEN 'TSLA' THEN (18 + (seq % 5) * 3)::double precision
            WHEN 'EURUSD' THEN (12000 + (seq % 5) * 2500)::double precision
            WHEN 'GBPUSD' THEN (10000 + (seq % 5) * 2200)::double precision
            WHEN 'BTCUSD' THEN ROUND((0.12 + (seq % 5) * 0.045)::numeric, 3)::double precision
            WHEN 'ETHUSD' THEN ROUND((1.10 + (seq % 5) * 0.35)::numeric, 2)::double precision
            WHEN 'QQQ' THEN (24 + (seq % 5) * 4)::double precision
            WHEN 'XAUUSD' THEN (8 + (seq % 5) * 2)::double precision
        END AS position_size,
        CASE
            WHEN ticker IN ('AAPL', 'NVDA', 'AMD', 'META') THEN '90000000-0000-0000-0000-000000000101'::uuid
            WHEN ticker IN ('TSLA', 'XAUUSD') THEN '90000000-0000-0000-0000-000000000103'::uuid
            ELSE '90000000-0000-0000-0000-000000000102'::uuid
        END AS playbook_id
    FROM instrument_setup
),
final_trades AS (
    SELECT
        ('90000000-0000-0000-0000-' || lpad((700000 + seq)::text, 12, '0'))::uuid AS id,
        seq,
        ticker,
        direction,
        entry_price,
        ROUND(
            (
                CASE
                    WHEN direction = 'LONG' AND is_win THEN entry_price * (1 + move_pct)
                    WHEN direction = 'LONG' AND NOT is_win THEN entry_price * (1 - move_pct)
                    WHEN direction = 'SHORT' AND is_win THEN entry_price * (1 - move_pct)
                    ELSE entry_price * (1 + move_pct)
                END
            )::numeric,
            price_scale
        )::double precision AS exit_price,
        position_size,
        opened_at,
        closed_at,
        ROUND(
            (
                CASE
                    WHEN direction = 'LONG' THEN entry_price * (1 - (0.008 + (seq % 3) * 0.0025))
                    ELSE entry_price * (1 + (0.008 + (seq % 3) * 0.0025))
                END
            )::numeric,
            price_scale
        )::double precision AS stop_loss,
        playbook_id,
        risk_percent,
        is_win
    FROM trade_shape
)
INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    ft.id,
    du.id,
    ft.ticker,
    ft.direction,
    ft.entry_price,
    ft.exit_price,
    ft.position_size,
    ft.opened_at,
    ft.closed_at,
    ft.stop_loss,
    CASE
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000101'::uuid AND ft.is_win
            THEN 'Momentum name respected the catalyst and followed through after a clean base.'
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000101'::uuid
            THEN 'Catalyst was there, but the follow-through was weaker than expected and the setup lost energy.'
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000103'::uuid AND ft.is_win
            THEN 'Reversal worked once the failure was obvious and the reclaim held.'
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000103'::uuid
            THEN 'Tried to lean too early into reversal. Confirmation never fully arrived.'
        WHEN ft.is_win
            THEN 'Trend continuation stayed orderly and the position was held long enough to realize the move.'
        ELSE 'Structure looked decent at entry, but follow-through stalled and the stop did its job.'
    END AS notes,
    ft.opened_at,
    ft.playbook_id,
    CASE
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000101'::uuid THEN 'momentum,earnings,showcase'
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000103'::uuid THEN 'reversal,failed-breakdown,showcase'
        ELSE 'trend,pullback,showcase'
    END AS tags,
    CASE
        WHEN ft.is_win THEN 4 + (ft.seq % 2)
        ELSE 2 + (ft.seq % 2)
    END AS rating,
    ft.risk_percent,
    CASE ft.seq % 5
        WHEN 0 THEN 'Focused'
        WHEN 1 THEN 'Calm'
        WHEN 2 THEN 'Patient'
        WHEN 3 THEN 'Constructive'
        ELSE 'Ready'
    END AS emotion_before,
    CASE
        WHEN ft.is_win AND ft.seq % 2 = 0 THEN 'Satisfied'
        WHEN ft.is_win THEN 'Confident'
        WHEN ft.seq % 2 = 0 THEN 'Neutral'
        ELSE 'Reflective'
    END AS emotion_after,
    CASE
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000101'::uuid
            THEN '[{"label":"Fresh catalyst is present","checked":true},{"label":"Volume confirms participation","checked":true},{"label":"Risk is defined before entry","checked":true}]'
        WHEN ft.playbook_id = '90000000-0000-0000-0000-000000000103'::uuid
            THEN '[{"label":"The sweep is obvious","checked":true},{"label":"Reclaim is clean","checked":true},{"label":"Invalidation is tight","checked":true}]'
        ELSE '[{"label":"Higher timeframe trend is intact","checked":true},{"label":"Pullback is controlled","checked":true},{"label":"There is a clear reclaim trigger","checked":true}]'
    END AS pre_trade_checklist,
    CASE
        WHEN ft.is_win
            THEN 'Solid process trade. The best part was letting the thesis play out without cutting the winner too early.'
        ELSE 'Loss stayed contained. Review point is to wait for cleaner confirmation before pressing size.'
    END AS post_trade_review
FROM final_trades ft
CROSS JOIN demo_user du
ON CONFLICT (id) DO NOTHING;
