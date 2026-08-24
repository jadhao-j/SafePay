<#
.SYNOPSIS
    SafePay Table VI — Payment Latency Benchmark
    Measures ML /score endpoint and full P2P payment pipeline separately.

.DESCRIPTION
    Runs 10 timed requests against each endpoint and computes:
      - Mean latency
      - P95 latency
      - P99 / Max latency
      - "Payment excl. fraud" = Complete pipeline mean - ML mean

.USAGE
    # 1. Snapshot DB before benchmarking (reproducible starting state):
    #    docker compose exec postgres pg_dump -U postgres safepay > safepay_backup.sql

    # 2. Run this script:
    #    .\scripts\benchmark_latency.ps1

    # 3. After benchmarking, restore clean state:
    #    docker compose exec -T postgres psql -U postgres safepay < safepay_backup.sql

.PARAMETER Token
    Bearer JWT token from POST /api/v1/auth/login.
    If omitted, the script will prompt you.

.PARAMETER Iterations
    Number of timed requests per endpoint. Default: 10.

.PARAMETER BackendUrl
    Backend base URL. Default: http://localhost:8000

.PARAMETER MlUrl
    ML service base URL. Default: http://localhost:8001

.PARAMETER ReceiverPhone
    Phone number of the receiver for P2P transfers. Default: 9876543210
#>

param(
    [string]          = "",
    [int]        = 10,
    [string]     = "http://localhost:8000",
    [string]          = "http://localhost:8001",
    [string]  = "9876543210"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Prompt for token if not supplied ─────────────────────────────────────────
if (-not $Token) {
    Write-Host ""
    Write-Host "SafePay Latency Benchmark — Table VI" -ForegroundColor Cyan
    Write-Host "--------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You need a valid Bearer token. Get one with:" -ForegroundColor Yellow
    Write-Host "  curl.exe -s -X POST $BackendUrl/api/v1/auth/login `" -ForegroundColor Gray
    Write-Host "    -H 'Content-Type: application/json' `" -ForegroundColor Gray
    Write-Host "    -d '{"phone":"YOUR_PHONE","password":"YOUR_PASS"}'" -ForegroundColor Gray
    Write-Host ""
    $Token = Read-Host "Paste your Bearer token (without 'Bearer ' prefix)"
    if (-not $Token) { Write-Host "[ERROR] Token required." -ForegroundColor Red; exit 1 }
}

# ── Helper: percentile ────────────────────────────────────────────────────────
function Get-Percentile {
    param([double[]] $Sorted, [double] $Pct)
    $idx = [math]::Ceiling($Pct / 100.0 * $Sorted.Count) - 1
    $idx = [math]::Max(0, [math]::Min($idx, $Sorted.Count - 1))
    return $Sorted[$idx]
}

# ── Helper: run timed requests ────────────────────────────────────────────────
function Measure-Endpoint {
    param(
        [string]   $Label,
        [string]   $Url,
        [string]   $Method   = "POST",
        [hashtable]$Headers  = @{},
        [string]   $Body     = "",
        [int]      $N        = $Iterations
    )

    Write-Host ""
    Write-Host "── $Label ──" -ForegroundColor Cyan
    Write-Host "   URL : $Url"
    Write-Host "   Runs: $N"
    Write-Host ""

    $times = @()
    for ($i = 1; $i -le $N; $i++) {
        $start = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $resp = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers `
                        -Body $Body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
            $start.Stop()
            $ms = [math]::Round($start.Elapsed.TotalMilliseconds, 2)
            $times += $ms
            Write-Host ("  [{0,2}/{1}]  {2,8} ms  HTTP {3}" -f $i, $N, $ms, $resp.StatusCode)
        }
        catch {
            $start.Stop()
            $ms = [math]::Round($start.Elapsed.TotalMilliseconds, 2)
            $times += $ms
            Write-Host ("  [{0,2}/{1}]  {2,8} ms  [ERROR: {3}]" -f $i, $N, $ms, $_.Exception.Message.Substring(0,[math]::Min(60,$_.Exception.Message.Length))) -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 200   # small cooldown to avoid rate limits
    }

    $sorted = $times | Sort-Object
    $mean   = [math]::Round(($times | Measure-Object -Average).Average, 2)
    $p95    = Get-Percentile $sorted 95
    $p99    = Get-Percentile $sorted 99
    $minMs  = $sorted[0]
    $maxMs  = $sorted[-1]

    Write-Host ""
    Write-Host ("  Mean : {0,8} ms" -f $mean)
    Write-Host ("  P95  : {0,8} ms" -f $p95)
    Write-Host ("  P99  : {0,8} ms" -f $p99)
    Write-Host ("  Min  : {0,8} ms" -f $minMs)
    Write-Host ("  Max  : {0,8} ms" -f $maxMs)

    return @{ Label=$Label; Mean=$mean; P95=$p95; P99=$p99; Min=$minMs; Max=$maxMs; Raw=$times }
}

# ── 1. ML /score endpoint (direct, no auth needed) ───────────────────────────
$mlBody = @{
    transaction_amt = 500.00
    product_cd      = "W"
    card1           = 9876
    card2           = 111
    card3           = 150
    card5           = 226
    addr1           = 315
    addr2           = 87
    dist1           = 0
    p_emaildomain   = "gmail.com"
    r_emaildomain   = "gmail.com"
} | ConvertTo-Json

$mlResult = Measure-Endpoint `
    -Label "ML /score (direct to ml-service:8001)" `
    -Url  "$MlUrl/score" `
    -Body $mlBody

# ── 2. Full P2P payment pipeline ─────────────────────────────────────────────
$authHeaders = @{
    "Authorization" = "Bearer $Token"
    "X-Device-ID"   = "bench-device-001"
}

$pipelineResults = @()
for ($i = 1; $i -le $Iterations; $i++) {
    $key  = "bench-$i-$(Get-Random -Maximum 9999999)"
    $body = @{
        receiver_phone  = $ReceiverPhone
        amount          = 10.00
        currency        = "INR"
        note            = "bench"
        idempotency_key = $key
    } | ConvertTo-Json
    $pipelineResults += ,$body
}

# Run the pipeline measurements
Write-Host ""
Write-Host "── Full P2P Payment Pipeline (backend:8000) ──" -ForegroundColor Cyan
Write-Host "   URL : $BackendUrl/api/v1/payments/p2p/transfer"
Write-Host "   Runs: $Iterations"
Write-Host ""

$pipelineTimes = @()
for ($i = 1; $i -le $Iterations; $i++) {
    $key  = "bench-final-$i-$(Get-Random -Maximum 9999999)"
    $body = @{
        receiver_phone  = $ReceiverPhone
        amount          = 10.00
        currency        = "INR"
        note            = "bench"
        idempotency_key = $key
    } | ConvertTo-Json

    $start = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-WebRequest -Uri "$BackendUrl/api/v1/payments/p2p/transfer" `
                    -Method POST -Headers $authHeaders -Body $body `
                    -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        $start.Stop()
        $ms = [math]::Round($start.Elapsed.TotalMilliseconds, 2)
        $pipelineTimes += $ms
        Write-Host ("  [{0,2}/{1}]  {2,8} ms  HTTP {3}" -f $i, $Iterations, $ms, $resp.StatusCode)
    }
    catch {
        $start.Stop()
        $ms = [math]::Round($start.Elapsed.TotalMilliseconds, 2)
        $pipelineTimes += $ms
        Write-Host ("  [{0,2}/{1}]  {2,8} ms  [ERROR: {3}]" -f $i, $Iterations, $ms, $_.Exception.Message.Substring(0,[math]::Min(80,$_.Exception.Message.Length))) -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 300
}

$pSorted = $pipelineTimes | Sort-Object
$pMean   = [math]::Round(($pipelineTimes | Measure-Object -Average).Average, 2)
$pP95    = Get-Percentile $pSorted 95
$pP99    = Get-Percentile $pSorted 99

Write-Host ""
Write-Host ("  Mean : {0,8} ms" -f $pMean)
Write-Host ("  P95  : {0,8} ms" -f $pP95)
Write-Host ("  P99  : {0,8} ms" -f $pP99)
Write-Host ("  Min  : {0,8} ms" -f $pSorted[0])
Write-Host ("  Max  : {0,8} ms" -f $pSorted[-1])

# ── 3. Derived: Payment excl. fraud ──────────────────────────────────────────
$paymentExclFraud = [math]::Round($pMean - $mlResult.Mean, 2)

# ── 4. Summary Table VI ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  TABLE VI — Payment Latency Benchmark Results" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host ("  {0,-35} {1,10} {2,10} {3,10}" -f "Operation", "Mean (ms)", "P95 (ms)", "P99 (ms)")
Write-Host ("  {0,-35} {1,10} {2,10} {3,10}" -f "---------", "---------", "--------", "--------")
Write-Host ("  {0,-35} {1,10} {2,10} {3,10}" -f "ML fraud scoring (/score)", $mlResult.Mean, $mlResult.P95, $mlResult.P99)
Write-Host ("  {0,-35} {1,10} {2,10} {3,10}" -f "Payment excl. fraud (derived)", $paymentExclFraud, "—", "—")
Write-Host ("  {0,-35} {1,10} {2,10} {3,10}" -f "Complete pipeline (P2P)", $pMean, $pP95, $pP99)
Write-Host ""
Write-Host "  Note: 'Payment excl. fraud' = Complete pipeline mean - ML mean"
Write-Host "        = $pMean - $($mlResult.Mean) = $paymentExclFraud ms"
Write-Host ""
Write-Host "  Iterations per endpoint : $Iterations"
Write-Host "  ML service URL          : $MlUrl"
Write-Host "  Backend URL             : $BackendUrl"
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "REMINDER: Restore DB to clean state after benchmarking:" -ForegroundColor Yellow
Write-Host "  docker compose exec -T postgres psql -U postgres safepay < safepay_backup.sql" -ForegroundColor Gray
Write-Host ""
