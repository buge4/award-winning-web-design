-- ============================================================
-- FIX #1: place_auction_bid
-- Must: deduct fee, split funds, check duplicates, transition to hot_mode
-- ============================================================
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_user_id uuid,
  p_instance_id uuid,
  p_bid_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance record;
  v_config record;
  v_wallet record;
  v_bid_fee numeric;
  v_ledger_event_id uuid;
  v_bid_id uuid;
  v_is_duplicate boolean := false;
  v_existing_bid_id uuid;
  v_bid_position integer;
  v_split_result jsonb;
  v_total_bids_after integer;
BEGIN
  -- 1. Lock and fetch instance
  SELECT * INTO v_instance
  FROM auction_instances
  WHERE id = p_instance_id
  FOR UPDATE;

  IF v_instance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auction not found');
  END IF;

  -- Only allow bids in accumulating, hot_mode, grace_period
  IF v_instance.status NOT IN ('accumulating', 'hot_mode', 'grace_period') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auction is not accepting bids (status: ' || v_instance.status || ')');
  END IF;

  -- 2. Fetch config
  SELECT * INTO v_config
  FROM auction_configs
  WHERE id = v_instance.config_id;

  v_bid_fee := v_config.bid_fee;

  -- Validate bid range
  IF p_bid_amount < v_config.min_bid_value OR p_bid_amount > v_config.max_bid_value THEN
    RETURN jsonb_build_object('success', false, 'message',
      'Bid must be between ' || v_config.min_bid_value || ' and ' || v_config.max_bid_value);
  END IF;

  -- 3. Check wallet balance
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND project_slug = 'auction'
  FOR UPDATE;

  IF v_wallet IS NULL OR v_wallet.balance < v_bid_fee THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance. Need ' || v_bid_fee || ' PNGWIN.');
  END IF;

  -- 4. Deduct bid fee via create_ledger_event
  SELECT create_ledger_event(
    p_user_id,
    'BID_FEE',
    v_bid_fee,
    'OUT',
    'auction',
    'auction_bid_' || p_instance_id::text,
    'auction',
    p_instance_id,
    'Bid fee for auction ' || v_config.name,
    '{}'::jsonb
  ) INTO v_ledger_event_id;

  -- 5. Call split_funds to allocate the bid fee
  SELECT split_funds(p_instance_id, v_bid_fee, v_ledger_event_id) INTO v_split_result;

  -- 6. Check for duplicate bid_amount (burn logic)
  SELECT id INTO v_existing_bid_id
  FROM auction_bids
  WHERE instance_id = p_instance_id
    AND bid_amount = p_bid_amount
    AND is_burned = false
  LIMIT 1;

  IF v_existing_bid_id IS NOT NULL THEN
    v_is_duplicate := true;
    -- Burn the existing bid
    UPDATE auction_bids SET is_burned = true, is_unique = false WHERE id = v_existing_bid_id;
  END IF;

  -- 7. Insert the new bid
  INSERT INTO auction_bids (
    instance_id, user_id, bid_amount, bid_fee_paid,
    is_unique, is_burned, is_winning, ledger_event_id
  ) VALUES (
    p_instance_id, p_user_id, p_bid_amount, v_bid_fee,
    NOT v_is_duplicate, v_is_duplicate, false, v_ledger_event_id
  ) RETURNING id INTO v_bid_id;

  -- 8. Update instance counters
  v_total_bids_after := COALESCE(v_instance.total_bids, 0) + 1;

  UPDATE auction_instances SET
    total_bids = v_total_bids_after,
    total_bid_fees = COALESCE(total_bid_fees, 0) + v_bid_fee,
    prize_pool = COALESCE(prize_pool, 0) + COALESCE((v_split_result->>'prize_pool')::numeric, 0),
    burned_amount = COALESCE(burned_amount, 0) + COALESCE((v_split_result->>'burn')::numeric, 0),
    unique_bidders = (
      SELECT COUNT(DISTINCT user_id) FROM auction_bids WHERE instance_id = p_instance_id
    )
  WHERE id = p_instance_id;

  -- 9. HOT MODE TRANSITION
  -- Check if we should transition to hot_mode
  IF v_instance.status = 'accumulating'
     AND v_config.auction_type = 'live_before_hot'
     AND v_config.total_bids_to_hot IS NOT NULL
     AND v_total_bids_after >= v_config.total_bids_to_hot
  THEN
    UPDATE auction_instances SET
      status = 'hot_mode',
      hot_mode_started_at = now(),
      hot_mode_ends_at = now() + (v_config.hot_mode_duration_seconds || ' seconds')::interval,
      scheduled_end = now() + (v_config.hot_mode_duration_seconds || ' seconds')::interval
    WHERE id = p_instance_id;
  END IF;

  -- 10. GRACE PERIOD / Anti-snipe during hot_mode
  IF v_instance.status = 'hot_mode' AND v_instance.hot_mode_ends_at IS NOT NULL THEN
    -- If bid placed with less than 30 seconds remaining, extend
    IF v_instance.hot_mode_ends_at - now() < interval '30 seconds' THEN
      UPDATE auction_instances SET
        hot_mode_ends_at = hot_mode_ends_at + interval '30 seconds',
        scheduled_end = hot_mode_ends_at + interval '30 seconds',
        status = 'grace_period'
      WHERE id = p_instance_id;
    END IF;
  END IF;

  -- Grace period extension too
  IF v_instance.status = 'grace_period' AND v_instance.hot_mode_ends_at IS NOT NULL THEN
    UPDATE auction_instances SET
      hot_mode_ends_at = hot_mode_ends_at + interval '30 seconds',
      scheduled_end = hot_mode_ends_at + interval '30 seconds'
    WHERE id = p_instance_id;
  END IF;

  -- 11. Compute bid position (rank among unique non-burned bids)
  SELECT COUNT(*) + 1 INTO v_bid_position
  FROM auction_bids
  WHERE instance_id = p_instance_id
    AND is_unique = true
    AND is_burned = false
    AND bid_amount < p_bid_amount;

  UPDATE auction_bids SET bid_position = v_bid_position WHERE id = v_bid_id;

  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_bid_id,
    'is_burned', v_is_duplicate,
    'position', CASE WHEN v_is_duplicate THEN null ELSE v_bid_position END,
    'message', CASE WHEN v_is_duplicate THEN 'Bid burned — duplicate value!' ELSE 'Bid placed successfully' END
  );
END;
$$;


-- ============================================================
-- FIX #2: split_funds
-- Signature: (p_game_instance_id uuid, p_gross_amount numeric, p_ledger_event_id uuid)
-- Uses recipient_type and description on ledger_allocations
-- Allowed recipient_type: winner, platform, burn, social_L1-L5, jackpot, rollover, founder
-- ============================================================
CREATE OR REPLACE FUNCTION split_funds(
  p_game_instance_id uuid,
  p_gross_amount numeric,
  p_ledger_event_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alloc record;
  v_prize_pool numeric;
  v_house_fee numeric;
  v_social numeric;
  v_jackpot numeric;
  v_burn numeric;
BEGIN
  -- Fetch fund_allocations for this instance
  SELECT * INTO v_alloc
  FROM fund_allocations
  WHERE game_instance_id = p_game_instance_id;

  IF v_alloc IS NULL THEN
    -- Fallback: use default 55/15/5/10/15
    v_prize_pool := ROUND(p_gross_amount * 0.55, 2);
    v_house_fee := ROUND(p_gross_amount * 0.15, 2);
    v_social := ROUND(p_gross_amount * 0.05, 2);
    v_jackpot := ROUND(p_gross_amount * 0.10, 2);
    v_burn := p_gross_amount - v_prize_pool - v_house_fee - v_social - v_jackpot;
  ELSE
    v_prize_pool := ROUND(p_gross_amount * v_alloc.prize_pool_pct / 100, 2);
    v_house_fee := ROUND(p_gross_amount * v_alloc.house_fee_pct / 100, 2);
    v_social := ROUND(p_gross_amount * v_alloc.social_circle_pct / 100, 2);
    v_jackpot := ROUND(p_gross_amount * v_alloc.jackpot_pct / 100, 2);
    v_burn := p_gross_amount - v_prize_pool - v_house_fee - v_social - v_jackpot;
  END IF;

  -- Insert ledger_allocations using recipient_type and description columns
  IF v_prize_pool > 0 THEN
    INSERT INTO ledger_allocations (ledger_event_id, recipient_type, amount, description)
    VALUES (p_ledger_event_id, 'rollover', v_prize_pool, 'Prize pool allocation');
  END IF;

  IF v_house_fee > 0 THEN
    INSERT INTO ledger_allocations (ledger_event_id, recipient_type, amount, description)
    VALUES (p_ledger_event_id, 'platform', v_house_fee, 'Platform fee');
  END IF;

  IF v_social > 0 THEN
    INSERT INTO ledger_allocations (ledger_event_id, recipient_type, amount, description)
    VALUES (p_ledger_event_id, 'social_L1', v_social, 'Social circle allocation');
  END IF;

  IF v_jackpot > 0 THEN
    INSERT INTO ledger_allocations (ledger_event_id, recipient_type, amount, description)
    VALUES (p_ledger_event_id, 'jackpot', v_jackpot, 'Jackpot contribution');

    -- Update jackpots table
    UPDATE jackpots
    SET current_balance = current_balance + v_jackpot, updated_at = now()
    WHERE project = 'auction' AND status = 'ACTIVE';

    -- Record contribution
    INSERT INTO jackpot_contributions (jackpot_id, ledger_event_id, amount)
    SELECT j.id, p_ledger_event_id, v_jackpot
    FROM jackpots j WHERE j.project = 'auction' AND j.status = 'ACTIVE'
    LIMIT 1;
  END IF;

  IF v_burn > 0 THEN
    INSERT INTO ledger_allocations (ledger_event_id, recipient_type, amount, description)
    VALUES (p_ledger_event_id, 'burn', v_burn, 'Token burn');

    -- Record burn
    INSERT INTO token_burns (amount, source, ledger_event_id, reference_id)
    VALUES (v_burn, 'auction_bid', p_ledger_event_id, p_game_instance_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'prize_pool', v_prize_pool,
    'house_fee', v_house_fee,
    'social_circle', v_social,
    'jackpot', v_jackpot,
    'burn', v_burn
  );
END;
$$;


-- ============================================================
-- FIX #3: admin_create_auction
-- Must: create auction_configs, fund_allocations, auction_instances with fund_allocation_id
-- ============================================================
CREATE OR REPLACE FUNCTION admin_create_auction(
  p_admin_id uuid,
  p_name text,
  p_slug text,
  p_auction_type text DEFAULT 'timed',
  p_bid_fee numeric DEFAULT 10,
  p_max_bid_value numeric DEFAULT 99.99,
  p_min_bid_value numeric DEFAULT 0.01,
  p_duration_seconds int DEFAULT 86400,
  p_image_url text DEFAULT NULL,
  p_total_bids_to_hot int DEFAULT NULL,
  p_hot_mode_duration_seconds int DEFAULT NULL,
  p_total_bids_to_close int DEFAULT NULL,
  p_prize_type text DEFAULT 'pool_funded',
  p_manual_prize_title text DEFAULT NULL,
  p_jackpot_seed numeric DEFAULT 0,
  p_split_prize_pct numeric DEFAULT 55,
  p_split_burn_pct numeric DEFAULT 15,
  p_split_house_pct numeric DEFAULT 15,
  p_split_social_pct numeric DEFAULT 5,
  p_split_jackpot_pct numeric DEFAULT 10
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_config_id uuid;
  v_fund_alloc_id uuid;
  v_instance_id uuid;
  v_initial_status text;
  v_scheduled_end timestamptz;
BEGIN
  -- Verify admin role
  SELECT role INTO v_role FROM users WHERE id = p_admin_id;
  IF v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: not an admin';
  END IF;

  -- 1. Create auction_configs
  INSERT INTO auction_configs (
    name, slug, auction_type, bid_fee, currency,
    min_bid_value, max_bid_value, image_url,
    total_bids_to_hot, hot_mode_duration_seconds,
    auction_duration_seconds, total_bids_to_close,
    prize_type, manual_prize_title, jackpot_seed,
    prize_pool_pct, platform_pct, burn_pct,
    social_circle_pct, rollover_pct,
    created_by, is_template
  ) VALUES (
    p_name, p_slug, p_auction_type, p_bid_fee, 'PNGWIN',
    p_min_bid_value, p_max_bid_value, p_image_url,
    p_total_bids_to_hot, p_hot_mode_duration_seconds,
    p_duration_seconds, p_total_bids_to_close,
    p_prize_type, p_manual_prize_title, p_jackpot_seed,
    p_split_prize_pct, p_split_house_pct, p_split_burn_pct,
    p_split_social_pct, p_split_jackpot_pct,
    p_admin_id, false
  ) RETURNING id INTO v_config_id;

  -- 2. Create fund_allocations row
  INSERT INTO fund_allocations (
    game_instance_id, game_type,
    prize_pool_pct, house_fee_pct, social_circle_pct,
    jackpot_pct, burn_pct, entry_cost, currency
  ) VALUES (
    -- We'll update game_instance_id after creating the instance
    gen_random_uuid(), 'auction',
    p_split_prize_pct, p_split_house_pct, p_split_social_pct,
    p_split_jackpot_pct, p_split_burn_pct, p_bid_fee, 'PNGWIN'
  ) RETURNING id INTO v_fund_alloc_id;

  -- 3. Determine initial status and scheduled_end
  v_initial_status := 'accumulating';
  IF p_auction_type IN ('timed', 'blind_timed') AND p_duration_seconds IS NOT NULL THEN
    v_scheduled_end := now() + (p_duration_seconds || ' seconds')::interval;
  END IF;

  -- 4. Create auction_instances with fund_allocation_id
  INSERT INTO auction_instances (
    config_id, fund_allocation_id, status,
    total_bids, unique_bidders, total_bid_fees,
    prize_pool, burned_amount, scheduled_end
  ) VALUES (
    v_config_id, v_fund_alloc_id, v_initial_status,
    0, 0, 0,
    COALESCE(p_jackpot_seed, 0), 0, v_scheduled_end
  ) RETURNING id INTO v_instance_id;

  -- 5. Update fund_allocations.game_instance_id to point to the real instance
  UPDATE fund_allocations
  SET game_instance_id = v_instance_id
  WHERE id = v_fund_alloc_id;

  -- 6. Log admin action
  INSERT INTO auction_admin_log (instance_id, admin_id, action, details)
  VALUES (v_instance_id, p_admin_id, 'create', jsonb_build_object(
    'name', p_name, 'type', p_auction_type, 'bid_fee', p_bid_fee,
    'split', jsonb_build_object(
      'prize', p_split_prize_pct, 'house', p_split_house_pct,
      'burn', p_split_burn_pct, 'social', p_split_social_pct,
      'jackpot', p_split_jackpot_pct
    )
  ));

  RETURN v_instance_id;
END;
$$;
