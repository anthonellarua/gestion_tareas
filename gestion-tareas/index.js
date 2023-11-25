const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');
const cors = require('cors'); // Importa el módulo CORS

const app = express();
app.use(cors()); // Habilita CORS en tu aplicación

const server = http.createServer(app);
const io = socketIo(server);

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'task_manager'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conectado a la base de datos MySQL');
});

app.use(express.json()); // Agrega este middleware para el manejo de solicitudes JSON

app.get('/tasks', (req, res) => {
  db.query('SELECT * FROM tasks', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/tasks', (req, res) => {
   const { name } = req.body;
   db.query('INSERT INTO tasks (name) VALUES (?)', [name], (err, result) => {
     if (err) {
       res.status(500).json({ error: err.message });
     } else {
       const newTaskId = result.insertId;
       io.emit('taskCreated', { id: newTaskId, name, completed: false });
       res.status(201).json({ id: newTaskId, name, completed: false });
     }
   });
});

app.put('/tasks/:id', (req, res) => {
   const taskId = req.params.id;
   const { name, completed } = req.body;
 
   db.query('UPDATE tasks SET name = ?, completed = ? WHERE id = ?', [name, completed, taskId], (err, result) => {
     if (err) {
       res.status(500).json({ error: err.message });
     } else {
       io.emit('taskUpdated', { id: taskId, name, completed });
       res.status(200).json({ message: 'Tarea actualizada' });
     }
   });
});
 
app.delete('/tasks/:id', (req, res) => {
   const taskId = req.params.id;
   db.query('DELETE FROM tasks WHERE id = ?', [taskId], (err, result) => {
     if (err) {
       res.status(500).json({ error: err.message });
     } else {
       io.emit('taskDeleted', taskId);
       res.status(200).json({ message: 'Tarea eliminada' });
     }
   });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor Node.js corriendo en el puerto ${PORT}`);
});
