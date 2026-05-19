import express from "express";
import sql from "mssql";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";


dotenv.config();

const app = express();

app.use(cors({
    origin:"http://localhost:5174"
}));

app.use(express.json());

if(!fs.existsSync("uploads")){
    fs.mkdirSync("uploads");
}

const storage =multer.diskStorage({
    destination:(req,file,cb) => cb(null, "uploads/"),
    filename:(req,file,cb)=>{
        const unique = Date.now()+"-"+ Math.round(Math.random()*1e9);
        cb(null, unique +path.extname(file.originalname));
    }
});
const upload = multer({storage});

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port:1433,
  options: {
    encrypt: false,       
    trustServerCertificate: true  
  }
};

let pool;

const connectDB = async () => {
    if(!pool){
        pool=await sql.connect(config);
        console.log("Connected to SQL Server");
    }

    return pool;
}

app.post('/api/upload', upload.single("file"), async (req, res) => {
    try{
        const { originalname, size, mimetype, path } = req.file;
        const { fileName, isPublic } = req.body;
        const filePath = `uploads/${fileName}`; 

    const pool = await connectDB();
    await pool.request()
      .input("name",     sql.NVarChar, fileName || originalname)
      .input("size",     sql.Int,      size)
      .input("type",     sql.NVarChar, mimetype)
      .input("path",     sql.NVarChar, filePath)
      .input("isPublic", sql.Bit,      isPublic === "true" ? 1 : 0)
      .query(`
        INSERT INTO files (name, size, type, path, is_public)
        VALUES (@name, @size, @type, @path, @isPublic)
      `);
 
    res.json({ success: true });
 
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
 
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});