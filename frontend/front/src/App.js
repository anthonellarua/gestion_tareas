import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button, Checkbox, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

const socket = io('http://localhost:5000');

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Función para cargar las tareas
  const loadTasks = () => {
    fetch('http://localhost:5000/tasks')
      .then((response) => response.json())
      .then((data) => {
        setTasks(data);
      })
      .catch((error) => {
        console.error('Error al obtener las tareas:', error);
      });
  };
  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = () => {
    fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newTask }),
    })
      .then((response) => response.json())
      .then((data) => {
        setTasks([...tasks, data]);
        socket.emit('addTask', data);
      })
      .catch((error) => {
        console.error('Error al agregar la tarea:', error);
      });
    setNewTask('');
    loadTasks();
  };

  //editar
  const [editingTask, setEditingTask] = useState(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  const [editedTaskCompleted, setEditedTaskCompleted] = useState(false);

  const handleEditClick = (taskId, taskName, taskCompleted) => {
    setEditingTask(taskId);
    setEditedTaskName(taskName);
    setEditedTaskCompleted(taskCompleted);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleEditTask = (taskId) => {
    fetch(`http://localhost:5000/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: editedTaskName, completed: editedTaskCompleted }),
    })
      .then(() => {
        const updatedTasks = tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, name: editedTaskName, completed: editedTaskCompleted };
          }
          return task;
        });
        setTasks(updatedTasks);
        socket.emit('taskUpdated', { id: taskId, name: editedTaskName, completed: editedTaskCompleted });
        setEditingTask(null);
      })
      .catch((error) => {
        console.error('Error al editar la tarea:', error);
      });
      loadTasks();
  };

  const handleDeleteTask = (taskId) => {
    fetch(`http://localhost:5000/tasks/${taskId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== taskId));
        socket.emit('deleteTask', taskId);
      })
      .catch((error) => {
        console.error('Error al eliminar la tarea:', error);
      });
      loadTasks();
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" align="center" gutterBottom>
        Lista de Tareas
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Nueva tarea"
        margin="normal"
      />
      <Button variant="contained" onClick={handleAddTask} sx={{ marginBottom: '1rem' }}>
        Agregar Tarea
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarea</TableCell>
              <TableCell align="center">Completada</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                {editingTask === task.id ? (
                  <>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="text"
                        value={editedTaskName}
                        onChange={(e) => setEditedTaskName(e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={editedTaskCompleted}
                        onChange={(e) => setEditedTaskCompleted(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button variant="contained" onClick={() => handleEditTask(task.id)}>Guardar</Button>
                      <Button variant="contained" onClick={handleCancelEdit}>Cancelar</Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      {task.name}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox checked={task.completed} disabled />
                    </TableCell>
                    <TableCell align="center">
                      <Button variant="contained" onClick={() => handleEditClick(task.id, task.name, task.completed)}>Editar</Button>
                      <Button variant="contained" onClick={() => handleDeleteTask(task.id)}>Eliminar</Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default App;
