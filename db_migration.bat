@echo off
REM Add PostgreSQL to PATH temporarily
set PATH=C:\Program Files\PostgreSQL\17\bin;%PATH%

echo Step 1: Backing up local eims database...
pg_dump -h localhost -p 5432 -U postgres -d eims -f local_backup.dump
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to backup local database
    pause
    exit /b 1
)
echo Local backup completed: local_backup.dump

echo.
echo Step 2: Dumping Neon database...
pg_dump -h ep-little-bar-a58px00j.us-east-2.aws.neon.tech -p 5432 -U neondb_owner -d neondb -f neon_dump.dump
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to dump Neon database
    pause
    exit /b 1
)
echo Neon dump completed: neon_dump.dump

echo.
echo Step 3: Restoring Neon dump to local database...
echo Dropping and recreating local eims database...
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS eims;"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE eims;"

echo Restoring data...
pg_restore -h localhost -p 5432 -U postgres -d eims neon_dump.dump
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to restore Neon dump to local database
    pause
    exit /b 1
)
echo Restore completed successfully!

echo.
echo Step 4: Testing connectivity...
psql -h localhost -p 5432 -U postgres -d eims -c "\dt"
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to connect to restored database
    pause
    exit /b 1
)

echo.
echo Migration completed successfully!
echo - Local backup saved as: local_backup.dump
echo - Neon dump saved as: neon_dump.dump  
echo - Local eims database now contains Neon data
pause