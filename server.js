const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/';
const mongoClient = new MongoClient(url);

async function insertOneIncidentToDb(comment, lat, lng, photo) {
  const incident = { comment: comment, latitude: lat, longitude: lng, photo: photo }
  try {
      await mongoClient.connect();
      const db = mongoClient.db('incidentBoard');
      const collection = db.collection('incidents');
      const result = await collection.insertOne()
      console.log(count);
  }catch(err) {
      console.log(`Error: ${err}`);
  } finally {
      await mongoClient.close();
      console.log("Database connection is closed");
  }
}

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
  insertOneIncidentToDb(comment, lat, lng, photo);
  res.json({ comment, lat, lng, photo });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
