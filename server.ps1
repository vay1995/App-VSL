# Secure Lightweight PowerShell HTTP Server for Khmer Math Web App
$port = 8080
$prefix = "http://localhost:$port/"
$workspacePath = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

# Helper function to get configured Owner Gmail from environment variable or server config
function Get-ConfiguredOwnerGmail {
    # 1. Highest priority: Environment Variable $env:APP_OWNER_GMAIL
    if ($env:APP_OWNER_GMAIL -and $env:APP_OWNER_GMAIL.Trim() -ne "") {
        return @{ "email" = $env:APP_OWNER_GMAIL.Trim().ToLower(); "source" = "environment_variable" }
    }

    # 2. Server-side config file: server_config.json
    $cfgPath = Join-Path $workspacePath "server_config.json"
    if (Test-Path $cfgPath) {
        try {
            $raw = Get-Content $cfgPath -Raw -Encoding UTF8
            $json = $raw | ConvertFrom-Json
            if ($json.owner_email -and $json.owner_email.Trim() -ne "") {
                return @{ "email" = $json.owner_email.Trim().ToLower(); "source" = "server_config_file" }
            }
        } catch {}
    }

    # 3. Check local .env file if present
    $envPath = Join-Path $workspacePath ".env"
    if (Test-Path $envPath) {
        try {
            $lines = Get-Content $envPath
            foreach ($line in $lines) {
                if ($line -match '^\s*APP_OWNER_GMAIL\s*=\s*(.+)$') {
                    $val = $matches[1].Trim().Trim('"').Trim("'").ToLower()
                    if ($val -ne "") {
                        return @{ "email" = $val; "source" = "env_file" }
                    }
                }
            }
        } catch {}
    }

    return @{ "email" = ""; "source" = "none" }
}

try {
    $listener.Start()
    $ownerInfo = Get-ConfiguredOwnerGmail
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " Khmer Math Learning & Assessment System Server" -ForegroundColor Green
    Write-Host " Running at: $prefix" -ForegroundColor White
    if ($ownerInfo.email -ne "") {
        Write-Host " Permanent Owner: $($ownerInfo.email) (Source: $($ownerInfo.source))" -ForegroundColor Yellow
    } else {
        Write-Host " Owner Email: Not configured yet (Ready for configuration)" -ForegroundColor Gray
    }
    Write-Host " Press Ctrl+C to stop the server." -ForegroundColor DarkGray
    Write-Host "==========================================================" -ForegroundColor Cyan

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            # CORS Headers
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }

        $urlPath = $request.Url.LocalPath.TrimStart('/')

        # -------------------------------------------------------------
        # API ROUTE: /api/owner-config
        # -------------------------------------------------------------
        if ($urlPath -eq "api/owner-config") {
            $response.ContentType = "application/json; charset=utf-8"

            if ($request.HttpMethod -eq "GET") {
                $owner = Get-ConfiguredOwnerGmail
                $resData = @{
                    "configured" = ($owner.email -ne "");
                    "ownerEmail" = $owner.email;
                    "source"     = $owner.source;
                    "timestamp"  = (Get-Date).ToString("o")
                }
                $jsonStr = $resData | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
                $response.StatusCode = 200
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "POST") {
                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $payload = $body | ConvertFrom-Json
                    $newEmail = ($payload.ownerEmail).Trim().ToLower()

                    if ($newEmail -match "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$") {
                        # Save to server_config.json
                        $cfgPath = Join-Path $workspacePath "server_config.json"
                        $cfgObj = @{
                            "owner_email"  = $newEmail;
                            "description"  = "Server-side configuration for Khmer Math Learning System";
                            "updated_at"   = (Get-Date).ToString("o")
                        }
                        $cfgObj | ConvertTo-Json | Set-Content $cfgPath -Encoding UTF8

                        Write-Host " [Security] Configured Permanent Owner: $newEmail" -ForegroundColor Yellow

                        $resData = @{
                            "success"    = $true;
                            "message"    = "Permanent owner email set successfully";
                            "ownerEmail" = $newEmail;
                            "source"     = "server_config_file"
                        }
                        $jsonStr = $resData | ConvertTo-Json
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
                        $response.StatusCode = 200
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } else {
                        $errData = @{ "error" = "Invalid email format" }
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                        $response.StatusCode = 400
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    }
                } catch {
                    $errData = @{ "error" = $_.Exception.Message }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                    $response.StatusCode = 500
                    $response.ContentLength64 = $buffer.Length
                }
                $response.Close()
                continue
            }
        }

        # -------------------------------------------------------------
        # API ROUTE: /api/db/sync (Multi-device centralized DB sync)
        # -------------------------------------------------------------
        if ($urlPath -eq "api/db/sync") {
            $response.ContentType = "application/json; charset=utf-8"
            $dbPath = Join-Path $workspacePath "server_db.json"

            if ($request.HttpMethod -eq "GET") {
                if (Test-Path $dbPath) {
                    try {
                        $raw = Get-Content $dbPath -Raw -Encoding UTF8
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes($raw)
                        $response.StatusCode = 200
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    } catch {
                        $errData = @{ "error" = "Failed to read database: " + $_.Exception.Message }
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                        $response.StatusCode = 500
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    }
                } else {
                    $resData = @{ "initialized" = $false; "message" = "Server database ready for first sync" }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($resData | ConvertTo-Json))
                    $response.StatusCode = 200
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "POST") {
                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $payload = $body | ConvertFrom-Json

                    # Save central database state safely
                    $body | Set-Content $dbPath -Encoding UTF8

                    $resData = @{
                        "success"   = $true;
                        "message"   = "Central database synced successfully";
                        "timestamp" = (Get-Date).ToString("o")
                    }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($resData | ConvertTo-Json))
                    $response.StatusCode = 200
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                } catch {
                    $errData = @{ "error" = $_.Exception.Message }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                    $response.StatusCode = 500
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                $response.Close()
                continue
            }
        }

        # -------------------------------------------------------------
        # API ROUTE: /api/upload (Secure File & Image Storage)
        # -------------------------------------------------------------
        if ($urlPath -eq "api/upload") {
            $response.ContentType = "application/json; charset=utf-8"

            if ($request.HttpMethod -eq "POST") {
                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $payload = $body | ConvertFrom-Json

                    if (-not $payload.fileName -or -not $payload.fileData) {
                        $errData = @{ "error" = "Missing fileName or fileData payload" }
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                        $response.StatusCode = 400
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                        $response.Close()
                        continue
                    }

                    # Validate extension
                    $rawExt = [System.IO.Path]::GetExtension($payload.fileName).ToLower()
                    $allowedExts = @(".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp")
                    if (-not ($allowedExts -contains $rawExt)) {
                        $errData = @{ "error" = "File extension $rawExt is not allowed. Allowed extensions: " + ($allowedExts -join ', ') }
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                        $response.StatusCode = 400
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                        $response.Close()
                        continue
                    }

                    # Sanitize base64 (strip data url header if present)
                    $base64 = $payload.fileData
                    if ($base64 -match '^data:[^;]+;base64,(.+)$') {
                        $base64 = $matches[1]
                    }

                    $fileBytes = [System.Convert]::FromBase64String($base64)
                    # Limit size to 15MB
                    if ($fileBytes.Length -gt (15 * 1024 * 1024)) {
                        $errData = @{ "error" = "File size exceeds 15MB limit" }
                        $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                        $response.StatusCode = 400
                        $response.ContentLength64 = $buffer.Length
                        $response.OutputStream.Write($buffer, 0, $buffer.Length)
                        $response.Close()
                        continue
                    }

                    $uploadsDir = Join-Path $workspacePath "uploads"
                    if (-not (Test-Path $uploadsDir)) {
                        New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
                    }

                    $cleanBase = [System.IO.Path]::GetFileNameWithoutExtension($payload.fileName) -replace '[^a-zA-Z0-9_-]', '_'
                    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    $storedFileName = "${timestamp}_${cleanBase}${rawExt}"
                    $savedPath = Join-Path $uploadsDir $storedFileName

                    [System.IO.File]::WriteAllBytes($savedPath, $fileBytes)
                    Write-Host " [Upload] Successfully saved: $storedFileName ($($fileBytes.Length) bytes)" -ForegroundColor Cyan

                    $resData = @{
                        "success"     = $true;
                        "url"         = "/uploads/$storedFileName";
                        "fileName"    = $payload.fileName;
                        "storedName"  = $storedFileName;
                        "sizeBytes"   = $fileBytes.Length;
                        "mimeType"    = $payload.mimeType;
                        "timestamp"   = (Get-Date).ToString("o")
                    }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($resData | ConvertTo-Json))
                    $response.StatusCode = 200
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                } catch {
                    $errData = @{ "error" = "Upload failed: " + $_.Exception.Message }
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes(($errData | ConvertTo-Json))
                    $response.StatusCode = 500
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
                $response.Close()
                continue
            }
        }

        # -------------------------------------------------------------
        # STATIC FILES
        # -------------------------------------------------------------
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq "/") {
            $urlPath = "index.html"
        }

        $localFilePath = Join-Path $workspacePath $urlPath

        # Security: Prevent directory traversal
        $fullPath = [System.IO.Path]::GetFullPath($localFilePath)
        if (-not $fullPath.StartsWith($workspacePath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        # Security: Block sensitive server files (.env*, server_config.json, server_db.json, *.ps1, hidden files)
        $fileName = [System.IO.Path]::GetFileName($fullPath).ToLower()
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        if ($fileName -eq "server_config.json" -or 
            $fileName -eq "server_db.json" -or 
            $fileName.StartsWith(".env") -or 
            $ext -eq ".ps1" -or 
            ($fileName.StartsWith(".") -and $fileName -ne ".html")) {
            $response.StatusCode = 403
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden: Access to server configuration is strictly protected")
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            $response.Close()
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)

            $contentType = switch ($ext) {
                ".html"        { "text/html; charset=utf-8" }
                ".htm"         { "text/html; charset=utf-8" }
                ".css"         { "text/css; charset=utf-8" }
                ".js"          { "application/javascript; charset=utf-8" }
                ".json"        { "application/json; charset=utf-8" }
                ".webmanifest" { "application/manifest+json; charset=utf-8" }
                ".png"         { "image/png" }
                ".jpg"         { "image/jpeg" }
                ".jpeg"        { "image/jpeg" }
                ".webp"        { "image/webp" }
                ".svg"         { "image/svg+xml" }
                ".pdf"         { "application/pdf" }
                ".docx"        { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
                ".mp4"         { "video/mp4" }
                default        { "application/octet-stream" }
            }

            if ($fileName -eq "sw.js") {
                $response.AddHeader("Service-Worker-Allowed", "/")
                $response.AddHeader("Cache-Control", "no-cache")
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        $response.Close()
        } catch {
            try { $response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
