const express = require('express');
const cors = require('cors');
const db = require('./servidor');

const app = express();

app.use(cors());
app.use(express.json());

/*swagger*/
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
res.send('API funcionando');
});

/**
 * @openapi
 * /api/employees/search:
 *   get:
 *     summary: Buscar empleado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empleado encontrado
 */
/*Buscar un empleado por nombre o ID*/
app.get('/api/employees/search', (req, res) => {
const { nombre, id } = req.query;

let query = `
    SELECT 
    e.emp_no,
    e.first_name,
    e.last_name,
    t.title,
    d.dept_name,
    s.salary
    FROM employees e
    JOIN titles t ON e.emp_no = t.emp_no
    JOIN dept_emp de ON e.emp_no = de.emp_no
    JOIN departments d ON de.dept_no = d.dept_no
    JOIN salaries s ON e.emp_no = s.emp_no
    WHERE t.to_date = '9999-01-01'
    AND de.to_date = '9999-01-01'
    AND s.to_date = '9999-01-01'
`;

let params = [];

if (id) {
    query += ' AND e.emp_no = ?';
    params.push(id);
}

if (nombre) {
    query += ' AND e.first_name LIKE ?';
    params.push(`%${nombre}%`);
}

query += ' LIMIT 20';

db.query(query, params, (err, results) => {
    if (err) {
    console.error(err);
    return res.status(500).json({ mensaje: 'Error' });
    }
    res.json(results);
});
});

/**
 * @openapi
 * /api/employees/{id}/historial:
 *   get:
 *     summary: Obtener historial de un empleado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial obtenido
 */
/*historial completo de un empleado*/
app.get('/api/employees/:id/historial', (req, res) => {
const { id } = req.params;

const historial = {};

  // 🔹 Puestos
db.query(
    `SELECT title, from_date, to_date 
    FROM titles 
    WHERE emp_no = ? 
    ORDER BY from_date DESC`,
    [id],
    (err, titles) => {
      if (err) return res.status(500).json(err);

      historial.titles = titles;

      // 🔹 Salarios
      db.query(
        `SELECT salary, from_date, to_date 
        FROM salaries 
        WHERE emp_no = ? 
        ORDER BY from_date DESC`,
        [id],
        (err, salaries) => {
          if (err) return res.status(500).json(err);

          historial.salaries = salaries;

          // 🔹 Departamentos
          db.query(
            `SELECT d.dept_name, de.from_date, de.to_date
            FROM dept_emp de
            JOIN departments d ON de.dept_no = d.dept_no
            WHERE de.emp_no = ?
            ORDER BY de.from_date DESC`,
            [id],
            (err, departments) => {
              if (err) return res.status(500).json(err);

              historial.departments = departments;

              res.json(historial);
            }
          );
        }
      );
    }
  );
});

/**
 * @openapi
 * /api/incidencias:
 *   post:
 *     summary: Crear incidencia
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incidencia creada
 */
/*crear incidencia para un empleado*/
app.post('/api/incidencias', (req, res) => {
const { emp_no, tipo, fecha, descripcion, estatus } = req.body;

const query = `
    INSERT INTO incidencias_rrhh (emp_no, tipo, fecha, descripcion, estatus)
    VALUES (?, ?, ?, ?, ?)
`;

db.query(query, [emp_no, tipo, fecha, descripcion, estatus], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ mensaje: 'Incidencia creada', id: result.insertId });
});
});

app.get('/api/incidencias', (req, res) => {
  db.query('SELECT * FROM incidencias_rrhh', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
});
});

/**
 * @openapi
 * /api/incidencias/{id}:
 *   put:
 *     summary: actualizar incidencia
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incidencia actualizada
 */
/*modificar incidencia existente*/
app.put('/api/incidencias/:id', (req, res) => {
const id = req.params.id;
const { tipo, fecha, descripcion, estatus } = req.body;

const query = `
    UPDATE incidencias_rrhh
    SET tipo=?, fecha=?, descripcion=?, estatus=?
    WHERE id_incidencia=?
`;

db.query(query, [tipo, fecha, descripcion, estatus, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ mensaje: 'Incidencia actualizada' });
});
});

/**
 * @openapi
 * /api/incidencias/{id}:
 *   delete:
 *     summary: Eliminar incidencia
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incidencia eliminada
 */

/*eliminar incidencia*/
app.delete('/api/incidencias/:id', (req, res) => {
const id = req.params.id;

db.query(
    'DELETE FROM incidencias_rrhh WHERE id_incidencia = ?',
    [id],
    (err) => {
    if (err) return res.status(500).json(err);

    res.json({ mensaje: 'Incidencia eliminada' });
    }
);
});

/**
 * @openapi
 * /api/dashboard/departamentos:
 *   get:
 *     summary: Obtener departamentos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Departamentos obtenidos
 */
app.get('/api/dashboard/departamentos', (req, res) => {
  const query = `
    SELECT d.dept_name, COUNT(*) as total
    FROM dept_emp de
    JOIN departments d ON de.dept_no = d.dept_no
    WHERE de.to_date = '9999-01-01'
    GROUP BY d.dept_name
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/**
 * @openapi
 * /api/dashboard/salarios:
 *   get:
 *     summary: Obtener promedio de salarios por departamento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Promedio de salarios obtenido
 */
app.get('/api/dashboard/salarios', (req, res) => {
  const query = `
    SELECT d.dept_name, AVG(s.salary) as promedio
    FROM salaries s
    JOIN dept_emp de ON s.emp_no = de.emp_no
    JOIN departments d ON de.dept_no = d.dept_no
    WHERE s.to_date = '9999-01-01'
    AND de.to_date = '9999-01-01'
    GROUP BY d.dept_name
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/**
 * @openapi
 * /api/dashboard/puestos:
 *   get:
 *     summary: Obtener puestos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Puestos obtenidos
 */
app.get('/api/dashboard/puestos', (req, res) => {
  const query = `
    SELECT title, COUNT(*) as total
    FROM titles
    WHERE to_date = '9999-01-01'
    GROUP BY title
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.listen(3001, () => {
console.log('🚀 Servidor en http://localhost:3001');
});
