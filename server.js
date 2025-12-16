const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive:true });

// Multer config
const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null, uploadDir),
  filename: (req,file,cb) => cb(null, Date.now()+'-'+file.originalname)
});
const upload = multer({ storage });

// Metadata file
const dataFile = path.join(__dirname, 'files.json');
if(!fs.existsSync(dataFile)) fs.writeFileSync(dataFile,'[]','utf-8');

// Upload endpoint
app.post('/upload', upload.single('file'), (req,res)=>{
  const category = req.body.category || 'others';
  const files = JSON.parse(fs.readFileSync(dataFile));
  files.push({
    name:req.file.originalname,
    path:'/uploads/'+req.file.filename,
    category
  });
  fs.writeFileSync(dataFile, JSON.stringify(files), 'utf-8');
  res.json({success:true});
});

// Delete endpoint
app.post('/delete', (req,res)=>{
  const { path: filePath } = req.body;
  let files = JSON.parse(fs.readFileSync(dataFile));
  files = files.filter(f => f.path !== filePath);
  fs.writeFileSync(dataFile, JSON.stringify(files), 'utf-8');

  // Remove actual file
  const fullPath = path.join(__dirname, 'public', filePath.replace('/',''));
  if(fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  res.json({success:true});
});

// Get files
app.get('/files', (req,res)=>{
  const files = JSON.parse(fs.readFileSync(dataFile));
  res.json(files);
});

app.listen(3000, ()=>console.log('Server running on http://localhost:3000'));
