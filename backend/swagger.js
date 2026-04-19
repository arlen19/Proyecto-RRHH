const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
openapi: '3.0.0',
info: {
    title: 'API Recursos Humanos',
    version: '1.0.0',
    description: 'Documentación de la API de empleados e incidencias'
},
servers: [
    {
    url: 'http://localhost:3001'
    }
]
};

const options = {
swaggerDefinition,
  
  apis: ['./*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;