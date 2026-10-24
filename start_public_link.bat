@echo off
title Khmer Math Learning & Assessment System (Public Online Server)
echo ========================================================
echo  Khmer Math Learning & Assessment System
echo  Starting Local Server & Public Cloudflare HTTPS Link...
echo ========================================================
start /b powershell -ExecutionPolicy Bypass -File server.ps1
start .\cloudflared.exe tunnel --url http://localhost:8080 --http-host-header localhost
