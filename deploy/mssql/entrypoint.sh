#!/bin/bash
set -e

/opt/mssql/bin/sqlservr &

for i in $(seq 1 60); do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server is ready"
        break
    fi
    echo "Waiting for SQL Server... attempt $i"
    sleep 2
done

/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -i /init.sql
echo "Database initialization complete"

wait
