#!/bin/bash
set -e

/opt/mssql/bin/sqlservr &

SA_PASS="${MSSQL_SA_PASSWORD}"

for i in $(seq 1 60); do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASS" -C -d master -i /init.sql > /dev/null 2>&1; then
        echo "SQL Server is ready and database initialized"
        break
    fi
    echo "Waiting for SQL Server... attempt $i"
    sleep 2
done

wait
