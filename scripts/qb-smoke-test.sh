#!/usr/bin/env bash
# QuickBooks integration smoke test.
#
# Hits the read-only status endpoints to confirm the QB integration is wired
# up. Optionally exercises a single invoice push when QB_TEST_INVOICE_ID is
# set in the environment.
#
# Usage:
#   ./scripts/qb-smoke-test.sh
#   BASE_URL=https://bridgepointepainting.com ./scripts/qb-smoke-test.sh
#   QB_TEST_INVOICE_ID=inv_abc123 ./scripts/qb-smoke-test.sh
#   ADMIN_CRON_SECRET=... ./scripts/qb-smoke-test.sh   # forwarded as X-Admin-Key where relevant
#
# Exits 0 if every check passes, 1 if anything fails. jq is used when present
# for nicer output but the script does not require it.

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_CRON_SECRET="${ADMIN_CRON_SECRET:-}"
QB_TEST_INVOICE_ID="${QB_TEST_INVOICE_ID:-}"

PASS=0
FAIL=0
FAILED_CHECKS=()

have_jq=0
if command -v jq >/dev/null 2>&1; then
    have_jq=1
fi

color_red()    { printf "\033[31m%s\033[0m" "$1"; }
color_green()  { printf "\033[32m%s\033[0m" "$1"; }
color_yellow() { printf "\033[33m%s\033[0m" "$1"; }

print_pass() {
    printf "  [%s] %s\n" "$(color_green PASS)" "$1"
    PASS=$((PASS + 1))
}

print_fail() {
    printf "  [%s] %s\n" "$(color_red FAIL)" "$1"
    if [ $# -gt 1 ]; then
        printf "        %s\n" "$2"
    fi
    FAIL=$((FAIL + 1))
    FAILED_CHECKS+=("$1")
}

print_warn() {
    printf "  [%s] %s\n" "$(color_yellow WARN)" "$1"
}

print_section() {
    printf "\n== %s ==\n" "$1"
}

# Hit a URL and capture both HTTP status and body. Sets globals
# RESP_STATUS, RESP_BODY. Returns 0 always (errors surface via status).
http_call() {
    local method="$1"
    local path="$2"
    local extra_header="${3:-}"

    local tmp
    tmp="$(mktemp -t qb-smoke.XXXXXX)"
    local args=(-sS -o "$tmp" -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
    if [ -n "$extra_header" ]; then
        args+=(-H "$extra_header")
    fi

    RESP_STATUS="$(curl "${args[@]}" 2>/dev/null || echo "000")"
    RESP_BODY="$(cat "$tmp" 2>/dev/null || true)"
    rm -f "$tmp"
}

check_status_endpoint() {
    local label="$1"
    local method="$2"
    local path="$3"
    local extra_header="${4:-}"

    http_call "$method" "$path" "$extra_header"
    if [ "$RESP_STATUS" = "200" ]; then
        if [ "$have_jq" = "1" ] && [ -n "$RESP_BODY" ]; then
            local summary
            summary="$(printf '%s' "$RESP_BODY" | jq -c 'if type == "object" then with_entries(select(.key|test("connected|environment|companyName|connection|pending|count|ok|stats"))) else . end' 2>/dev/null || true)"
            if [ -n "$summary" ] && [ "$summary" != "{}" ]; then
                print_pass "$label  ($summary)"
                return 0
            fi
        fi
        print_pass "$label"
        return 0
    fi

    local snippet
    snippet="$(printf '%s' "$RESP_BODY" | head -c 200)"
    print_fail "$label" "HTTP $RESP_STATUS  body: ${snippet:-<empty>}"
    return 1
}

print_section "QuickBooks smoke test"
printf "  Base URL: %s\n" "$BASE_URL"
if [ "$have_jq" = "0" ]; then
    print_warn "jq not installed — output will be terser"
fi

print_section "1. Connection status"
check_status_endpoint "GET /api/quickbooks/status" GET "/api/quickbooks/status" || true

print_section "2. Auto-sync pending counts"
check_status_endpoint "GET /api/quickbooks/auto-sync/status" GET "/api/quickbooks/auto-sync/status" || true

print_section "3. Webhook events listing"
http_call GET "/api/quickbooks/webhook/events"
if [ "$RESP_STATUS" = "200" ]; then
    if [ "$have_jq" = "1" ]; then
        count="$(printf '%s' "$RESP_BODY" | jq -r '(.events // []) | length' 2>/dev/null || echo "?")"
        print_pass "GET /api/quickbooks/webhook/events  ($count events returned)"
    else
        print_pass "GET /api/quickbooks/webhook/events"
    fi
else
    snippet="$(printf '%s' "$RESP_BODY" | head -c 200)"
    print_fail "GET /api/quickbooks/webhook/events" "HTTP $RESP_STATUS  body: ${snippet:-<empty>}"
fi

print_section "4. Cached default refs"
http_call GET "/api/quickbooks/refs"
if [ "$RESP_STATUS" = "200" ]; then
    if [ "$have_jq" = "1" ]; then
        d="$(printf '%s' "$RESP_BODY" | jq -c '.defaults' 2>/dev/null || echo "?")"
        print_pass "GET /api/quickbooks/refs  (defaults=$d)"
    else
        print_pass "GET /api/quickbooks/refs"
    fi
else
    snippet="$(printf '%s' "$RESP_BODY" | head -c 200)"
    print_fail "GET /api/quickbooks/refs" "HTTP $RESP_STATUS  body: ${snippet:-<empty>}"
fi

print_section "5. Optional invoice push"
if [ -n "$QB_TEST_INVOICE_ID" ]; then
    path="/api/quickbooks/invoices/${QB_TEST_INVOICE_ID}/sync"
    http_call POST "$path"
    if [ "$RESP_STATUS" = "200" ]; then
        if [ "$have_jq" = "1" ]; then
            qb_id="$(printf '%s' "$RESP_BODY" | jq -r '.qbId // empty' 2>/dev/null || true)"
            total="$(printf '%s' "$RESP_BODY" | jq -r '.total // empty' 2>/dev/null || true)"
            print_pass "POST $path  (qbId=${qb_id:-?}, total=${total:-?})"
        else
            print_pass "POST $path"
        fi
    else
        snippet="$(printf '%s' "$RESP_BODY" | head -c 300)"
        print_fail "POST $path" "HTTP $RESP_STATUS  body: ${snippet:-<empty>}"
    fi
else
    print_warn "QB_TEST_INVOICE_ID not set — skipping invoice push test"
fi

print_section "Summary"
printf "  Passed: %s\n" "$(color_green "$PASS")"
if [ "$FAIL" -gt 0 ]; then
    printf "  Failed: %s\n" "$(color_red "$FAIL")"
    for c in "${FAILED_CHECKS[@]}"; do
        printf "    - %s\n" "$c"
    done
    printf "\nResult: %s\n" "$(color_red FAIL)"
    exit 1
fi

printf "  Failed: 0\n"
printf "\nResult: %s\n" "$(color_green PASS)"
exit 0

