@echo off
cd /d "%~dp0"
echo Database jadvallari yaratilmoqda...
echo (Agar bazangizda eski loyihadan qolgan jadvallar bo'lsa, ular tozalanadi.)
call npx prisma migrate reset --force --skip-seed
echo.
echo TUGADI! Endi 3-seed.bat faylini oching.
pause
