const express = require('express');
const router = express.Router();
const proteger = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Criar novo funcionário

router.post('/', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const { nome, email, senha, cargo } = req.body;

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'E-mail já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = new User({ nome, email, senhaHash, cargo });
    await novoUsuario.save();

    res.status(201).json({ mensagem: 'Funcionário criado com sucesso.', usuario: novoUsuario });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar funcionário.', erro: error.message });
  }
});

// Apenas GERENTE pode acessar essas rotas
router.get('/', proteger, autorizar('gerente'), async (req, res) => {
});

// Listar todos os funcionários
router.get('/', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const usuarios = await User.find().select('-senhaHash');
    res.json({ funcionarios: usuarios });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar funcionários.', erro: error.message });
  }
});

// Buscar funcionário por ID
router.get('/:id', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-senhaHash');
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }
    res.json({ funcionario: usuario });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar funcionário.', erro: error.message });
  }
});

// Atualizar funcionário
router.put('/:id', proteger, autorizar('gerente'), async (req, res) => {    
  try {
    const { nome, email, cargo, senha } = req.body;
    const atualizacao = { nome, email, cargo };

    if (senha) {
      atualizacao.senhaHash = await bcrypt.hash(senha, 10);
    }

    const usuarioAtualizado = await User.findByIdAndUpdate(req.params.id, atualizacao, {
      new: true,
    }).select('-senhaHash');

    if (!usuarioAtualizado) {
      return res.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }

    res.json({ mensagem: 'Funcionário atualizado.', funcionario: usuarioAtualizado });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar funcionário.', erro: error.message });
  }
});

// Excluir funcionário
router.delete('/:id', proteger, autorizar('gerente'), async (req, res) => {
  try {
    const usuarioRemovido = await User.findByIdAndDelete(req.params.id);
    if (!usuarioRemovido) {
      return res.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }

    res.json({ mensagem: 'Funcionário excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir funcionário.', erro: error.message });
  }
});

module.exports = router;
