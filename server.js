const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

app.post('/api/comments', upload.single('photo'), (req, res) => {
  const { comment, lat, lng } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  console.log(`Comment: ${comment}, Lat: ${lat}, Lng: ${lng}, Photo: ${photo}`);

  res.json({ comment, lat, lng, photo });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
