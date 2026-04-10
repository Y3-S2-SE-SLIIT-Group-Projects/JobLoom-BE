#!/usr/bin/env python3
"""
JobLoom — Review API end-to-end test suite
Seeds fresh test data, then exercises every review endpoint.

Usage:
    cd JobLoom-BE
    python3 scripts/test-reviews.py
"""

import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# colours
G = "\033[0;32m"; R = "\033[0;31m"; Y = "\033[1;33m"
C = "\033[0;36m"; B = "\033[1m";    N = "\033[0m"

pass_count = 0
fail_count = 0

def sep(title):
    print(f"\n{B}{Y}{'━'*50}{N}")
    print(f"{B}{Y}  {title}{N}")
    print(f"{B}{Y}{'━'*50}{N}")

def ok(label, detail=""):
    global pass_count
    pass_count += 1
    suffix = f"  {C}({detail}){N}" if detail else ""
    print(f"{G}✅ PASS{N} {label}{suffix}")

def fail(label, detail=""):
    global fail_count
    fail_count += 1
    suffix = f"  {R}({detail}){N}" if detail else ""
    print(f"{R}❌ FAIL{N} {label}{suffix}")

def skip(label):
    print(f"{Y}⏭  SKIP{N} {label}")

def info(msg):
    print(f"{C}   ➜  {msg}{N}")

# HTTP helper
BASE = "http://127.0.0.1:3008/api"   # 127.0.0.1 avoids IPv6/DNS issues

def req(method, path, body=None, token=None, params=None, _retry=3):
    """Returns (http_code:int, parsed_json:dict|list).
    Retries on RemoteDisconnected errors (can happen right after subprocess runs node)."""
    url = BASE + path
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{qs}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    for attempt in range(_retry):
        try:
            with urllib.request.urlopen(r, timeout=10) as res:
                return res.status, json.loads(res.read())
        except urllib.error.HTTPError as e:
            try:
                return e.code, json.loads(e.read())
            except Exception:
                return e.code, {}
        except Exception as e:
            if attempt < _retry - 1:
                time.sleep(0.8)
                continue
            print(f"{R}  [connection error] {e}{N}")
            return 0, {}

def expect(label, code, resp, expected):
    """expected can be 'ok' (2xx) or an exact int."""
    if expected == "ok":
        ok_flag = 200 <= code < 300
    else:
        ok_flag = (code == expected)
    if ok_flag:
        ok(label, f"HTTP {code}")
    else:
        msg = resp.get("message", "(no message)") if isinstance(resp, dict) else ""
        fail(label, f"expected {expected}, got {code}: {msg}")
    return ok_flag


# SEED — run seed script first, then read the written IDs file

sep("SEED — Creating fresh test data")

script_dir = Path(__file__).parent
project_dir = script_dir.parent
ids_file = script_dir / "seed-ids.json"

print("  Running seed script…")
result = subprocess.run(
    ["node", "scripts/seed-review-test.js"],
    capture_output=True, text=True,
    cwd=str(project_dir)
)
for line in (result.stdout + result.stderr).splitlines():
    if any(k in line for k in ["✅", "Employer ID", "JobSeeker", "Job 1", "Job 2"]):
        print(" ", line.strip())

if not ids_file.exists():
    print(f"{R}ERROR: seed-ids.json not created. Seed output:{N}")
    print(result.stdout[-500:])
    sys.exit(1)

# Warm up — wait for the server to stabilise after node's DNS changes
for _w in range(5):
    wcode, _ = req("GET", "/reviews/stats/000000000000000000000000", _retry=1)
    if wcode != 0:
        break
    time.sleep(0.8)

ids = json.loads(ids_file.read_text())
EMP  = ids.get("employerId", "")
SEEK = ids.get("jobSeekerId", "")
JOB1 = ids.get("job1Id", "")
JOB2 = ids.get("job2Id", "")
# Pre-baked tokens from seed (bypass login for stability; section 0 still tests login endpoint)
SEED_EMP_TOK  = ids.get("employerToken", "")
SEED_SEEK_TOK = ids.get("seekerToken", "")

if not all([EMP, SEEK, JOB1, JOB2]):
    print(f"{R}ERROR: Missing IDs in seed-ids.json{N}")
    sys.exit(1)

info(f"employerId  = {EMP}")
info(f"seekerId    = {SEEK}")
info(f"job1Id      = {JOB1}")
info(f"job2Id      = {JOB2}")

info(f"employerId  = {EMP}")
info(f"seekerId    = {SEEK}")
info(f"job1Id      = {JOB1}")
info(f"job2Id      = {JOB2}")


# 0 — Login

sep("0 — Login")

_, res = req("POST", "/users/login", {"email": "seed.seeker@jobloom.test",  "password": "Test1234"})
SEEK_TOK = res.get("token", "") or SEED_SEEK_TOK
ok("Seeker login") if res.get("token") else fail("Seeker login", "no token — using seed token as fallback")

_, res = req("POST", "/users/login", {"email": "seed.employer@jobloom.test", "password": "Test1234"})
EMP_TOK = res.get("token", "") or SEED_EMP_TOK
ok("Employer login") if res.get("token") else fail("Employer login", "no token — using seed token as fallback")

if not SEEK_TOK or not EMP_TOK:
    print(f"{R}Cannot continue without tokens.{N}")
    sys.exit(1)


# 1 — Public Read (no auth)

sep("1 — Public Read (no auth required)")

code, res = req("GET", f"/reviews/user/{EMP}")
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[1.1] GET /reviews/user/:employerId  → {count} review(s)", code, res, "ok")

code, res = req("GET", f"/reviews/user/{SEEK}")
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[1.2] GET /reviews/user/:seekerId    → {count} review(s)", code, res, "ok")

code, res = req("GET", f"/reviews/job/{JOB1}")
count = (res.get("data") or {}).get("count", "?")
expect(f"[1.3] GET /reviews/job/:job1Id       → {count} review(s)", code, res, "ok")

code, res = req("GET", f"/reviews/job/{JOB2}")
count = (res.get("data") or {}).get("count", "?")
expect(f"[1.4] GET /reviews/job/:job2Id       → {count} review(s)", code, res, "ok")

code, res = req("GET", f"/reviews/stats/{EMP}")
stats = (res.get("data") or {}).get("stats", {})
expect(f"[1.5] GET /reviews/stats/:employer   → avg={stats.get('averageRating','?')} total={stats.get('totalReviews','?')}", code, res, "ok")

code, res = req("GET", f"/reviews/stats/{SEEK}")
stats = (res.get("data") or {}).get("stats", {})
expect(f"[1.6] GET /reviews/stats/:seeker     → avg={stats.get('averageRating','?')} total={stats.get('totalReviews','?')}", code, res, "ok")

code, res = req("GET", f"/reviews/employer/{EMP}")
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[1.7] GET /reviews/employer/:id      → {count} review(s)", code, res, "ok")

code, res = req("GET", f"/reviews/jobseeker/{SEEK}")
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[1.8] GET /reviews/jobseeker/:id     → {count} review(s)", code, res, "ok")


# 2 — Create Reviews

sep("2 — Create Reviews [Protected]")
REVIEW1_ID = ""
REVIEW2_ID = ""

code, res = req("POST", "/reviews", {
    "revieweeId": EMP, "jobId": JOB1, "reviewerType": "job_seeker",
    "rating": 5, "comment": "Excellent employer! Paid on time and very communicative.",
    "workQuality": 5, "communication": 5, "punctuality": 5, "wouldRecommend": True
}, SEEK_TOK)
if expect("[2.1] Seeker → Employer (Job 1, full criteria)", code, res, "ok"):
    REVIEW1_ID = ((res.get("data") or {}).get("review") or {}).get("_id", "")
    if REVIEW1_ID:
        info(f"review1Id = {REVIEW1_ID}")

code, res = req("POST", "/reviews", {
    "revieweeId": SEEK, "jobId": JOB1, "reviewerType": "employer",
    "rating": 4, "comment": "Hard worker, showed up every day. Would hire again.",
    "workQuality": 4, "communication": 4, "paymentOnTime": 5, "wouldRecommend": True
}, EMP_TOK)
if expect("[2.2] Employer → Seeker (Job 1, full criteria)", code, res, "ok"):
    REVIEW2_ID = ((res.get("data") or {}).get("review") or {}).get("_id", "")
    if REVIEW2_ID:
        info(f"review2Id = {REVIEW2_ID}")

code, res = req("POST", "/reviews", {
    "revieweeId": EMP, "jobId": JOB2, "reviewerType": "job_seeker",
    "rating": 4, "comment": "Good employer. Payment slightly delayed but resolved.",
    "wouldRecommend": True
}, SEEK_TOK)
expect("[2.3] Seeker → Employer (Job 2, overall only)", code, res, "ok")

code, res = req("POST", "/reviews", {
    "revieweeId": SEEK, "jobId": JOB2, "reviewerType": "employer",
    "rating": 3, "comment": "Decent worker but needed some guidance.",
    "workQuality": 3, "communication": 3, "wouldRecommend": False
}, EMP_TOK)
expect("[2.4] Employer → Seeker (Job 2, partial criteria)", code, res, "ok")


# 3 — Get single review by ID

sep("3 — Get Review by ID")

if REVIEW1_ID:
    code, res = req("GET", f"/reviews/{REVIEW1_ID}")
    rating = ((res.get("data") or {}).get("review") or {}).get("rating", "?")
    expect(f"[3.1] GET /reviews/{REVIEW1_ID[:12]}...  rating={rating}", code, res, 200)
else:
    skip("[3.1] GET single review — review1Id not captured (section 2 failed)")


# 4 — Pagination & Filtering

sep("4 — Pagination & Filtering")

code, res = req("GET", f"/reviews/user/{EMP}", params={"reviewerType": "job_seeker", "sort": "-createdAt", "page": "1", "limit": "5"})
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[4.1] Filter reviewerType=job_seeker → {count} result(s)", code, res, "ok")

code, res = req("GET", f"/reviews/user/{EMP}", params={"sort": "rating", "page": "1", "limit": "5"})
expect("[4.2] Sort by rating asc", code, res, 200)

code, res = req("GET", f"/reviews/user/{EMP}", params={"page": "1", "limit": "2"})
count = len((res.get("data") or {}).get("reviews", []))
expect(f"[4.3] Limit=2 → {count} result(s)", code, res, "ok")


# 5 — Update Review (own only)

sep("5 — Update Review [Protected — own review only]")

if REVIEW1_ID:
    code, res = req("PUT", f"/reviews/{REVIEW1_ID}", {
        "rating": 5, "comment": "Updated: Even better than I first thought — highly recommend!"
    }, SEEK_TOK)
    expect("[5.1] Seeker updates own review", code, res, "ok")

    code, res = req("PUT", f"/reviews/{REVIEW1_ID}", {
        "comment": "Employer trying to edit seeker review"
    }, EMP_TOK)
    if not (200 <= code < 300):
        ok(f"[5.2] Employer cannot edit seeker review (HTTP {code}) ✓")
    else:
        fail(f"[5.2] Expected auth error, got {code}")
else:
    skip("[5.1-5.2] Skipped — review1Id not captured")


# 6 — Report Review

sep("6 — Report Review [Protected]")

if REVIEW1_ID:
    code, res = req("POST", f"/reviews/{REVIEW1_ID}/report", {
        "reason": "This review contains inaccurate information about the payment schedule."
    }, EMP_TOK)
    expect("[6.1] Employer reports review1", code, res, "ok")
else:
    skip("[6.1] Skipped — review1Id not captured")


# 7 — Error Cases

sep("7 — Error Cases (expect failures)")

# 7.1 Duplicate review
code, res = req("POST", "/reviews", {
    "revieweeId": EMP, "jobId": JOB1, "reviewerType": "job_seeker",
    "rating": 4, "comment": "Duplicate attempt."
}, SEEK_TOK)
expect("[7.1] Duplicate review → 409 Conflict", code, res, 409)

# 7.2 Self-review
code, res = req("POST", "/reviews", {
    "revieweeId": SEEK, "jobId": JOB1, "reviewerType": "job_seeker",
    "rating": 5, "comment": "Reviewing myself."
}, SEEK_TOK)
expect("[7.2] Self-review → 400 Bad Request", code, res, 400)

# 7.3 No token
code, res = req("POST", "/reviews", {
    "revieweeId": EMP, "jobId": JOB1, "reviewerType": "job_seeker", "rating": 4
})
expect("[7.3] No auth token → 401 Unauthorized", code, res, 401)

# 7.4 Rating out of range
code, res = req("POST", "/reviews", {
    "revieweeId": EMP, "jobId": JOB1, "reviewerType": "job_seeker", "rating": 10
}, SEEK_TOK)
if code in (400, 422):
    ok(f"[7.4] Rating=10 → {code} Validation Error ✓")
else:
    fail(f"[7.4] Out-of-range rating — expected 400/422, got {code}")

# 7.5 Invalid MongoId
code, res = req("GET", "/reviews/not-a-valid-mongo-id")
if code in (400, 422):
    ok(f"[7.5] Invalid MongoId → {code} Validation Error ✓")
else:
    fail(f"[7.5] Invalid ID — expected 400/422, got {code}")

# 7.6 Report reason too short
if REVIEW1_ID:
    code, res = req("POST", f"/reviews/{REVIEW1_ID}/report", {"reason": "Bad"}, EMP_TOK)
    if code in (400, 422):
        ok(f"[7.6] Report reason too short → {code} ✓")
    else:
        fail(f"[7.6] Short reason — expected 400/422, got {code}")
else:
    skip("[7.6] Skipped — review1Id not captured")


# 8 — Stats after inserts

sep("8 — Final Stats Check")

code, res = req("GET", f"/reviews/stats/{EMP}")
s = (res.get("data") or {}).get("stats", {})
print(f"  Employer → avgRating: {s.get('averageRating','?')} | "
      f"totalReviews: {s.get('totalReviews','?')} | "
      f"distribution: {s.get('ratingDistribution', {})}")
expect("[8.1] Employer stats retrieved", code, res, "ok")

code, res = req("GET", f"/reviews/stats/{SEEK}")
s = (res.get("data") or {}).get("stats", {})
print(f"  Seeker   → avgRating: {s.get('averageRating','?')} | "
      f"totalReviews: {s.get('totalReviews','?')} | "
      f"distribution: {s.get('ratingDistribution', {})}")
expect("[8.2] Seeker stats retrieved", code, res, "ok")


# 9 — Delete (soft) + verify gone

sep("9 — Delete Review + Verify Gone")

if REVIEW1_ID:
    code, res = req("DELETE", f"/reviews/{REVIEW1_ID}", token=SEEK_TOK)
    expect("[9.1] Seeker deletes review1", code, res, "ok")

    code, res = req("GET", f"/reviews/{REVIEW1_ID}")
    expect("[9.2] GET deleted review → 404 Not Found", code, res, 404)
else:
    skip("[9.1-9.2] Skipped — review1Id not captured")


# Summary

sep("RESULTS")
print(f"  {G}Passed: {pass_count}{N}")
print(f"  {R}Failed: {fail_count}{N}")
print()
if fail_count == 0:
    print(f"  {G}{B}🎉  All tests passed!{N}")
    sys.exit(0)
else:
    print(f"  {R}{B}Some tests failed — see output above.{N}")
    sys.exit(1)
