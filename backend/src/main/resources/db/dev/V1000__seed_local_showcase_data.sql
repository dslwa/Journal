-- Local-only showcase seed data
-- Demo login:
-- email: demo@local.dev
-- password: demo12345

INSERT INTO users (id, email, password, username, role, initial_balance, disabled, created_at)
VALUES (
    '90000000-0000-0000-0000-000000000001'::uuid,
    'demo@local.dev',
    '$2b$12$kLBjrU6YOaNPt2gq2sPFb.ICeTEk4GZzIyusPf88Io.wSAbgz.93y',
    'demo',
    'USER',
    25000,
    FALSE,
    NOW() - INTERVAL '120 days'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO playbooks (
    id, user_id, title, description, rules, setup, timeframe, risk_note, tags, checklist, image_url, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000101'::uuid,
    u.id,
    'Earnings Breakout',
    'Momentum continuation after a strong earnings surprise.',
    $$## Ideal conditions

- Fresh catalyst within the last 1-3 sessions
- Relative strength versus the index
- Volume clearly above average

## Execution

Wait for the first constructive base or intraday reclaim instead of chasing the opening spike.

## Exit logic

- Scale on extension
- Cut quickly if volume fades and the level is lost$$,
    'Gap-and-go, first intraday base, reclaim after consolidation',
    'Daily / 4H',
    'Avoid entries when price is already stretched more than 2 ATR from the base.',
    'Momentum,Earnings,Breakout',
    '["Fresh catalyst is present","Volume confirms participation","Risk is defined before entry"]',
    NULL,
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '5 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO playbooks (
    id, user_id, title, description, rules, setup, timeframe, risk_note, tags, checklist, image_url, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000102'::uuid,
    u.id,
    'Pullback Continuation',
    'Trend continuation after a clean pullback into support.',
    $$## Ideal conditions

- Trend structure remains intact
- Pullback is orderly rather than impulsive
- The reclaim happens with clear participation

## Entry plan

Use the first higher low after the pullback is defended.

## Risk notes

If the pullback becomes messy or correlation weakens, stand down.$$,
    'Trend pullback into daily level or VWAP reclaim',
    '4H / 1H',
    'No trade if the bounce is weak and volume stays dead.',
    'Trend,Pullback,Continuation',
    '["Higher timeframe trend is intact","Pullback is controlled","There is a clear reclaim trigger"]',
    NULL,
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '2 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO playbooks (
    id, user_id, title, description, rules, setup, timeframe, risk_note, tags, checklist, image_url, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000103'::uuid,
    u.id,
    'Failed Breakdown Reversal',
    'Counter-trend reversal when a breakdown cannot follow through.',
    $$## Checklist

- Liquidity sweep below a key level
- Fast reclaim back into range
- Broad market stops accelerating lower

## Trigger

Take the reclaim only after the failed breakdown is obvious. Patience matters here.$$,
    'Liquidity sweep and reclaim back above support',
    '1H / 15m',
    'This setup fails fast. If the reclaim does not hold, get out.',
    'Reversal,Range,FailedBreakdown',
    '["The sweep is obvious","Reclaim is clean","Invalidation is tight"]',
    NULL,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '8 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000201'::uuid,
    u.id,
    'AAPL',
    'LONG',
    182.40,
    191.10,
    40,
    date_trunc('month', NOW()) + INTERVAL '2 days 14 hours',
    date_trunc('month', NOW()) + INTERVAL '3 days 16 hours',
    179.80,
    'Strong post-earnings base and clean relative strength against QQQ.',
    date_trunc('month', NOW()) + INTERVAL '2 days 14 hours',
    '90000000-0000-0000-0000-000000000101'::uuid,
    'earnings,large-cap,momentum',
    5,
    1.0,
    'Focused',
    'Disciplined',
    '[{"label":"Fresh catalyst is present","checked":true},{"label":"Volume confirms participation","checked":true},{"label":"Risk is defined before entry","checked":true}]',
    'Good patience on the base. Could have scaled a bit better into strength.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000202'::uuid,
    u.id,
    'NVDA',
    'LONG',
    912.00,
    903.50,
    18,
    date_trunc('month', NOW()) + INTERVAL '5 days 15 hours',
    date_trunc('month', NOW()) + INTERVAL '5 days 19 hours',
    905.00,
    'Tried to buy continuation too early while the base was still sloppy.',
    date_trunc('month', NOW()) + INTERVAL '5 days 15 hours',
    '90000000-0000-0000-0000-000000000101'::uuid,
    'earnings,semis,extended',
    2,
    0.9,
    'Impatient',
    'Annoyed',
    '[{"label":"Fresh catalyst is present","checked":true},{"label":"Volume confirms participation","checked":false},{"label":"Risk is defined before entry","checked":true}]',
    'Setup quality was lower than it looked at first glance. Chased a touch.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000203'::uuid,
    u.id,
    'EURUSD',
    'SHORT',
    1.0942,
    1.0868,
    18000,
    date_trunc('month', NOW()) + INTERVAL '9 days 9 hours',
    date_trunc('month', NOW()) + INTERVAL '10 days 13 hours',
    1.0976,
    'Clean continuation after a weak retest into resistance.',
    date_trunc('month', NOW()) + INTERVAL '9 days 9 hours',
    '90000000-0000-0000-0000-000000000102'::uuid,
    'fx,pullback,trend',
    4,
    0.8,
    'Calm',
    'Confident',
    '[{"label":"Higher timeframe trend is intact","checked":true},{"label":"Pullback is controlled","checked":true},{"label":"There is a clear reclaim trigger","checked":true}]',
    'Managed well. Could trail more aggressively after London close.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000204'::uuid,
    u.id,
    'BTCUSD',
    'LONG',
    65200,
    68950,
    0.18,
    date_trunc('month', NOW()) + INTERVAL '13 days 11 hours',
    date_trunc('month', NOW()) + INTERVAL '16 days 8 hours',
    63800,
    'Higher-timeframe reclaim held and momentum expanded overnight.',
    date_trunc('month', NOW()) + INTERVAL '13 days 11 hours',
    '90000000-0000-0000-0000-000000000102'::uuid,
    'crypto,swing,reclaim',
    5,
    1.1,
    'Constructive',
    'Patient',
    '[{"label":"Higher timeframe trend is intact","checked":true},{"label":"Pullback is controlled","checked":true},{"label":"There is a clear reclaim trigger","checked":true}]',
    'Good multi-session hold. This one reflects the kind of patience to keep.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000205'::uuid,
    u.id,
    'TSLA',
    'SHORT',
    255.00,
    263.20,
    20,
    date_trunc('month', NOW()) + INTERVAL '17 days 14 hours',
    date_trunc('month', NOW()) + INTERVAL '17 days 18 hours',
    258.00,
    'Tried to fade strength too early without a clean failure signal.',
    date_trunc('month', NOW()) + INTERVAL '17 days 14 hours',
    '90000000-0000-0000-0000-000000000103'::uuid,
    'reversal,fade,impulsive',
    2,
    0.7,
    'Reactive',
    'Frustrated',
    '[{"label":"The sweep is obvious","checked":false},{"label":"Reclaim is clean","checked":false},{"label":"Invalidation is tight","checked":true}]',
    'This was anticipation, not confirmation. Good reminder to wait for the actual reclaim/failure.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trades (
    id, user_id, ticker, direction, entry_price, exit_price, position_size, opened_at, closed_at, stop_loss,
    notes, created_at, playbook_id, tags, rating, risk_percent, emotion_before, emotion_after,
    pre_trade_checklist, post_trade_review
)
SELECT
    '90000000-0000-0000-0000-000000000206'::uuid,
    u.id,
    'MSFT',
    'LONG',
    415.20,
    428.10,
    28,
    date_trunc('month', NOW()) + INTERVAL '21 days 13 hours',
    date_trunc('month', NOW()) + INTERVAL '22 days 15 hours',
    409.50,
    'Textbook pullback into support with a clean continuation on day two.',
    date_trunc('month', NOW()) + INTERVAL '21 days 13 hours',
    '90000000-0000-0000-0000-000000000102'::uuid,
    'software,pullback,a-setup',
    5,
    1.0,
    'Ready',
    'Satisfied',
    '[{"label":"Higher timeframe trend is intact","checked":true},{"label":"Pullback is controlled","checked":true},{"label":"There is a clear reclaim trigger","checked":true}]',
    'A-quality trade. Good alignment across thesis, entry, and risk.'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_entries (
    id, user_id, entry_date, mood, energy, notes, lessons_learned, mistakes, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000301'::uuid,
    u.id,
    date_trunc('month', CURRENT_DATE)::date + 2,
    4,
    4,
    'Good start to the month. Followed the plan and kept size in check.',
    'Clarity improves when I write the scenario before the open.',
    'Still checking lower-timeframe noise too often.',
    NOW() - INTERVAL '24 days',
    NOW() - INTERVAL '24 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_entries (
    id, user_id, entry_date, mood, energy, notes, lessons_learned, mistakes, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000302'::uuid,
    u.id,
    date_trunc('month', CURRENT_DATE)::date + 7,
    3,
    3,
    'Market felt slower. Needed more patience than usual.',
    'Not every session needs action. Waiting is part of execution.',
    'Forced one setup out of boredom.',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '19 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_entries (
    id, user_id, entry_date, mood, energy, notes, lessons_learned, mistakes, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000303'::uuid,
    u.id,
    date_trunc('month', CURRENT_DATE)::date + 12,
    5,
    4,
    'Strong alignment today. The setup, sizing, and management all clicked.',
    'When the thesis is simple, execution gets cleaner.',
    'Could journal faster after the close instead of leaving it for later.',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_entries (
    id, user_id, entry_date, mood, energy, notes, lessons_learned, mistakes, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000304'::uuid,
    u.id,
    date_trunc('month', CURRENT_DATE)::date + 18,
    2,
    2,
    'Felt reactive after a red start. Backed off after the first bad decision.',
    'Recognizing tilt early saved the day from getting worse.',
    'Did not respect the need for confirmation on the first setup.',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_entries (
    id, user_id, entry_date, mood, energy, notes, lessons_learned, mistakes, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000305'::uuid,
    u.id,
    date_trunc('month', CURRENT_DATE)::date + 24,
    4,
    5,
    'Solid finish to the month. Process felt calmer and more deliberate.',
    'Reviewing the weekly plan before the session keeps me out of random ideas.',
    'Need to trim risk faster on low-liquidity names.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO long_term_entries (
    id, user_id, title, category, status, asset, horizon, thesis, trigger_plan, invalidation, notes, target_date, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000401'::uuid,
    u.id,
    'AI capex second wave',
    'THEME',
    'ACTIVE',
    'Semiconductors / AI infrastructure',
    '3-6M',
    'Cloud and model demand still supports a second wave of infra spend even after the first momentum burst cooled down.',
    'Focus on leaders that reset through time, not names still trading extended after the first move.',
    'If enterprise spend guidance softens broadly and relative strength disappears, the theme loses quality.',
    'Best expressions are liquid leaders with clear earnings support.',
    CURRENT_DATE + 45,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '4 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO long_term_entries (
    id, user_id, title, category, status, asset, horizon, thesis, trigger_plan, invalidation, notes, target_date, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000402'::uuid,
    u.id,
    'ASML post-reset watch',
    'WATCHLIST',
    'ON_WATCH',
    'ASML',
    '1-3M',
    'Watching for a higher-timeframe reset that could restart the semiconductor equipment trend.',
    'Need a weekly reclaim plus improving breadth in semis before acting.',
    'If the reclaim fails and sector breadth keeps deteriorating, drop it from focus.',
    'No need to force the idea early. Quality matters more than speed here.',
    CURRENT_DATE + 21,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '3 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO long_term_entries (
    id, user_id, title, category, status, asset, horizon, thesis, trigger_plan, invalidation, notes, target_date, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000403'::uuid,
    u.id,
    'Protect A-setup quality',
    'GOAL',
    'BUILDING',
    NULL,
    'Quarter',
    'Reduce second-tier trades and keep the month centered around clear A-quality setups.',
    'Before each trade, write one line explaining why this setup is better than passing.',
    'If low-quality trades start clustering again, size down for the rest of the week.',
    'The goal is fewer trades, cleaner execution, and lower emotional drag.',
    CURRENT_DATE + 60,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '1 day'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO long_term_entries (
    id, user_id, title, category, status, asset, horizon, thesis, trigger_plan, invalidation, notes, target_date, created_at, updated_at
)
SELECT
    '90000000-0000-0000-0000-000000000404'::uuid,
    u.id,
    'Monthly review: patience improved, fades still weak',
    'REVIEW',
    'COMPLETED',
    NULL,
    'Monthly',
    'The month improved once execution stayed aligned with trend continuation instead of forcing reversals.',
    'Keep leaning into continuation and only reintroduce reversal ideas when the failed-breakdown trigger is obvious.',
    'If impulsive counter-trend trades return, cut size and revisit review notes before the next session.',
    'Biggest gain came from cleaner patience. Biggest leak is still early anticipation on reversal setups.',
    CURRENT_DATE + 30,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
FROM users u
WHERE u.email = 'demo@local.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO macro_events (
    id, event_name, event_date, event_time, country, impact, actual, forecast, previous, currency, fetched_at
)
VALUES
    (
        '90000000-0000-0000-0000-000000000501'::uuid,
        'US CPI',
        date_trunc('month', CURRENT_DATE)::date + 4,
        '14:30',
        'US',
        'High',
        NULL,
        '3.2%',
        '3.4%',
        'USD',
        NOW()
    ),
    (
        '90000000-0000-0000-0000-000000000502'::uuid,
        'ECB Rate Decision',
        date_trunc('month', CURRENT_DATE)::date + 10,
        '13:15',
        'EU',
        'High',
        NULL,
        '4.00%',
        '4.00%',
        'EUR',
        NOW()
    ),
    (
        '90000000-0000-0000-0000-000000000503'::uuid,
        'US Retail Sales',
        date_trunc('month', CURRENT_DATE)::date + 16,
        '14:30',
        'US',
        'Medium',
        NULL,
        '0.4%',
        '0.2%',
        'USD',
        NOW()
    ),
    (
        '90000000-0000-0000-0000-000000000504'::uuid,
        'BoE Governor Speech',
        date_trunc('month', CURRENT_DATE)::date + 22,
        '10:00',
        'UK',
        'Medium',
        NULL,
        NULL,
        NULL,
        'GBP',
        NOW()
    ),
    (
        '90000000-0000-0000-0000-000000000505'::uuid,
        'US PCE Price Index',
        date_trunc('month', CURRENT_DATE)::date + 26,
        '14:30',
        'US',
        'High',
        NULL,
        '0.3%',
        '0.4%',
        'USD',
        NOW()
    )
ON CONFLICT (id) DO NOTHING;
