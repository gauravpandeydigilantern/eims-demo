@echo off
echo Adding PostgreSQL to system PATH permanently...
setx PATH "%PATH%;C:\Program Files\PostgreSQL\17\bin"
echo PostgreSQL bin directory added to PATH.
echo Please restart your command prompt or IDE for changes to take effect.
pause