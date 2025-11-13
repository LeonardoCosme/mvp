// src/controllers/catalogo_controller.js
import { TipoServico } from "../models/index.js";

/**
 * GET /api/tipos-servico
 * Retorna a lista de tipos de serviço cadastrados no banco
 */
export async function listTipos(req, res) {
  try {
    // ✅ Retorna os campos originais: id e nome
    const itens = await TipoServico.findAll({
      attributes: ["id", "nome"],
      order: [["nome", "ASC"]],
      raw: true,
    });

    // ✅ Resposta direta e simples
    return res.json(itens);
  } catch (err) {
    console.error("❌ listTipos:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar tipos de serviço." });
  }
}
