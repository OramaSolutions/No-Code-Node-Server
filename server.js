const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const app = express();
const https = require('https');
const fs = require('fs');
const db = require("./db");
const { spawn } = require('child_process');
const cookieParser = require('cookie-parser');
const path = require('path');

require("./cronTab");
// const { Server } = require("socket.io");

var adminRouter = require('./routes/adminRoutes');
var staticRouter = require('./routes/staticRoutes.js');
var userRouter = require('./routes/userRoutes');
var statsRouter = require('./routes/statsRoutes');
var projectSyncRoutes = require('./routes/projectRoutes');

const PROJECTS_DIR = '/root/image_labeler/image-labeling/PROJECTS';
// const PROJECTS_DIR = ''
const cors = require('cors');
const bodyParser = require('body-parser')
const morgan = require('morgan');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'))
app.set('trust proxy', false); //false for http true for https

//mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
// mongoose.set('useCreateIndex', true);
// mongoose.set('useUnifiedTopology', true);

// const cors = require('cors');

// app.use(cors({
//   origin: true,           // Reflect request origin (allows all)
//   credentials: true       // Allow cookies/auth headers
// }));

app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.FRONTEND_TEMP_URL, process.env.ADMIN_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
}));


//==========================Request Console=======================//

app.all("*", (req, resp, next) => {

  let obj = {
    Host: req.headers.host,
    ContentType: req.headers['content-type'],
    Url: req.originalUrl,
    Method: req.method,
    Query: req.query,
    Body: req.body,
    Parmas: req.params[0]
  }
  // console.log("Common Request is===========>", [obj])
  next();
});



app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/user', userRouter);
app.use("/api/v1/projects", projectSyncRoutes);


// this download route for labeler 
app.post('/download_dataset/:projectName', async (req, res) => {
  const { projectName } = req.params;
  const type = req.query.type || req.body.type;
  const projectDir = path.join(PROJECTS_DIR, projectName);
  const labelsDir = path.join(projectDir, 'labels');
  const imagesDir = path.join(projectDir, 'images');
  const classesPath = path.join(projectDir, 'classes.txt');
  console.log("Project Directory:", projectDir);
  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
  const filesToInclude = [];

  if (type === 'ocr') {
    // OCR logic: only labels/labels.txt and images listed in it
    const ocrLabelsPath = path.join(labelsDir, 'labels.txt');
    if (!fs.existsSync(ocrLabelsPath)) {
      return res.status(400).json({ error: 'labels.txt not found for OCR project' });
    }
    filesToInclude.push(path.join('labels', 'labels.txt'));
    const lines = fs.readFileSync(ocrLabelsPath, 'utf-8').split('\n').filter(Boolean);
    const imageNames = new Set();
    for (const line of lines) {
      console.log("Processing line:", line);
      const [imgNameRaw] = line.split('\t');
      console.log("imgnameraw:", imgNameRaw);
      if (imgNameRaw) {

        // Remove leading 'images/' if present
        let imgName = imgNameRaw.trim();
        if (imgName.startsWith('images/')) {
          imgName = imgName.slice(7);
        }
        imageNames.add(imgName);
      }
    }
    for (const imgName of imageNames) {
      const imgPath = path.join(imagesDir, imgName);
      if (fs.existsSync(imgPath)) {
        filesToInclude.push(path.join('images', imgName));
      }
    }
    if (filesToInclude.length <= 1) {
      return res.status(400).json({ error: 'No valid OCR image-label pairs found' });
    }
  } else {

    if (fs.existsSync(classesPath)) filesToInclude.push('classes.txt');
    const labelFiles = fs.readdirSync(labelsDir);
    for (const label of labelFiles) {
      if (!label.endsWith('.txt')) continue;
      const base = path.basename(label, '.txt');
      for (const ext of imageExts) {
        const imgPath = path.join(imagesDir, base + ext);
        if (fs.existsSync(imgPath)) {
          filesToInclude.push(path.join('labels', label));
          filesToInclude.push(path.join('images', base + ext));
          break;
        }
      }
    }
    if (!filesToInclude.length) {
      return res.status(400).json({ error: 'No valid image-label pairs found' });
    }
  }

  res.setHeader('Content-Disposition', `attachment; filename="${projectName}.tar.gz"`);
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  const tar = spawn('tar', ['czf', '-', ...filesToInclude], { cwd: projectDir });

  tar.stdout.pipe(res);
  tar.stderr.on('data', (data) => {
    console.error(`tar stderr: ${data}`);
  });

  tar.on('error', (err) => {
    console.error(`tar error: ${err}`);
    res.status(500).end();
  });

  tar.on('close', (code) => {
    if (code !== 0) {
      console.error(`tar exited with code ${code}`);
    }
  });
});


const port = 3100;
var server = app.listen(port, () => {
  console.log(`You pick up listening on port ${port}`);
})