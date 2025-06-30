const express = require('express');
const router = express.Router();
const proteger = require('../middlewares/authMiddleware');
const Relatorio = require('../models/Relatorio');
const upload = require('../config/multer');

// Criar novo relatório com comprovante
router.post('/', proteger, upload.single('comprovante'), async (req, res) => {
  try {
    const { titulo, descricao, valor } = req.body;

    if (!titulo || !descricao || !valor) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
    }

    const filename = req.file ? req.file.filename : null;
    const urlComprovante = filename
      ? `${req.protocol}://${req.get('host')}/uploads/${filename}`
      : null;

    const novoRelatorio = new Relatorio({
      titulo,
      descricao,
      valor,
      criadoPor: req.usuario._id,
      comprovante: urlComprovante
    });

    await novoRelatorio.save();
    res.status(201).json({
      mensagem: 'Relatório criado com sucesso!',
      relatorio: novoRelatorio
    });

  } catch (error) {
    res.status(500).json({
      mensagem: 'Erro ao criar relatório.',
      erro: error.message
    });
  }
});


//Listar relatórios do usuário logado
router.get('/meus-relatorios', proteger, async (req, res) => {
  try {
    const relatorios = await Relatorio.find({ criadoPor: req.usuario._id }).sort({ createdAt: -1 });
    res.json({ relatorios });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios.', erro: error.message });
  }
});

module.exports = router;
