# ==============================================================================
# منصة دليلك - مشغل سيرفر واتساب الآلي (Baileys Gateway)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Dalelak - WhatsApp Local Gateway"

$projectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $projectRoot

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "            منصة دليلك - خادم واتساب الآلي المحلي (Baileys)          " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. تنظيف المنفذ 3001 إذا كان قيد الاستخدام من عملية قديمة
Write-Host " [1/3] فحص المنفذ 3001 وتحريره من أي عمليات سابقة..." -ForegroundColor Yellow
try {
    $connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 -and $_ -ne $PID }
        foreach ($procId in $pids) {
            try {
                $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($p) {
                    Write-Host "       إنهاء العملية السابقة (PID: $procId - $($p.ProcessName))..." -ForegroundColor DarkYellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
        Start-Sleep -Milliseconds 500
    }
    Write-Host "       [v] المنفذ 3001 جاهز وخالي تماما." -ForegroundColor Green
} catch {
    Write-Host "       [!] تخطي فحص المنفذ." -ForegroundColor DarkGray
}

# 2. التحقق من Node.js والحزم
Write-Host " [2/3] التحقق من بيئة التشغيل Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host " [خطأ]: Node.js غير مثبت على جهازك!" -ForegroundColor Red
    Write-Host " يرجى تحميل وتثبيت Node.js من https://nodejs.org ثم إعادة التشغيل." -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج..."
    exit 1
}
Write-Host "       [v] بيئة Node.js متوفرة: $nodeVersion" -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
    Write-Host "       [ملاحظة]: جاري تثبيت الحزم المطلوبة لأول مرة (npm install)..." -ForegroundColor Cyan
    npm install
}

# 3. إطلاق السيرفر
Write-Host " [3/3] تشغيل خادم المنصة وبوابة الواتساب..." -ForegroundColor Yellow
Write-Host ""
Write-Host " [v] السيرفر يعمل الآن على: http://localhost:3001" -ForegroundColor Green
Write-Host " [v] متوافق مع لوحة التحكم السحابية (Vercel) واللوكال مباشرة." -ForegroundColor Cyan
Write-Host " [!] لا تغلق هذه النافذة طالما ترغب باستخدام سيرفر الواتساب الآلي." -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# تشغيل npx tsx server.ts مباشرة
npx tsx server.ts