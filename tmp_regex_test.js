const text = `Informações de contato Nome completo Telefone com código do país (ex.: +244, +351) E-mail profissional (ex.: [email protected] ) Cidade e país de residência LinkedIn (URL encurtado) Portfólio ou site profissional (se aplicável) 1.2 Resumo profissional (3–4 linhas) Um parágrafo curto que destaque experiência, competências-chave e objetivo. Exemplo: Engenheiro eletrotécnico com 8 anos de experiência em automação industrial e projetos internacionais. Especialista em programação de PLC e gestão de equipas. 1.3 Experiência profissional Ordene em cronológica inversa . Para cada entrada inclua: Empresa • Local • Cargo • Período (Mês/Ano – Mês/Ano) 3–5 bullets com conquistas mensuráveis (use números sempre que possível) Use verbos fortes: Liderei, Implementei, Otimizei, Aumentei 1.4 Formação académica Curso • Instituição • País • Ano de conclusão. Inclua certificados relevantes (Coursera, Cisco, etc.). 1.5 Competências Separe em duas listas curtas: Técnicas: softwares, ferramentas, linguagens Linguísticas: indique o nível (Inglês — Fluente; Francês — Intermediário) 1.6 Outros destaques (opcional) Voluntariado, prémios, publicações ou projetos relevantes. 2. Ajustes importantes para o mercado internacional Formato: PDF — preserva layout. Design: limpo, fontes legíveis (Arial, Calibri, Helvetica). Foto: não inclua (em países como EUA e Reino Unido é desaconselhado). Datas: use formato internacional — ex.: Mar 2020 – Aug 2024 . 3. Otimização para sistemas ATS (Applicant Tracking Systems) Para passar pelos filtros automáticos: Inclua palavras-chave da vaga (ex.: “project management”, “Python”, “customer service”). Use bullets simples; evite tabelas complexas e imagens embutidas. Use títulos claros (Experience, Education, Skills). 4. Erros`;

const formatDescription = (text) => {
    if (!text) return [];

    let formatted = text
        // Quebrar antes de "1.", "2.", etc. MAS garantir que tem espaço antes ou tá no início
        .replace(/(?:\s|^)(\d+\.)\s/g, '\n\n$1 ')

        // Quebrar antes de "1.1", "1.2", etc.
        .replace(/(?:\s|^)(\d+\.\d+)\s/g, '\n\n$1 ')

        // Quebrar antes de bullets "•" ou "⁃" ou "-" quando for lista
        .replace(/\s*([•⁃])\s*/g, '\n  $1 ')

        // Quebrar após ponto final seguido de espaço e maiúscula
        .replace(/\.\s+(?=[A-Z])/g, '.\n')

        // Quebrar após dois-pontos seguido de espaço e maiúscula
        .replace(/:\s+(?=[A-Z])/g, ':\n')

        // CASOS ESPECIAIS (como a falta de pontuação antes de "1.4")
        // Se há uma letra minúscula/maiúscula, seguida de espaço, e depois um numeral "1.4"
        .replace(/([a-zA-Z])\s+(\d+\.\d+)\s/g, '$1\n\n$2 ')
        .replace(/([a-zA-Z])\s+(\d+\.)\s/g, '$1\n\n$2 ')

        // Separar palavras chave como "Requisitos:", "Benefícios:", "Responsabilidades:"
        .replace(/(Requisitos|Benefícios|Responsabilidades|Perfil|Profile|Requirements|Benefits|Responsibilities):\s*/gi, '\n\n$1:\n')

        .trim();

    // Remove múltiplos espaços/linhas em branco excessivas
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.split('\n').map(l => l.trimEnd()).filter(l => l.trim().length > 0);
};

console.log(formatDescription(text).join('\n'));
