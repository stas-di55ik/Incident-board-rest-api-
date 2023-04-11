const express = require('express');
const multer = require('multer');
const path = require('path');
const { createServer, Server } = require('jsonrpc-lite');
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

// обробка запитів
app.post('/api', (req, res) => {
  const rpcRequest = req.body;
  const { method, params } = rpcRequest;

  // перемикання режиму роботи з бд
  switch (method) {
    case 'insertOneIncidentToDb':
      const { comment, lat, lng, photo } = params;
      insertOneIncidentToDb(comment, lat, lng, photo)
        .then((result) => {
          // відправка відповіді
          const rpcResponse = createServer().response(rpcRequest.id, null, result);
          res.json(rpcResponse);
        })
        .catch((error) => {
          // відправка повідомлення про помилку
          const rpcError = createServer().error(rpcRequest.id, new Error(error.message));
          res.json(rpcError);
        });
      break;
    case 'getAllIncidens':
      getAllIncidens()
        .then((result) => {
          // відправка відповіді
          const rpcResponse = createServer().response(rpcRequest.id, null, result);
          res.json(rpcResponse);
        })
        .catch((error) => {
          // відправка повідомлення про помилку
            const rpcError = createServer().error(rpcRequest.id, new Error(error.message));
            res.json(rpcError);
          });
      break;
    default:
      // відправка повідомлення про помилку у разі неспівпадіння методу для роботи з базою даних
      const rpcError = createServer().error(rpcRequest.id, new Error('Invalid method name'));
      res.json(rpcError);
      break;
    }
  });
          
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
