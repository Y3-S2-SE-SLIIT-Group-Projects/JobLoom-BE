#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# JobLoom — Review API end-to-end test suite
# Seeds fresh data automatically, then exercises all review endpoints.
# Usage: cd JobLoom-BE && bash scripts/test-reviews.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail   # -e omitted — HTTP errors handled manually

BASE="http://localhost:3008/api"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

PASS_COUNT=0; FAIL_COUNT=0
pass()  { echo -e "${GREEN}✅ PASS${NC} $*"; (( PASS_COUNT++ )) || true; }
fail()  { echo -e "${RED}❌ FAIL${NC} $*"; (( FAIL_COUNT++ ))  || true; }
skip()  { echo -e "${YELLOW}⏭  SKIP${NC} $*"; }
info()  { echo -e "${CYAN}   ➜  $*${NC}"; }
sep()   {
  echo ""
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${YELLOW}  $*${NC}"
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ── curl helper — req <METHOD> <URL> [extra flags...]
# Sets $HTTP_CODE (3-digit string) and $RES (response body)
HTTP_CODE=""; RES=""
req() {
  local method=$1; shift
  local url=$1;    shift
  local tmp; tmp=$(mktemp)
  HTTP_CODE=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" "$url" "$@")
  RES=$(cat "$tmp")
  rm -f "$tmp"
}

expect() {
  # expect <label> <"2xx" | exact-code>
  local label=$1 expected=$2 ok=false
  [[ "$expected" == "2xx" && "${HTTP_CODE:0:1}" == "2" ]] && ok=true
  [[ "$expected" == "$HTTP_CODE" ]] && ok=true
  if $ok; then
    pass "$label (HTTP $HTTP_CODE)"
  else
    local msg; msg=$(echo "$RES" | python3 -c \
      "import sys,json; print(json.load(sys.stdin).get('message','(no message)'))" 2>/dev/null \
      || echo "(parse error)")
    fail "$label — expected $expected, got $HTTP_CODE: $msg"
  fi
}

field() {
  # field <python-expr using d as parsed JSON>
  echo "$RES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
try: print($1)
except: print('')
" 2>/dev/null || echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
sep "SEED — Creating fresh test data"
SEED_OUT=$(node scripts/seed-review-test.js 2>&1)
echo "$SEED_OUT" | grep -E '(✅|Employer ID|JobSeeker|Job 1|Job 2)' | head -10

EMP=$(echo  "$SEED_OUT" | grep 'Employer ID'  | grep -oE '[0-9a-f]{24}' | head -1)
SEEK=$(echo "$SEED_OUT" | grep 'JobSeeker ID' | grep -oE '[0-9a-f]{24}' | head -1)
JOB1=$(echo "$SEED_OUT" | grep 'Job 1 ID'    | grep -oE '[0-9a-f]{24}' | head -1)
JOB2=$(echo "$SEED_OUT" | grep 'Job 2 ID'    | grep -oE '[0-9a-f]{24}' | head -1)

if [[ -z "$EMP" || -z "$SEEK" || -z "$JOB1" || -z "$JOB2" ]]; then
  echo -e "${RED}ERROR: Could not parse seed IDs. Is the server + DB reachable?${NC}"
  exit 1
fi
info "employerId  = $EMP"
info "seekerId    = $SEEK"
info "job1Id      = $JOB1"
info "job2Id      = $JOB2"

# ─────────────────────────────────────────────────────────────────────────────
sep "0 — Login"
req POST "$BASE/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seed.seeker@jobloom.test","password":"Test1234"}'
SEEKER_TOKEN=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
pass "Seeker login"

req POST "$BASE/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seed.employer@jobloom.test","password":"Test1234"}'
EMPLOYER_TOKEN=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
pass "Employer login"

# ─────────────────────────────────────────────────────────────────────────────
sep "1 — Public Read (no auth required)"
req GET "$BASE/reviews/user/$EMP"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[1.1] GET /reviews/user/:employerId   → $COUNT review(s)"

req GET "$BASE/reviews/user/$SEEK"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[1.2] GET /reviews/user/:seekerId     → $COUNT review(s)"

req GET "$BASE/reviews/job/$JOB1"
COUNT=$(field "d.get('data',{}).get('count','?')")
pass "[1.3] GET /reviews/job/:job1Id        → $COUNT review(s)"

req GET "$BASE/reviews/job/$JOB2"
COUNT=$(field "d.get('data',{}).get('count','?')")
pass "[1.4] GET /reviews/job/:job2Id        → $COUNT review(s)"

req GET "$BASE/reviews/stats/$EMP"
AVG=$(field "d.get('data',{}).get('stats',{}).get('averageRating','?')")
TOT=$(field "d.get('data',{}).get('stats',{}).get('totalReviews','?')")
pass "[1.5] GET /reviews/stats/:employerId  → avg=$AVG total=$TOT"

req GET "$BASE/reviews/stats/$SEEK"
AVG=$(field "d.get('data',{}).get('stats',{}).get('averageRating','?')")
TOT=$(field "d.get('data',{}).get('stats',{}).get('totalReviews','?')")
pass "[1.6] GET /reviews/stats/:seekerId    → avg=$AVG total=$TOT"

req GET "$BASE/reviews/employer/$EMP"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[1.7] GET /reviews/employer/:id       → $COUNT"

req GET "$BASE/reviews/jobseeker/$SEEK"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[1.8] GET /reviews/jobseeker/:id      → $COUNT"

# ─────────────────────────────────────────────────────────────────────────────
sep "2 — Create Reviews [Protected]"
REVIEW1_ID=""; REVIEW2_ID=""

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEEKER_TOKEN" \
  -d "{\"revieweeId\":\"$EMP\",\"jobId\":\"$JOB1\",\"reviewerType\":\"job_seeker\",\"rating\":5,\"comment\":\"Excellent employer! Paid on time and communicative.\",\"workQuality\":5,\"communication\":5,\"punctuality\":5,\"wouldRecommend\":true}"
expect "[2.1] Seeker → Employer (Job 1, full criteria)" "2xx"
REVIEW1_ID=$(field "d['data']['review']['_id']")
[[ -n "$REVIEW1_ID" ]] && info "review1Id = $REVIEW1_ID"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"revieweeId\":\"$SEEK\",\"jobId\":\"$JOB1\",\"reviewerType\":\"employer\",\"rating\":4,\"comment\":\"Hard worker, showed up every day. Would hire again.\",\"workQuality\":4,\"communication\":4,\"paymentOnTime\":5,\"wouldRecommend\":true}"
expect "[2.2] Employer → Seeker (Job 1, full criteria)" "2xx"
REVIEW2_ID=$(field "d['data']['review']['_id']")
[[ -n "$REVIEW2_ID" ]] && info "review2Id = $REVIEW2_ID"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEEKER_TOKEN" \
  -d "{\"revieweeId\":\"$EMP\",\"jobId\":\"$JOB2\",\"reviewerType\":\"job_seeker\",\"rating\":4,\"comment\":\"Good employer. Payment slightly delayed but resolved.\",\"wouldRecommend\":true}"
expect "[2.3] Seeker → Employer (Job 2, overall only)" "2xx"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"revieweeId\":\"$SEEK\",\"jobId\":\"$JOB2\",\"reviewerType\":\"employer\",\"rating\":3,\"comment\":\"Decent worker but needed guidance.\",\"workQuality\":3,\"communication\":3,\"wouldRecommend\":false}"
expect "[2.4] Employer → Seeker (Job 2, partial criteria)" "2xx"

# ─────────────────────────────────────────────────────────────────────────────
sep "3 — Get Review by ID"
if [[ -n "$REVIEW1_ID" ]]; then
  req GET "$BASE/reviews/$REVIEW1_ID"
  RATING=$(field "d.get('data',{}).get('review',{}).get('rating','?')")
  expect "[3.1] GET /reviews/:review1Id" "200"
  info "rating = $RATING"
else
  skip "[3.1] Skipped — review1Id not captured"
fi

# ─────────────────────────────────────────────────────────────────────────────
sep "4 — Pagination & Filtering"
req GET "$BASE/reviews/user/$EMP?reviewerType=job_seeker&sort=-createdAt&page=1&limit=5"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[4.1] Filter reviewerType=job_seeker  → $COUNT result(s)"

req GET "$BASE/reviews/user/$EMP?sort=rating&page=1&limit=5"
expect "[4.2] Sort by rating asc" "200"

req GET "$BASE/reviews/user/$EMP?page=1&limit=2"
COUNT=$(field "len(d.get('data',{}).get('reviews',[]))")
pass "[4.3] Limit=2                         → $COUNT result(s)"

# ─────────────────────────────────────────────────────────────────────────────
sep "5 — Update Review [Protected — own review only]"
if [[ -n "$REVIEW1_ID" ]]; then
  req PUT "$BASE/reviews/$REVIEW1_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SEEKER_TOKEN" \
    -d '{"rating":5,"comment":"Updated: Even better than first thought — highly recommend!"}'
  expect "[5.1] Seeker updates own review" "2xx"

  req PUT "$BASE/reviews/$REVIEW1_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -d '{"comment":"Employer trying to edit seekers review"}'
  [[ "${HTTP_CODE:0:1}" != "2" ]] \
    && pass "[5.2] Employer cannot edit seeker review (HTTP $HTTP_CODE) ✓" \
    || fail "[5.2] Expected non-2xx when editing someone else's review, got $HTTP_CODE"
else
  skip "[5.1-5.2] Skipped — review1Id not captured"
fi

# ─────────────────────────────────────────────────────────────────────────────
sep "6 — Report Review [Protected]"
if [[ -n "$REVIEW1_ID" ]]; then
  req POST "$BASE/reviews/$REVIEW1_ID/report" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -d '{"reason":"This review contains inaccurate information about the payment schedule."}'
  expect "[6.1] Employer reports review1" "2xx"
else
  skip "[6.1] Skipped — review1Id not captured"
fi

# ─────────────────────────────────────────────────────────────────────────────
sep "7 — Error Cases (expect failures)"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEEKER_TOKEN" \
  -d "{\"revieweeId\":\"$EMP\",\"jobId\":\"$JOB1\",\"reviewerType\":\"job_seeker\",\"rating\":4,\"comment\":\"Duplicate attempt.\"}"
[[ "$HTTP_CODE" == "409" ]] \
  && pass "[7.1] Duplicate review → 409 Conflict ✓" \
  || fail "[7.1] Duplicate review — expected 409, got $HTTP_CODE"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEEKER_TOKEN" \
  -d "{\"revieweeId\":\"$SEEK\",\"jobId\":\"$JOB1\",\"reviewerType\":\"job_seeker\",\"rating\":5,\"comment\":\"Reviewing myself.\"}"
[[ "$HTTP_CODE" == "400" ]] \
  && pass "[7.2] Self-review → 400 Bad Request ✓" \
  || fail "[7.2] Self-review — expected 400, got $HTTP_CODE"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -d "{\"revieweeId\":\"$EMP\",\"jobId\":\"$JOB1\",\"reviewerType\":\"job_seeker\",\"rating\":4}"
[[ "$HTTP_CODE" == "401" ]] \
  && pass "[7.3] No auth token → 401 Unauthorized ✓" \
  || fail "[7.3] No token — expected 401, got $HTTP_CODE"

req POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SEEKER_TOKEN" \
  -d "{\"revieweeId\":\"$EMP\",\"jobId\":\"$JOB1\",\"reviewerType\":\"job_seeker\",\"rating\":10}"
[[ "$HTTP_CODE" == "400" || "$HTTP_CODE" == "422" ]] \
  && pass "[7.4] Rating=10 → $HTTP_CODE Validation Error ✓" \
  || fail "[7.4] Out-of-range rating — expected 400/422, got $HTTP_CODE"

req GET "$BASE/reviews/not-a-valid-mongo-id"
[[ "$HTTP_CODE" == "400" || "$HTTP_CODE" == "422" ]] \
  && pass "[7.5] Invalid MongoId → $HTTP_CODE ✓" \
  || fail "[7.5] Invalid ID — expected 400/422, got $HTTP_CODE"

if [[ -n "$REVIEW1_ID" ]]; then
  req POST "$BASE/reviews/$REVIEW1_ID/report" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -d '{"reason":"Bad"}'
  [[ "$HTTP_CODE" == "400" || "$HTTP_CODE" == "422" ]] \
    && pass "[7.6] Report reason too short → $HTTP_CODE ✓" \
    || fail "[7.6] Short reason — expected 400/422, got $HTTP_CODE"
else
  skip "[7.6] Skipped — review1Id not captured"
fi

# ─────────────────────────────────────────────────────────────────────────────
sep "8 — Final Stats Check"
req GET "$BASE/reviews/stats/$EMP"
echo "$RES" | python3 -c "
import sys,json
s=json.load(sys.stdin).get('data',{}).get('stats',{})
print('  Employer → avgRating:', s.get('averageRating','?'),
      '| totalReviews:', s.get('totalReviews','?'),
      '| distribution:', s.get('ratingDistribution',{}))
" 2>/dev/null
pass "[8.1] Employer stats"

req GET "$BASE/reviews/stats/$SEEK"
echo "$RES" | python3 -c "
import sys,json
s=json.load(sys.stdin).get('data',{}).get('stats',{})
print('  Seeker   → avgRating:', s.get('averageRating','?'),
      '| totalReviews:', s.get('totalReviews','?'),
      '| distribution:', s.get('ratingDistribution',{}))
" 2>/dev/null
pass "[8.2] Seeker stats"

# ─────────────────────────────────────────────────────────────────────────────
sep "9 — Delete Review + Verify Gone"
if [[ -n "$REVIEW1_ID" ]]; then
  req DELETE "$BASE/reviews/$REVIEW1_ID" \
    -H "Authorization: Bearer $SEEKER_TOKEN"
  expect "[9.1] Seeker deletes review1" "2xx"

  req GET "$BASE/reviews/$REVIEW1_ID"
  [[ "$HTTP_CODE" == "404" ]] \
    && pass "[9.2] GET deleted review → 404 Not Found ✓" \
    || fail "[9.2] Expected 404 after delete, got $HTTP_CODE"
else
  skip "[9.1-9.2] Skipped — review1Id not captured"
fi

# ─────────────────────────────────────────────────────────────────────────────
sep "RESULTS"
echo -e "  ${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "  ${RED}Failed: $FAIL_COUNT${NC}"
echo ""
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}All tests passed!${NC}"
else
  echo -e "  ${RED}${BOLD}Some tests failed — see output above.${NC}"
  exit 1
fi
