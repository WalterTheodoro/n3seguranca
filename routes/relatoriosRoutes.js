const express = require('express');
const router = express.Router();
const proteger = require('../middlewares/authMiddleware');
const Relatorio = require('../models/Relatorio');
const upload = require('../config/multer');
const autorizar = require('../middlewares/autorizacaoMiddleware');


// Criar novo relatório com comprovante
router.post('/', proteger, autorizar('funcionario', 'gerente', 'diretor'), async (req, res) => {
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

// Listar relatórios pendentes (para o gerente)
router.get('/pendentes', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const relatorios = await Relatorio.find({ status: 'pendente' }).populate('criadoPor', 'nome email');
    res.json(relatorios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios pendentes.', erro: error.message });
  }
});

// Validar ou rejeitar relatório
  router.put('/validar/:id', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['validado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido. Use "validado" ou "rejeitado".' });
    }

    const relatorio = await Relatorio.findById(req.params.id);

    if (!relatorio) {
      return res.status(404).json({ mensagem: 'Relatório não encontrado.' });
    }

    relatorio.status = status;
    await relatorio.save();

    res.json({ mensagem: `Relatório ${status} com sucesso.`, relatorio });

  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao validar relatório.', erro: error.message });
  }
});



module.exports = router;
