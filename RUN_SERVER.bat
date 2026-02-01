@echo off
echo Starting Electronics Marketplace Server...
echo.
echo Opening Browser...
start http://localhost:8000
echo.
echo Server is running! Do not close this window.
python backend/simple_server.py
pause
