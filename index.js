
require('dotenv').config();

console.log('MONGO_URI:', process.env.MONGO_URI);  // Deve imprimir sua string de conexão

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const cors = require('cors');
const funcionariosRoutes = require('./routes/funcionariosRoutes');


const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));



// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/funcionarios', funcionariosRoutes);

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {console.log("MongoDB conectado.");
    app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
  })
  .catch(err => console.error("Erro ao conectar MongoDB:", err));                     
