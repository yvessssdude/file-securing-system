const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,        // required for Azure MS SQL
    trustServerCertificate: true  // for local dev
  }
};

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const { originalname, size, mimetype, path } = req.file;
  const { fileName, isPublic } = req.body;

  const pool = await sql.connect(config);
  await pool.request()
    .input('name', sql.NVarChar, fileName || originalname)
    .input('size', sql.Int, size)
    .input('type', sql.NVarChar, mimetype)
    .input('path', sql.NVarChar, path)
    .input('isPublic', sql.Bit, isPublic === 'true' ? 1 : 0)
    .query(`INSERT INTO files (name, size, type, path, is_public) 
            VALUES (@name, @size, @type, @path, @isPublic)`);

  res.json({ success: true });
});
