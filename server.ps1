# 本地打开前锋刷题软件。浏览器窗口关闭后，本终端立即退出。
# 进度存在固定浏览器配置里（%APPDATA%\前锋刷题软件），端口固定，下次打开还在。
param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 17831
$dataRoot = Join-Path $env:APPDATA "前锋刷题软件"
$legacyRoot = Join-Path $env:APPDATA "刷题"
if ((Test-Path -LiteralPath $legacyRoot) -and -not (Test-Path -LiteralPath $dataRoot)) {
  Move-Item -LiteralPath $legacyRoot -Destination $dataRoot
}
$profile = Join-Path $dataRoot "profile"
$marker = "前锋刷题软件\profile"
$allowed = @{
  "index.html"     = "text/html; charset=utf-8"
  "app.js"         = "text/javascript; charset=utf-8"
  "styles.css"     = "text/css; charset=utf-8"
  "前锋刷题.ico"   = "image/x-icon"
  "刷题.ico"       = "image/x-icon"
}

try {
  Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
} catch {}

New-Item -ItemType Directory -Path $profile -Force | Out-Null

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$port/"

$script:lastSeen = Get-Date
$script:seenPage = $false
$script:browserSeen = $false
$script:startedAt = Get-Date
$script:lastProcCheck = Get-Date
$script:browserOpen = -not $NoBrowser

function Stop-Server {
  try { if ($listener.IsListening) { $listener.Stop() } } catch {}
  try { $listener.Abort() } catch {}
  try { $listener.Close() } catch {}
}

function Show-Error([string]$text) {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($text, "前锋刷题软件", "OK", "Warning")
  } catch {
    Write-Host $text
  }
}

function Get-QuizBrowser {
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and (
        $_.CommandLine.Contains($profile) -or
        $_.CommandLine.Contains($marker) -or
        $_.CommandLine.Contains("刷题\profile")
      )
    }
}

function Test-ProfileInUse {
  Test-Path -LiteralPath (Join-Path $profile "SingletonLock")
}

function Test-QuizWindowOpen {
  if (@(Get-QuizBrowser).Count -gt 0) { return $true }
  return Test-ProfileInUse
}

function Test-OurServer {
  try {
    $req = [System.Net.HttpWebRequest]::Create($prefix + "__alive")
    $req.Method = "POST"
    $req.Timeout = 1000
    $req.ContentLength = 0
    $resp = $req.GetResponse()
    $code = [int]$resp.StatusCode
    $resp.Close()
    return ($code -eq 204 -or $code -eq 200)
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      return ([int]$response.StatusCode -eq 204 -or [int]$response.StatusCode -eq 200)
    }
    return $false
  }
}

function Ensure-LaunchShortcut {
  $vbs = Join-Path $root "打开前锋刷题.vbs"
  if (-not (Test-Path -LiteralPath $vbs)) { $vbs = Join-Path $root "打开刷题.vbs" }
  $ico = Join-Path $root "前锋刷题.ico"
  if (-not (Test-Path -LiteralPath $ico)) { $ico = Join-Path $root "刷题.ico" }
  $lnkPath = Join-Path $root "前锋刷题.lnk"
  if (-not (Test-Path -LiteralPath $vbs)) { return }
  $wsh = New-Object -ComObject WScript.Shell
  $lnk = $wsh.CreateShortcut($lnkPath)
  $lnk.TargetPath = Join-Path $env:SystemRoot "System32\wscript.exe"
  $lnk.Arguments = "//nologo `"$vbs`""
  $lnk.WorkingDirectory = $root
  $lnk.WindowStyle = 7
  $lnk.Description = "前锋刷题软件"
  if (Test-Path -LiteralPath $ico) { $lnk.IconLocation = "$ico,0" }
  $lnk.Save()
}

function Open-QuizWindow([string]$url) {
  if (Test-QuizWindowOpen) { return $true }
  $browsers = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
  )
  foreach ($exe in $browsers) {
    if (Test-Path -LiteralPath $exe) {
      New-Item -ItemType Directory -Path $profile -Force | Out-Null
      Start-Process -FilePath $exe -ArgumentList @(
        "--app=$url",
        "--user-data-dir=$profile",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-features=Translate"
      ) | Out-Null
      return $true
    }
  }
  Start-Process $url | Out-Null
  return $false
}

function Write-Response($context, [int]$status, [byte[]]$body, [string]$contentType) {
  $context.Response.StatusCode = $status
  if ($contentType) { $context.Response.ContentType = $contentType }
  $context.Response.Headers["Cache-Control"] = "no-store"
  if ($body -and $body.Length -gt 0) {
    $context.Response.ContentLength64 = $body.Length
    $context.Response.OutputStream.Write($body, 0, $body.Length)
  }
  $context.Response.Close()
}

function Write-Json($context, [int]$status, [string]$text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($text)
  Write-Response $context $status $bytes "application/json; charset=utf-8"
}

function Read-Utf8Body($request) {
  $reader = New-Object System.IO.StreamReader($request.InputStream, [Text.Encoding]::UTF8)
  try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function Test-ChatUrl([string]$url) {
  try { $uri = [Uri]$url } catch { return "接口地址无效" }
  if (-not $uri.IsAbsoluteUri) { return "接口地址无效" }
  if ($uri.Scheme -ne "http" -and $uri.Scheme -ne "https") { return "接口必须是 http 或 https" }
  if ($uri.AbsolutePath -notmatch "/chat/completions/?$") { return "接口路径应指向 chat/completions" }
  return $null
}

function Invoke-ChatProxy($context) {
  if ($context.Request.HttpMethod -ne "POST") {
    Write-Json $context 405 '{"error":"只用 POST"}'
    return
  }
  try {
    $payload = Read-Utf8Body $context.Request | ConvertFrom-Json
  } catch {
    Write-Json $context 400 '{"error":"请求体不是 JSON"}'
    return
  }
  $url = [string]$payload.url
  $apiKey = [string]$payload.apiKey
  $rawBody = [string]$payload.body
  $bad = Test-ChatUrl $url
  if ($bad) {
    Write-Json $context 400 ("{0}" -f (@{ error = $bad } | ConvertTo-Json -Compress))
    return
  }
  if (-not $rawBody) {
    Write-Json $context 400 '{"error":"缺少请求内容"}'
    return
  }

  try {
    Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromSeconds(90)
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, $url)
    if ($apiKey) {
      $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $apiKey)
    }
    $request.Content = New-Object System.Net.Http.StringContent($rawBody, [Text.Encoding]::UTF8, "application/json")
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $text) { $text = "{}" }
    Write-Json $context ([int]$response.StatusCode) $text
  } catch {
    $message = $_.Exception.InnerException.Message
    if (-not $message) { $message = $_.Exception.Message }
    if (-not $message) { $message = "上游接口请求失败" }
    Write-Json $context 502 ((@{ error = $message } | ConvertTo-Json -Compress))
  }
}

function Should-Quit {
  $now = Get-Date
  if ($NoBrowser) {
    $idle = $now - $script:lastSeen
    $limit = if ($script:seenPage) { 3 } else { 25 }
    return $idle.TotalSeconds -gt $limit
  }

  if (($now - $script:lastProcCheck).TotalMilliseconds -ge 400) {
    $script:lastProcCheck = $now
    if (Test-QuizWindowOpen) {
      $script:browserSeen = $true
      $script:browserOpen = $true
    } elseif ($script:browserSeen) {
      $script:browserOpen = $false
    } elseif (($now - $script:startedAt).TotalSeconds -gt 8) {
      $script:browserOpen = $false
    }
  }

  if ($script:browserSeen -and -not $script:browserOpen) { return $true }

  $idle = $now - $script:lastSeen
  if ($script:seenPage -and $idle.TotalSeconds -gt 4 -and -not $script:browserOpen) { return $true }
  if (-not $script:browserSeen -and ($now - $script:startedAt).TotalSeconds -gt 25) { return $true }
  return $false
}

Ensure-LaunchShortcut

$listener.Prefixes.Add($prefix)
$started = $false
try {
  $listener.Start()
  $started = $true
} catch {
  $started = $false
}

if (-not $started) {
  Stop-Server
  if (Test-OurServer) {
    if (-not $NoBrowser) { Open-QuizWindow $prefix | Out-Null }
    exit 0
  }
  Show-Error "端口 $port 已被其他程序占用。关掉占用该端口的程序后，再双击打开前锋刷题软件。"
  exit 1
}

Write-Host "前锋刷题软件已启动：$prefix"
Write-Host "进度保存在 $dataRoot"
Write-Host "关闭窗口后会自动结束。"

if (-not $NoBrowser) { Open-QuizWindow $prefix | Out-Null }

try {
  while ($listener.IsListening) {
    $pending = $listener.GetContextAsync()
    while (-not $pending.IsCompleted) {
      if (Should-Quit) {
        Write-Host "浏览器窗口已关闭，终端退出。"
        return
      }
      Start-Sleep -Milliseconds 200
    }

    try {
      $context = $pending.Result
    } catch {
      break
    }

    $rawPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
    if ($rawPath -eq "/__alive") {
      $script:lastSeen = Get-Date
      $script:seenPage = $true
      Write-Response $context 204 $null $null
      continue
    }

    if ($rawPath -eq "/api/complete") {
      $script:lastSeen = Get-Date
      $script:seenPage = $true
      Invoke-ChatProxy $context
      continue
    }

    $name = if ($rawPath -eq "/") { "index.html" } else { $rawPath.TrimStart("/") -replace "/", "\" }
    $leaf = Split-Path -Leaf $name
    $file = Join-Path $root $leaf
    if ($name -ne $leaf -or -not $allowed.ContainsKey($leaf) -or -not (Test-Path -LiteralPath $file)) {
      $missing = [Text.Encoding]::UTF8.GetBytes("not found")
      Write-Response $context 404 $missing "text/plain; charset=utf-8"
      continue
    }

    $script:lastSeen = Get-Date
    $bytes = [System.IO.File]::ReadAllBytes($file)
    Write-Response $context 200 $bytes $allowed[$leaf]
  }
}
finally {
  Stop-Server
}

exit 0
