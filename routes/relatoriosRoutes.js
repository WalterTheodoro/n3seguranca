const express = require('express');
const router = express.Router();
const proteger = require('../middlewares/authMiddleware');

// Exemplo de rota protegida
router.get('/meus-relatorios', proteger, (req, res) => {
  // Aqui o usuário já está autenticado e disponível em req.usuario
  res.json({ mensagem: 'Acesso autorizado!', usuario: req.usuario });
});

module.exports = router;
