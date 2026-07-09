import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';
import multer from 'multer';

const app = express();
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API endpoint to create directory
app.post('/api/create-patient-folder', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'Path required' });

  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      // Create mandatory subfolders
      const subfolders = ['Contratos', 'Exames', 'Gerais', "Gto's", 'Radiografias'];
      subfolders.forEach(sub => {
        const subPath = path.join(folderPath, sub);
        if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
      });
      res.json({ success: true });
    } else {
      res.json({ success: true, message: 'Already exists' });
    }
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// API endpoint to upload file
app.post('/api/fs/upload', upload.single('file'), (req: any, res: any) => {
  const { path: targetPath } = req.body;
  console.log('Upload request:', { targetPath, file: req.file ? req.file.originalname : 'no file' });
  if (!targetPath || !req.file) return res.status(400).json({ error: 'Path and file required' });

  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      console.log('Creating directory:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(req.file.path, targetPath);
    fs.unlinkSync(req.file.path); // remove temp file
    res.json({ success: true });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/fs/delete', (req, res) => {
  const { path: targetPath } = req.body;
  console.log('Delete request:', { targetPath });
  if (!targetPath) return res.status(400).json({ error: 'Path required' });
  try {
    if (fs.existsSync(targetPath)) {
      console.log('Deleting path:', targetPath);
      fs.rmSync(targetPath, { recursive: true, force: true });
      res.json({ success: true });
    } else {
      console.log('Path not found:', targetPath);
      res.status(404).json({ error: 'Path not found' });
    }
  } catch (err) {
    console.error('Error deleting:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.post('/api/fs/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Paths required' });
  try {
    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
  } catch (err) {
    console.error('Error renaming:', err);
    res.status(500).json({ error: 'Failed to rename' });
  }
});

// Vite middleware (only in dev)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist', 'index.html')));
  }

  app.listen(3000, '0.0.0.0', () => console.log('Server running on 3000'));
}

startServer();
