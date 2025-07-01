const express = require('express');
const router = express.Router();
const proteger = require('../middlewares/authMiddleware');
const Relatorio = require('../models/Relatorio');
const upload = require('../config/multer');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const crypto = require('crypto');
const { criptografarChavePrivada, descriptografarChavePrivada } = require('../util/criptoChave');



// Criar novo relatório com comprovante
router.post('/', proteger, autorizar('funcionario', 'gerente', 'diretor'), upload.single('comprovante'), async (req, res) => {

   try {

  const { titulo, descricao, valor } = req.body;
  console.log(titulo, descricao, valor); // deve imprimir os valores corretamente

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
router.get('/pendentes', proteger, autorizar('gerente', 'diretor'), async (req, res) => {
  try {
    const relatorios = await Relatorio.find({ status: 'pendente' }).populate('criadoPor', 'nome email');
    res.json(relatorios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios pendentes.', erro: error.message });
  }
});

// Validar ou rejeitar relatório
  router.put('/validar/:id', proteger, autorizar('gerente', 'diretor'), async (req, res) => {
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

// Listar relatórios validados
router.get('/validados', proteger, autorizar('gerente', 'diretor'), async (req, res) => {
  try {
    const relatoriosValidados = await Relatorio.find({ status: 'validado' }).populate('criadoPor', 'nome email');
    res.json(relatoriosValidados);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios validados.', erro: error.message });
  }
});

// Listar relatórios rejeitados
router.get('/rejeitados', proteger, autorizar('gerente', 'diretor'), async (req, res) => {
  try {
    const relatoriosRejeitados = await Relatorio.find({ status: 'rejeitado' }).populate('criadoPor', 'nome email');
    res.json(relatoriosRejeitados);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios rejeitados.', erro: error.message });
  }
});


  // gera e salva chave pública e privada no MongoDB
router.post('/gerar', proteger, autorizar('diretor'), async (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Armazena diretamente no documento do diretor logado
    req.usuario.chavePublica = publicKey;
    req.usuario.chavePrivadaCriptografada = privateKey; // futuramente criptografar de forma segura

    await req.usuario.save();

    res.json({ mensagem: 'Chaves geradas com sucesso.', publicKey });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao gerar chaves.', erro: error.message });
  }
});



  // busca relatório, assina com a chave privada do diretor
router.post('/assinar/:id', proteger, autorizar('diretor'), async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);

    if (!relatorio || relatorio.status !== 'validado') {
      return res.status(400).json({ mensagem: 'Relatório não está validado para assinatura.' });
    }

    const senha = process.env.CHAVE_PRIVADA_SECRET;

    const privateKeyCriptografada = req.usuario.chavePrivadaCriptografada;
    if (!privateKeyCriptografada) {
      return res.status(400).json({ mensagem: 'Chave privada não encontrada.' });
    }

    const privateKey = descriptografarChavePrivada(privateKeyCriptografada, senha);

    const dados = JSON.stringify({
      id: relatorio._id.toString(),
      titulo: relatorio.titulo,
      valor: relatorio.valor,
      criadoPor: relatorio.criadoPor.toString(),
    });

    const assinatura = crypto.sign(
      'sha256',
      Buffer.from(dados),
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      }
    );

    relatorio.assinaturaDigital = assinatura.toString('base64');
    relatorio.status = 'assinado';
    await relatorio.save();

    res.json({ mensagem: 'Relatório assinado com sucesso.', relatorio });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao assinar relatório.', erro: error.message });
  }
});

// GET /relatorios/verificar/:id
router.get('/verificar/:id', proteger, autorizar('diretor'), async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id).populate('criadoPor');

    if (!relatorio || relatorio.status !== 'assinado' || !relatorio.assinaturaDigital) {
      return res.status(400).json({ mensagem: 'Relatório não é válido para verificação.' });
    }

    const publicKey = req.usuario.chavePublica;

    if (!publicKey) {
      return res.status(400).json({ mensagem: 'Chave pública não encontrada.' });
    }

    const dados = `${relatorio._id}-${relatorio.titulo}-${relatorio.valor}-${relatorio.criadoPor}`;

    const isValido = crypto.verify(
      'sha256',
      Buffer.from(dados),
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
      Buffer.from(relatorio.assinaturaDigital, 'base64')
    );

    res.json({
      mensagem: isValido ? 'Assinatura válida.' : 'Assinatura inválida.',
      valido: isValido
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao verificar assinatura.', erro: error.message });
  }
});

// GET /relatorios/assinados
router.get('/assinados', proteger, autorizar('diretor'), async (req, res) => {
  try {
    const relatorios = await Relatorio.find({ status: 'assinado' }).populate('criadoPor', 'nome email');
    res.json(relatorios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar relatórios assinados.', erro: error.message });
  }
});






module.exports = router;
