const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Gera o token
const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Registro de usuário
exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha, cargo } = req.body;

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'Email já cadastrado.' });
    }

    const novoUsuario = new User({
      nome,
      email,
      senhaHash: senha, // será criptografada pelo hook do schema
      cargo
    });

    await novoUsuario.save();

    res.status(201).json({ mensagem: 'Usuário registrado com sucesso.' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar usuário.', erro: error.message });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const senhaValida = await usuario.validarSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const token = gerarToken(usuario._id);

    res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo
      }
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no login.', erro: error.message });
  }
};
