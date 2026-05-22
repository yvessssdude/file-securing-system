IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SecureFileSharing')
BEGIN
    CREATE DATABASE SecureFileSharing;
END
GO
