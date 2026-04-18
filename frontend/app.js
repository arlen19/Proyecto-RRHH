const API = 'http://localhost:3001/api';

let graficaDeptos;
let graficaSalarios;
let graficaPuestos;

// 🔍 Buscar empleados
function buscarEmpleados() {
  const valor = document.getElementById("buscarGeneral").value.trim();

  if (!valor) return;

  let url = `${API}/employees/search?`;

  // Detecta si es ID o nombre
  if (/^\d+$/.test(valor)) {
    url += `id=${valor}`;
  } else {
    url += `nombre=${encodeURIComponent(valor)}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {

      let html = "";

      if (data.length === 0) {
        html = `<tr><td colspan="9">Sin resultados</td></tr>`;
      } else {
        data.forEach(emp => {
          html += `
            <tr>
              <td>${emp.emp_no}</td>
              <td>${emp.first_name}</td>
              <td>${emp.last_name}</td>
              <td>${emp.title}</td>
              <td>${emp.dept_name}</td>
              <td>$${Number(emp.salary).toLocaleString()}</td>
              <td>
                <button onclick="verHistorial(${emp.emp_no})">📊</button>
              </td>
            </tr>
          `;
        });
      }

      document.getElementById("resultadoBusqueda").innerHTML = html;
      limpiarBusqueda();
    })
    .catch(err => console.error("Error:", err));
}

// 📊 Ver historial de empleado
function verHistorial(id) {
  fetch(`${API}/employees/${id}/historial`)
    .then(res => res.json())
    .then(data => {
      mostrarHistorial(data);
    })
    .catch(err => console.error("Error:", err));
}

// 📈 Mostrar historial en pantalla
function mostrarHistorial(data) {

  let html = "<h3>📊 Historial del empleado</h3>";

  // 🔹 TABLA PUESTOS
  html += `
    <h4>Puestos</h4>
    <table>
      <tr>
        <th>Puesto</th>
        <th>Fecha Inicial</th>
        <th>Fecha Final</th>
      </tr>
  `;

  data.titles.forEach(t => {
    html += `
      <tr>
        <td>${t.title}</td>
        <td>${t.from_date}</td>
        <td>${t.to_date}</td>
      </tr>
    `;
  });

  html += `</table>`;


  // 🔹 TABLA SALARIOS
  html += `
    <h4>Salarios</h4>
    <table>
      <tr>
        <th>Salario</th>
        <th>Fecha Inicial</th>
        <th>Fecha Final</th>
      </tr>
  `;

  data.salaries.forEach(s => {
    html += `
      <tr>
        <td>$${Number(s.salary).toLocaleString()}</td>
        <td>${s.from_date}</td>
        <td>${s.to_date}</td>
      </tr>
    `;
  });

  html += `</table>`;


  // 🔹 TABLA DEPARTAMENTOS
  html += `
    <h4>Departamentos</h4>
    <table>
      <tr>
        <th>Departamento</th>
        <th>Fecha Inicial</th>
        <th>Fecha Final</th>
      </tr>
  `;

  data.departments.forEach(d => {
    html += `
      <tr>
        <td>${d.dept_name}</td>
        <td>${d.from_date}</td>
        <td>${d.to_date}</td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("historial").innerHTML = html;
}

// 🔥 CREAR
function crearIncidencia() {
  const data = {
    emp_no: document.getElementById("emp_no").value,
    tipo: document.getElementById("tipo").value,
    fecha: document.getElementById("fecha").value,
    descripcion: document.getElementById("descripcion").value,
    estatus: document.getElementById("estatus").value
  };

  fetch(`${API}/incidencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(() => {
      alert("Incidencia creada");
      document.getElementById("tituloListado").style.display = "block";
      document.getElementById("contenedorTabla").style.display = "block";
      limpiarFormulario();
      cargarIncidencias();
    });
}

/*cargar incidencias*/
function cargarIncidencias() {
  fetch(`${API}/incidencias`)
    .then(res => res.json())
    .then(data => {

      let html = "";

      data.forEach(i => {
        html += `
          <tr>
            <td>${i.id_incidencia}</td>
            <td>${i.emp_no}</td>
            <td>${i.tipo}</td>
            <td>${i.fecha}</td>
            <td>${i.descripcion}</td>
            <td>${i.estatus}</td>
            <td>
              <button onclick="editarIncidencia(${i.id_incidencia})">✏️</button>
              <button onclick="eliminarIncidencia(${i.id_incidencia})">🗑️</button>
            </td>
          </tr>
        `;
      });

      document.getElementById("tablaIncidencias").innerHTML = html;
    });
}

// 🔥 ELIMINAR
function eliminarIncidencia(id) {
  if (!confirm("¿Eliminar incidencia?")) return;

  fetch(`${API}/incidencias/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      cargarIncidencias();
    });
}

// 🔥 EDITAR (simple con prompt)
function editarIncidencia(id) {
  const tipo = prompt("Nuevo tipo:");
  const fecha = prompt("Nueva fecha (YYYY-MM-DD):");
  const descripcion = prompt("Nueva descripción:");
  const estatus = prompt("Nuevo estatus:");

  fetch(`${API}/incidencias/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo,
      fecha,
      descripcion,
      estatus
    })
  })
    .then(res => res.json())
    .then(() => {
      alert("Actualizado");
      cargarIncidencias();
    });
}
/*dashboard departamentos*/
function cargarGraficaDeptos() {
  fetch(`${API}/dashboard/departamentos`)
    .then(res => res.json())
    .then(data => {

      const labels = data.map(d => d.dept_name);
      const valores = data.map(d => d.total);

      // 🔥 destruir gráfica anterior
      if (graficaDeptos) graficaDeptos.destroy();

      graficaDeptos = new Chart(document.getElementById('graficaDeptos'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Empleados por departamento',
            data: valores,
            borderWidth: 1,
            barPercentage: 0.6,        // 👈 más elegante
            categoryPercentage: 0.6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // 👈 CLAVE

          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },

          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0 // 👈 evita decimales raros
              }
            }
          }
        }
      });
    })
    .catch(err => console.error("Error gráfica departamentos:", err));
}

/*dashboard salarios*/
function cargarGraficaSalarios() {
  fetch(`${API}/dashboard/salarios`)
    .then(res => res.json())
    .then(data => {

      const labels = data.map(d => d.dept_name);
      const valores = data.map(d => d.promedio);

      // 🔥 destruir gráfica anterior
      if (graficaSalarios) graficaSalarios.destroy();

      graficaSalarios = new Chart(document.getElementById('graficaSalarios'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Salario promedio',
            data: valores,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // 👈 clave

          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },

          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    })
    .catch(err => console.error("Error gráfica salarios:", err));
}

/*dashboard puestos*/
function cargarGraficaPuestos() {
  fetch(`${API}/dashboard/puestos`)
    .then(res => res.json())
    .then(data => {

      const labels = data.map(d => d.title);
      const valores = data.map(d => d.total);

      // 🔥 destruir gráfica anterior
      if (graficaPuestos) graficaPuestos.destroy();

      graficaPuestos = new Chart(document.getElementById('graficaPuestos'), {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: valores,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // 👈 clave para que respete el contenedor

          plugins: {
            legend: {
              position: 'bottom' // 👈 mejor para diseño
            }
          }
        }
      });
    })
    .catch(err => console.error("Error gráfica puestos:", err));
}

// 🧹 LIMPIAR FORMULARIO
function limpiarFormulario() {
document.getElementById('emp_no').value = '';
document.getElementById('tipo').value = '';
document.getElementById('fecha').value = '';
document.getElementById('descripcion').value = '';
document.getElementById('estatus').value = '';
}

function limpiarBusqueda() {
  document.getElementById("buscarGeneral").value = "";
}

function cargarClima() {
fetch('https://api.open-meteo.com/v1/forecast?latitude=19.43&longitude=-99.13&current_weather=true')
    .then(res => res.json())
    .then(data => {
    const temp = data.current_weather.temperature;
    const fecha = new Date().toLocaleDateString();

    document.getElementById('clima').innerHTML = `
        <strong>Clima CDMX</strong><br>
        🌡️ ${temp}°C <br>
        📅 ${fecha}
    `;
    })
    .catch(() => {
    document.getElementById('clima').innerHTML = 'Error al cargar clima';
    });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}
/*🔥 cargar tema al abrir la página
window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
};*/

cargarGraficaDeptos();
cargarGraficaSalarios();
cargarGraficaPuestos();
cargarClima();
