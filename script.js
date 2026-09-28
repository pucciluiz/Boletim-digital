// DADOS BRUTOS FICTÍCIOS - 8º ANO
const dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// FUNÇÃO PARA NORMALIZAR NOTAS (converter para a escala 0 a 10)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null; // Nota ainda não lançada
    }

    // Se for texto, troca vírgula por ponto decimal
    if (typeof valor === 'string') {
        valor = valor.replace(',', '.');
    }

    let numero = Number(valor);

    // Se não for um número válido, descarta
    if (isNaN(numero)) {
        return null;
    }

    // Se o valor for maior que 10 e até 100, divide por 10 (ex: 85 vira 8.5)
    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    // Valida se ficou dentro do intervalo de 0 a 10
    if (numero >= 0 && numero <= 10) {
        return numero;
    }

    return null;
}

// FUNÇÃO PARA FORMATAR A NOTA NA TELA
function formatarExibicao(nota) {
    if (nota === null) return "—";
    return nota.toFixed(1).replace('.', ',');
}

// VARIÁVEIS PARA OS CARDS DE RESUMO
let somaMediasGeral = 0;
let qtdDisciplinasComMedia = 0;
let totalFaltasGeral = 0;
let contadorBomDesempenho = 0;
let contadorAtencao = 0;

// SELECIONA O CORPO DA TABELA NO HTML (USANDO O DOM)
const corpoTabela = document.getElementById("corpo-tabela");

// PERCORRE CADA DISCIPLINA E PREENCHE A TABELA AUTOMATICAMENTE
dadosBoletim.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula total de faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, f) => acc + f, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Junta apenas as notas disponíveis
    const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);

    let mediaFinal = null;
    let situacaoTexto = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasDisponiveis.length > 0) {
        const soma = notasDisponiveis.reduce((acc, n) => acc + n, 0);
        mediaFinal = soma / notasDisponiveis.length;

        somaMediasGeral += mediaFinal;
        qtdDisciplinasComMedia++;

        if (mediaFinal >= 6.0) {
            situacaoTexto = "Bom desempenho";
            classeSituacao = "situacao-bom";
            contadorBomDesempenho++;
        } else {
            situacaoTexto = "Atenção";
            classeSituacao = "situacao-atencao";
            contadorAtencao++;
        }
    }

    // Cria a linha da tabela (tr)
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>${item.disciplina}</strong></td>
        <td>${formatarExibicao(n1)}</td>
        <td>${formatarExibicao(n2)}</td>
        <td>${formatarExibicao(n3)}</td>
        <td><strong>${formatarExibicao(mediaFinal)}</strong></td>
        <td>${totalFaltasDisciplina}</td>
        <td><span class="${classeSituacao}">${situacaoTexto}</span></td>
    `;

    corpoTabela.appendChild(tr);
});

// PREENCHE OS CARDS DE RESUMO
if (qtdDisciplinasComMedia > 0) {
    const mediaGeralCalculada = somaMediasGeral / qtdDisciplinasComMedia;
    document.getElementById("media-geral").innerText = mediaGeralCalculada.toFixed(1).replace('.', ',');
}

document.getElementById("total-faltas").innerText = totalFaltasGeral;
document.getElementById("bom-desempenho").innerText = contadorBomDesempenho;
document.getElementById("precisa-atencao").innerText = contadorAtencao;

// NOTA DE FREQUÊNCIA:
// O percentual abaixo de 92% é apenas FICTÍCIO e DEMONSTRATIVO para esta etapa.
// Ele não é calculado a partir das faltas e será tratado de outra forma no futuro.