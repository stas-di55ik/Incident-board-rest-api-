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
    const result = await collection.insertOne(incident);
    console.log(`Inserting result: ${result}`);
  } catch(err) {
    console.log(`Error: ${err}`);
  } finally {
    await mongoClient.close();
    console.log("Database connection is closed");
  }
}

async function getAllIncidens() {
  let allIncidents = null; 
  try {
    await mongoClient.connect();
    const db = mongoClient.db('incidentBoard');
    const collection = db.collection('incidents');
    allIncidents = await collection.find({}).toArray();
  } catch(err) {
    console.log(`Error: ${err}`); 
  } finally {
    await mongoClient.close();
    console.log("Database connection is closed");
    return allIncidents;
  }
}

async function doOperationsWithDb(comment, lat, lng, photo) {
  await insertOneIncidentToDb(comment, lat, lng, photo);
  const allIncidents = await getAllIncidens();
  return allIncidents;
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
  doOperationsWithDb(comment, lat, lng, photo).then((result) => {
    const allIncidents = result;
    allIncidents.forEach(element => {
      console.log(JSON.stringify(element));
    });
    res.json(allIncidents);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
