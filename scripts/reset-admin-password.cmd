@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0reset-admin-password.ps1" %*
