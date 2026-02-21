# PNGWIN AUCTION PLATFORM — MASTER BLUEPRINT FOR CURSOR
# Arctico Database: bfnkbidqriackvtsvqqq.supabase.co
# Date: 2026-02-22

> READ THIS ENTIRE DOCUMENT BEFORE TOUCHING ANY CODE.
> Every table, column, RPC, and status value listed here is the TRUTH.
> If your code uses different names, YOUR CODE IS WRONG.

---

## 1. ARCHITECTURE OVERVIEW

One database (Arctico) serves multiple game projects, each isolated by `project_slug`.
- `auction` — PNGWIN Auction platform (THIS APP)
- `cryptopix` — CryptoPix prediction game
- `lotto` — Lucky DAO Lottery
- `neurogrid` — NeuroGrid MLM

Every user has:
- ONE row in `users` (global identity)
- ONE wallet PER project in `wallets` (filtered by `project_slug`)
- ONE enrollment PER project in `project_members` (filtered by `project_slug`)
- Transaction history in `ledger_events` (filtered by `source_project`)

### GOLDEN RULES
1. **Never update wallets directly** — always use `create_ledger_event()` RPC
2. **Always filter wallets by project_slug** — `WHERE project_slug = 'auction'`
3. **Always filter ledger_events by source_project** — `WHERE source_project = 'auction'`
4. **All money flows through fund_allocations** — split_funds() handles prize/house/social/jackpot/burn
5. **RPCs handle all game logic** — frontend NEVER implements game rules

---

## 2. EXACT DATABASE SCHEMA — AUCTION TABLES

### users
```
id (uuid PK), username (text), email (text), role (text: player|admin|super_admin),
referral_code (text), referred_by (text), avatar_url (text),
upline_1 (uuid), upline_2 (uuid), upline_3 (uuid), upline_4 (uuid), upline_5 (uuid),
is_banned (boolean), created_at (timestamptz), updated_at (timestamptz)
```

### wallets
```
id (uuid PK), user_id (uuid FK→users), project_slug (text),
balance (numeric), total_deposited (numeric), total_withdrawn (numeric),
total_won (numeric), total_spent (numeric), total_burned (numeric),
created_at (timestamptz), updated_at (timestamptz)
```
**CRITICAL: Each user has one wallet PER project. Always filter: `.eq('project_slug', 'auction')`**

### project_members
```
id (uuid PK), user_id (uuid FK→users), project_slug (text),
display_name (text), enrolled_at (timestamptz), is_active (boolean), metadata (jsonb)
UNIQUE(user_id, project_slug)
```

### ledger_events
```
id (uuid PK), user_id (uuid FK→users), event_type (text), gross_amount (numeric),
net_amount (numeric), direction (text: IN|OUT), source_project (text),
source_reference (text), source_type (text), source_id (uuid),
description (text), metadata (jsonb), created_at (timestamptz)
```

### ledger_allocations
```
id (uuid PK), ledger_event_id (uuid FK→ledger_events),
recipient_type (text), recipient_user_id (uuid), amount (numeric),
description (text), created_at (timestamptz)
```
**NOTE: Column is `recipient_type` NOT `allocation_type`. Column is `description` NOT `recipient_label`.**

### fund_allocations
```
id (uuid PK), game_instance_id (uuid), game_type (text),
prize_pool_pct (numeric), house_fee_pct (numeric), social_circle_pct (numeric),
jackpot_pct (numeric), burn_pct (numeric), entry_cost (numeric),
currency (text), extra_recipients (jsonb), created_at (timestamptz)
```
**Must sum to 100: prize_pool_pct + house_fee_pct + social_circle_pct + jackpot_pct + burn_pct = 100**

### auction_configs
```
id (uuid PK), name (text), slug (text), description (text), image_url (text),
auction_type (text), bid_fee (numeric), currency (text),
min_bid_value (numeric), max_bid_value (numeric), bid_precision (integer),
consecutive_limit (integer CHECK 3-9), max_bids_per_player (integer),
free_bids_per_player (integer), paid_after_free (boolean), paid_bid_fee (numeric),
total_bids_to_hot (integer), hot_mode_duration_seconds (integer),
auction_duration_seconds (integer), total_bids_to_close (integer),
prize_type (text), manual_prize_title (text), manual_prize_description (text),
manual_prize_image_url (text), manual_prize_value (numeric),
jackpot_seed (numeric), prize_pool_pct (numeric), platform_pct (numeric),
burn_pct (numeric), social_circle_pct (numeric), rollover_pct (numeric),
min_badge_id (uuid), min_user_level (integer),
created_by (uuid), is_template (boolean),
created_at (timestamptz), updated_at (timestamptz)
```

### auction_instances
```
id (uuid PK), config_id (uuid FK→auction_configs), fund_allocation_id (uuid FK→fund_allocations),
status (text), total_bids (integer), unique_bidders (integer),
total_bid_fees (numeric), prize_pool (numeric),
hot_mode_started_at (timestamptz), hot_mode_ends_at (timestamptz),
scheduled_start (timestamptz), scheduled_end (timestamptz), actual_end (timestamptz),
winning_bid_id (uuid), winner_id (uuid), winning_amount (numeric), burned_amount (numeric),
created_at (timestamptz), updated_at (timestamptz)
```

### auction_bids
```
id (uuid PK), instance_id (uuid FK→auction_instances), user_id (uuid FK→users),
bid_amount (numeric), bid_fee_paid (numeric),
is_unique (boolean), is_burned (boolean), is_winning (boolean),
bid_position (integer), ledger_event_id (uuid FK→ledger_events),
created_at (timestamptz)
```

### auction_results
```
id (uuid PK), instance_id (uuid FK→auction_instances),
winning_price (numeric), total_bids (integer), total_bid_fees (numeric),
winner_id (uuid), has_winner (boolean),
prize_distributed (numeric), burned (numeric), house_revenue (numeric),
social_distributed (numeric), jackpot_contributed (numeric),
rolled_over (numeric), rollover_to_id (uuid),
resolved_at (timestamptz)
```

### auction_accounting
```
id (uuid PK), instance_id (uuid FK→auction_instances),
total_collected (numeric), prize_pool_amount (numeric),
house_fee_amount (numeric), social_circle_amount (numeric),
jackpot_amount (numeric), burn_amount (numeric),
resolved_at (timestamptz)
```

### auction_free_bids
```
id (uuid PK), instance_id (uuid FK→auction_instances),
user_id (uuid FK→users), granted_by (uuid),
total_granted (integer), used (integer), remaining (integer),
hot_mode_only (boolean), created_at (timestamptz)
```

### auction_early_bird_configs / auction_early_bird_claims
Early bird reward configuration and claim tracking per auction instance.

### auction_raid_configs / auction_raid_activations / auction_raid_claims
Raid event configuration, activation, and claim tracking per auction instance.

### auction_admin_log
```
id (uuid PK), instance_id (uuid), admin_id (uuid),
action (text), details (jsonb), created_at (timestamptz)
```

### auction_price_changes
Tracks bid fee changes during auction lifecycle.

### auction_burned_values
Tracks which bid values have been burned (duplicates).

### auction_revenge_bids
Tracks revenge bid windows for outbid users.

---

## 3. CHECK CONSTRAINTS — EXACT ALLOWED VALUES

### auction_type (on auction_configs)
```
'live_before_hot', 'timed', 'blind_count', 'blind_timed', 'free', 'jackpot'
```
NOT 'live', NOT 'blind_timer', NOT 'jackpot_huba', NOT 'jackpot_rng', NOT 'airdrop_random', NOT 'airdrop_split'

### prize_type (on auction_configs)
```
'pool_funded', 'manual', 'jackpot'
```
NOT 'pool'

### status (on auction_instances)
```
'scheduled', 'accumulating', 'hot_mode', 'grace_period', 'closed', 'resolved', 'cancelled'
```
NOT 'live', NOT 'hot', NOT 'ended'

### consecutive_limit (on auction_configs)
Must be between 3 and 9.

---

## 4. AUCTION LIFECYCLE — HOW IT WORKS

### Live Before Hot (live_before_hot)
```
1. Admin creates auction → status = 'scheduled' or 'accumulating'
2. Players place bids → each bid:
   - Deducts bid_fee from wallet via create_ledger_event
   - Calls split_funds() to allocate prize/house/social/jackpot/burn
   - Increments total_bids, total_bid_fees, prize_pool, burned_amount
   - Checks for duplicate bid_amount → marks is_burned = true
   - Checks consecutive bid limit (no 5+ sequential values like 9.99, 9.98, 9.97...)
3. When total_bids >= total_bids_to_hot → status changes to 'hot_mode'
   - hot_mode_started_at = now()
   - hot_mode_ends_at = now() + hot_mode_duration_seconds
   - scheduled_end = hot_mode_ends_at
4. During hot_mode: bids still accepted, countdown running
5. If bid placed in last 30 seconds → grace_period triggered
   - Timer extends by 30 seconds (anti-snipe)
6. When timer expires and no new bids → status = 'closed'
7. Resolve: find lowest unique bid → winner gets prize_pool
   - Winner: lowest bid_amount WHERE is_unique = true AND is_burned = false
   - Results written to auction_results
   - Status → 'resolved'
```

### Timed
```
1. Auction runs for auction_duration_seconds
2. All bids are sealed (blind) during this time
3. When timer expires → resolve like live_before_hot
```

### Blind Count (blind_count)
```
1. Bids collected until total_bids >= total_bids_to_close
2. All bids sealed until close
3. When count reached → close and resolve
```

### Blind Timed (blind_timed)
```
1. Combination: runs for duration OR until bid count, whichever first
2. All bids sealed
3. Resolve when either condition met
```

### Free
```
1. No bid fee charged
2. prize_type = 'manual' (admin sets manual prize)
3. Otherwise same lifecycle
```

### Jackpot
```
1. prize_type = 'jackpot'
2. Prize comes from jackpot pool (jackpot_seed + accumulated)
3. If no winner → prize rolls over to next auction
```

---

## 5. BID MECHANICS — THE CORE GAME

### Placing a Bid
1. Player enters a number between min_bid_value and max_bid_value (e.g., 0.01 to 99.99)
2. bid_fee is deducted from wallet
3. If another player already has the same bid_amount → BOTH bids are burned (is_burned = true)
4. If no other player has it → bid is unique (is_unique = true)
5. Players compete for the LOWEST UNIQUE bid
6. In hot_mode: all bid positions become visible to everyone

### Bid Position
- Ranks all unique (non-burned) bids from lowest to highest
- Position 1 = lowest unique bid = WINNER
- Player's goal: find a number nobody else has picked

### Fund Split Per Bid
Every bid_fee gets split by split_funds() according to fund_allocations:
```
bid_fee (e.g., 10 PNGWIN)
  ├── Prize Pool:     55% = 5.50 → goes to prize_pool on instance
  ├── House Fee:      15% = 1.50 → platform revenue
  ├── Social Circle:   5% = 0.50 → L1-L5 referral bonuses
  ├── Jackpot:        10% = 1.00 → jackpot pool
  └── Burn:           15% = 1.50 → token burn (deflationary)
```

---

## 6. PVP DUEL SYSTEM

### Tables
**pvp_rooms**
```
id (uuid PK), stake (numeric), room_type (text), crypto_symbol (text),
project_slug (text), status (text), max_players (integer),
start_price (numeric), end_price (numeric),
created_at (timestamptz), settled_at (timestamptz)
```

**pvp_entries**
```
id (uuid PK), room_id (uuid FK→pvp_rooms), user_id (uuid FK→users),
prediction (numeric), accuracy (numeric), payout (numeric),
entered_at (timestamptz)
```

### PvP Flow
1. Player creates/joins a room → `get_or_create_pvp_room(p_stake, p_room_type, p_crypto_symbol, p_project_slug)`
2. Both players submit predictions → `submit_pvp_prediction(p_room_id, p_user_id, p_prediction)` or `enter_pvp_duel(p_room_id, p_user_id, p_bid_value)`
3. Entry fee (stake) deducted from wallet
4. When both players are in → room waits for price measurement
5. At end time → `settle_pvp_room(p_room_id, p_end_price)` determines winner
6. Winner = closest prediction to actual price
7. Winner gets prize, split via fund_allocations
8. Cancel: `cancel_pvp_entry(p_room_id, p_user_id)` — refunds stake

---

## 7. TOURNAMENT SYSTEM

### Tables
**tournaments**
```
id (uuid PK), name (text), status (text), size (integer),
entry_fee (numeric), type (text DEFAULT 'BRACKET'),
project_slug (text), created_at (timestamptz)
```

**tournament_entries**
```
id (uuid PK), tournament_id (uuid FK), user_id (uuid FK),
seed (integer), created_at (timestamptz)
```

**tournament_matches**
```
id (uuid PK), tournament_id (uuid FK), round (integer),
player_a_id (uuid), player_b_id (uuid),
player_a_bid (numeric), player_b_bid (numeric),
winner_id (uuid), status (text), created_at (timestamptz)
```

### Tournament Flow
1. Admin creates tournament → `admin_create_tournament(p_admin_id, p_name, p_size, p_entry_fee, p_type)`
2. Players join → `join_tournament(p_tournament_id, p_user_id)` — deducts entry_fee
3. Bracket matches generated
4. Each match: both players submit bids → `submit_tournament_bid(p_match_id, p_user_id, p_bid_value)`
5. Winner advances, loser eliminated
6. Final winner gets prize pool

---

## 8. SOCIAL CIRCLE SYSTEM

### How It Works
Every player has an upline chain (who referred them):
```
Player → L1 (direct referrer) → L2 → L3 → L4 → L5
```

When a player places a bid, the social_circle_pct of their bid_fee flows up:
- L1 gets X% of social pool
- L2 gets Y% of social pool
- L3-L5 get remaining %

### Tiered Unlock System
Social bonuses are UNLOCKED progressively:
- Tier 1: Place 1 bid → unlocks 25% of your level's max
- Tier 2: Place 5 bids → unlocks another 25%
- Tier 3: 3 active circle members this week → another 25%
- Tier 4: 10 active circle members → final 25%

Full unlock = 100% of your level's allocation.

### RPCs
- `get_social_circle_summary(p_user_id)` — total earnings, referral count, level unlocks
- `get_social_circle_in_auction(p_instance_id, p_user_id)` — bonuses earned in specific auction

### Tables
**social_circle_configs** — per-instance config (mode, level_splits, tier_requirements, multiplier)
**social_circle_payouts** — actual payments made to upline members

---

## 9. BADGE SYSTEM

### Categories (6 categories, 5 tiers each = 30 badges)
- A: Prediction Master (coupons played: 1/5/25/100/500)
- B: Winner's Circle (prizes won: 1/5/25/100/500)
- C: Sharpshooter (perfect scores: 1/3/10/25/50)
- D: Social Builder (circle size: 3/10/50/200/1000)
- E: PvP Champion (PvP created: 1/5/25/100/500)
- F: Streak Warrior (consecutive days: 7/14/30/90/365)

### Tables
**badges** — badge definitions with `project_slug`
```
id, slug, name, description, category, tier, requirement_type, requirement_value,
icon_url, project_slug, created_at
```

**user_badges** — earned badges with `project_slug`
```
id, user_id, badge_id, earned_at, project_slug
```

**user_badge_progress** — tracking progress with `project_slug`
```
id, user_id, badge_id, current_value, target_value, project_slug, updated_at
```

### RPC
- `get_user_badges_with_progress(p_user_id)` — returns all badges with current progress

---

## 10. JACKPOT & ROLLOVER SYSTEM

### Tables
**jackpots**
```
id, project (text), status (text: ACTIVE|RESOLVED),
current_balance (numeric), seed_amount (numeric),
created_at, updated_at
```

**jackpot_contributions**
```
id, jackpot_id (FK), ledger_event_id (FK), amount (numeric), created_at
```

### How Rollover Works
1. Each bid's jackpot_pct portion flows to active jackpot via split_funds()
2. If auction resolves with no winner → prize_pool rolls over
3. Rolled amount added to next auction's prize_pool or jackpot
4. `rollover_to_id` in auction_results links to next instance

### Token Burns
**token_burns**
```
id, amount (numeric), source (text), ledger_event_id (uuid),
reference_id (uuid), created_at
```
Every bid's burn_pct portion is recorded here. Permanent supply reduction.

---

## 11. ALL RPCs — EXACT SIGNATURES

### Auth & Users
| RPC | Parameters |
|-----|-----------|
| `complete_signup` | `p_user_id uuid, p_username text, p_email text, p_referral_code_used text, p_project_slug text DEFAULT 'global'` |
| `check_nickname_available` | `p_nickname text` |
| `get_my_role` | (none — uses auth.uid()) |

### Wallet & Ledger
| RPC | Parameters |
|-----|-----------|
| `create_ledger_event` | `p_user_id uuid, p_event_type text, p_gross_amount numeric, p_direction text (IN\|OUT), p_source_project text, p_source_reference text, p_source_type text, p_source_id uuid, p_description text, p_metadata jsonb DEFAULT '{}'` |

### Auction — Player
| RPC | Parameters |
|-----|-----------|
| `place_auction_bid` | `p_user_id uuid, p_instance_id uuid, p_bid_amount numeric` |
| `request_resolve` | `p_instance_id uuid` |
| `request_grace_period` | `p_instance_id uuid` |
| `resolve_auction_inline` | `p_instance_id uuid` |
| `get_auction_leaderboard` | `p_instance_id uuid, p_user_id uuid` |
| `get_auction_burned_values_count` | `p_instance_id uuid` |
| `get_active_revenge_window` | `p_instance_id uuid, p_user_id uuid` |

### Auction — Admin
| RPC | Parameters |
|-----|-----------|
| `admin_create_auction` | `p_admin_id uuid, p_name text, p_slug text, p_auction_type text DEFAULT 'timed', p_bid_fee numeric DEFAULT 10, p_max_bid_value numeric DEFAULT 99.99, p_min_bid_value numeric DEFAULT 0.01, p_duration_seconds int DEFAULT 86400, p_image_url text, p_total_bids_to_hot int, p_hot_mode_duration_seconds int, p_total_bids_to_close int, p_prize_type text DEFAULT 'pool_funded', p_manual_prize_title text, p_jackpot_seed numeric DEFAULT 0, p_split_prize_pct numeric DEFAULT 55, p_split_burn_pct numeric DEFAULT 15, p_split_house_pct numeric DEFAULT 15, p_split_social_pct numeric DEFAULT 5, p_split_jackpot_pct numeric DEFAULT 10` |
| `admin_auction_action` | `p_admin_id uuid, p_instance_id uuid, p_action text (pause\|resume\|end\|cancel\|extend\|force_hot), p_value numeric DEFAULT NULL` |
| `admin_save_as_template` | `p_admin_id uuid, p_config_id uuid, p_template_name text` |
| `admin_launch_from_template` | `p_admin_id uuid, p_template_id uuid, p_name text` |
| `admin_grant_free_bids` | `p_admin_id uuid, p_instance_id uuid, p_user_id uuid, p_count int, p_hot_mode_only boolean DEFAULT true` |
| `admin_jackpot_override` | `p_admin_id uuid, p_instance_id uuid, p_action text (adjust\|extend\|force_draw), p_ends_at timestamptz, p_adjust_prize numeric` |
| `admin_get_auction_log` | `p_admin_id uuid, p_instance_id uuid` |
| `admin_get_bid_log` | `p_admin_id uuid, p_instance_id uuid` |
| `admin_get_bidders` | `p_admin_id uuid, p_instance_id uuid` |
| `admin_get_players` | `p_admin_id uuid, p_search text, p_limit int DEFAULT 50, p_offset int DEFAULT 0` |
| `admin_update_player_role` | `p_admin_id uuid, p_user_id uuid, p_role text` |
| `admin_ban_player` | `p_admin_id uuid, p_user_id uuid, p_banned boolean` |
| `admin_get_settings` | `p_admin_id uuid` |
| `admin_update_setting` | `p_admin_id uuid, p_key text, p_value jsonb` |
| `admin_platform_stats` | `p_admin_id uuid` |
| `admin_platform_financials` | `p_admin_id uuid` |
| `admin_create_tournament` | `p_admin_id uuid, p_name text, p_size int, p_entry_fee numeric, p_type text DEFAULT 'BRACKET'` |

### PvP
| RPC | Parameters |
|-----|-----------|
| `get_or_create_pvp_room` | `p_stake numeric, p_room_type text, p_crypto_symbol text, p_project_slug text DEFAULT 'auction'` |
| `join_pvp_room` | `p_room_id uuid, p_user_id uuid, p_prediction numeric` |
| `submit_pvp_prediction` | `p_room_id uuid, p_user_id uuid, p_prediction numeric` |
| `enter_pvp_duel` | `p_room_id uuid, p_user_id uuid, p_bid_value numeric` |
| `cancel_pvp_entry` | `p_room_id uuid, p_user_id uuid` |
| `settle_pvp_room` | `p_room_id uuid, p_end_price numeric DEFAULT NULL` |
| `get_pvp_room_occupancy` | `p_room_id uuid` |
| `get_pvp_user_stats` | `p_user_id uuid` |
| `get_pvp_recent_duels` | `p_limit int DEFAULT 20` |

### Tournaments
| RPC | Parameters |
|-----|-----------|
| `join_tournament` | `p_tournament_id uuid, p_user_id uuid` |
| `submit_tournament_bid` | `p_match_id uuid, p_user_id uuid, p_bid_value numeric` |

### Social Circle
| RPC | Parameters |
|-----|-----------|
| `get_social_circle_summary` | `p_user_id uuid` |
| `get_social_circle_in_auction` | `p_instance_id uuid, p_user_id uuid` |

### Badges & Activity
| RPC | Parameters |
|-----|-----------|
| `get_user_badges_with_progress` | `p_user_id uuid` |
| `get_user_weekly_activity` | `p_user_id uuid` |
| `get_weekly_jackpot_history` | `p_user_id uuid` |

### Public Stats
| RPC | Parameters |
|-----|-----------|
| `public_platform_stats` | (none) |

---

## 12. split_funds() — THE MONEY ENGINE

```sql
-- Called by place_auction_bid for every bid
-- Reads fund_allocations for the game instance
-- Splits bid_fee into: prize_pool, house_fee, social_circle, jackpot, burn
-- Writes to ledger_allocations with recipient_type and description
-- Updates jackpots table if jackpot > 0
-- Inserts into token_burns if burn > 0

split_funds(p_game_instance_id uuid, p_gross_amount numeric, p_ledger_event_id uuid)
RETURNS jsonb: { success, prize_pool, house_fee, social_circle, jackpot, burn }
```

**CRITICAL**: Uses columns `recipient_type` and `description` on ledger_allocations.
NOT `allocation_type`, NOT `recipient_label`.

---

## 13. KNOWN ISSUES TO FIX

### A. place_auction_bid must do ALL of this per bid:
1. Check user has enough balance in wallet WHERE project_slug = 'auction'
2. Deduct bid_fee via create_ledger_event (direction = 'OUT')
3. Call split_funds() to allocate the bid_fee
4. Add prize portion to auction_instances.prize_pool
5. Add burn portion to auction_instances.burned_amount
6. Increment auction_instances.total_bids
7. Check if bid_amount is duplicate → set is_burned on BOTH bids
8. Check consecutive bid limit
9. Check if total_bids >= total_bids_to_hot → transition to hot_mode
10. Return bid position and leaderboard update

### B. Hot mode transition must:
- Set status = 'hot_mode'
- Set hot_mode_started_at = now()
- Set hot_mode_ends_at = now() + interval (hot_mode_duration_seconds || ' seconds')
- Set scheduled_end = hot_mode_ends_at

### C. Grace period must:
- When bid placed during hot_mode with < 30 seconds remaining
- Extend hot_mode_ends_at by 30 seconds
- Set status = 'grace_period'

### D. Resolve must:
- Find lowest bid_amount WHERE is_unique = true AND is_burned = false
- If found: winner, distribute prize_pool to winner via create_ledger_event
- If not found: mark rolled_over, add to next jackpot
- Write auction_results row
- Write auction_accounting row
- Set status = 'resolved', actual_end = now()

### E. Admin create auction must:
- Insert auction_configs
- Insert fund_allocations with the split percentages
- Insert auction_instances with fund_allocation_id pointing to the fund_allocations row
- Return the instance ID

---

## 14. FRONTEND PAGES — WHAT EACH PAGE NEEDS

### Player Pages
| Page | Route | Data Source |
|------|-------|------------|
| Homepage | `/` | `public_platform_stats()` |
| Lobby | `/auctions` | `auction_instances + auction_configs WHERE status IN ('accumulating','hot_mode','grace_period','scheduled')` |
| Auction Detail | `/auctions/:id` | Instance + config + bids + leaderboard via RPCs |
| Place Bid | (within detail) | `place_auction_bid(p_user_id, p_instance_id, p_bid_amount)` |
| Results | `/results` | `auction_results + auction_instances` |
| PvP Arena | `/pvp` | `pvp_rooms`, `get_pvp_recent_duels`, `get_pvp_user_stats` |
| Tournaments | `/tournaments` | `tournaments` table |
| Wallet | `/wallet` | `wallets WHERE project_slug='auction'` + `ledger_events WHERE source_project='auction'` |
| Profile | `/profile` | `users`, `get_user_badges_with_progress`, `get_user_weekly_activity` |
| Social Circle | `/social` | `get_social_circle_summary(p_user_id)` |
| Leaderboard | `/leaderboard` | `get_auction_leaderboard` or project_members query |
| Badges | `/badges` | `get_user_badges_with_progress(p_user_id)` |
| Jackpot | `/jackpot` | `get_weekly_jackpot_history(p_user_id)` |

### Admin Pages
| Page | Route | RPCs |
|------|-------|------|
| Dashboard | `/admin/dashboard` | `admin_platform_stats` + `admin_platform_financials` |
| Create Auction | `/admin/create` | `admin_create_auction` |
| Manage Auctions | `/admin/auctions` | `auction_instances` query + `admin_auction_action` |
| Templates | `/admin/templates` | `auction_configs WHERE is_template` + `admin_save_as_template` + `admin_launch_from_template` |
| Tournaments | `/admin/tournaments` | `admin_create_tournament` + `tournaments` query |
| Users | `/admin/players` | `admin_get_players` + `admin_update_player_role` + `admin_ban_player` + `create_ledger_event` |
| Financials | `/admin/financials` | `admin_platform_financials` |
| Logs | `/admin/logs` | `admin_get_auction_log` + `admin_get_bid_log` + `admin_get_bidders` |
| Settings | `/admin/settings` | `admin_get_settings` + `admin_update_setting` |
| AI Admin | `/admin/ai` | Anthropic API chat interface |

---

## 15. DESIGN SYSTEM

### Colors
```css
--background: #0a0a12
--card: #12131f
--card-hover: #1a1b2e
--border: rgba(255,255,255,0.08)
--gold: #f5c842
--green: #00e676
--red: #ff1744
--purple: #b388ff
--orange: #ff9100
--ice: #4fc3f7
--muted: #718096
```

### Fonts
- Display: Rajdhani (headings, big numbers)
- Body: Outfit (text)
- Mono: JetBrains Mono (prices, bids, stats)

### Status Colors
- accumulating: gold/amber
- hot_mode: red with pulse animation
- grace_period: orange
- closed: muted gray
- resolved: green
- cancelled: red/muted

---

## 16. TEST ACCOUNT

```
Email: bvhauge@gmail.com
User ID: 49668f63-dcd6-4b4c-bedf-51699cb9c0fb
Role: super_admin
```

Credit test wallet:
```sql
SELECT create_ledger_event(
  '49668f63-dcd6-4b4c-bedf-51699cb9c0fb', 'ADMIN_CREDIT', 100000,
  'IN', 'auction', 'test_seed_' || now()::text, 'admin', null, 'Test credits', '{}'::jsonb
);
```

---

## 17. DEPLOYMENT

```bash
npm run build        # must succeed with ZERO errors
npx vercel --prod    # deploys to macbook-pink.vercel.app
```

Environment variables (already set):
```
VITE_SUPABASE_URL=https://bfnkbidqriackvtsvqqq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## 18. INSTRUCTIONS FOR CURSOR

1. **Read this ENTIRE document first**
2. **Check every RPC in the database** — run `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'FUNCTION_NAME'` for any RPC that isn't working
3. **Fix place_auction_bid** — it must do ALL 10 steps listed in Section 13A
4. **Fix split_funds** — must use `recipient_type` and `description` columns (already fixed but verify)
5. **Fix admin_create_auction** — must create fund_allocations row and link it
6. **Fix hot mode transition** — must happen when total_bids >= total_bids_to_hot
7. **Test every page** — open DevTools, check for RPC errors, fix column name mismatches
8. **Build and deploy** — `npm run build && npx vercel --prod`
9. **Do NOT ask the user about individual errors** — read the RPC source, compare to this doc, fix it yourself
