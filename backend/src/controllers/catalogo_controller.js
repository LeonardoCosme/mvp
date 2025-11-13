// src/controllers/catalogo_controller.js
import { TipoServico } from "../models/index.js";

/**
 * GET /api/tipos-servico
 * Retorna a lista de tipos de serviço cadastrados no banco
 */
export async function listTipos(req, res) {
  try {
    // ✅ Retorna o campo 'nome' renomeado para 'nomeServico' — compatível com o frontend
    const itens = await TipoServico.findAll({
      attributes: ["id", ["nome", "nomeServico"]],
      order: [["nome", "ASC"]],
      raw: true,
    });

    // 🧩 Log opcional para depuração
    console.log("📦 Tipos de serviço retornados:", itens);

    // ✅ Resposta direta e compatível
    return res.json(itens);
  } catch (err) {
    console.error("❌ listTipos:", err);
    return res.status(500).json({ error: "Erro ao listar tipos de serviço." });
  }
}
