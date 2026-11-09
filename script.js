// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
    turma: "8B",
    numeroChamada: 20,
    apiUrl: "https://boletim-api.profbt.com.br"
};

// DADOS BRUTOS FICTÍCIOS DE RESERVA - 8º ANO
const dadosBoletimPadrao = [
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
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// VARIÁVEIS DE SESSÃO EM MEMÓRIA
let pinSessao = "";
let dadosAtuais = [];
let modoEdicao = false;

// FUNÇÃO PARA NORMALIZAR NOTAS (converter para a escala 0 a 10)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === 'string') {
        valor = valor.replace(',', '.').trim();
        if (valor === "") return null;
    }

    let numero = Number(valor);

    if (isNaN(numero)) {
        return null;
    }

    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    if (numero >= 0 && numero <= 10) {
        return numero;
    }

    return null;
}

// FUNÇÃO PARA FORMATAR A NOTA NA TELA
function formatarExibicao(nota) {
    if (nota === null || nota === undefined) return "—";
    return Number(nota).toFixed(1).replace('.', ',');
}

// LOGAR E ABRIR BOLETIM VIA API
async function fazerLogin() {
    const inputPin = document.getElementById("input-pin");
    const msgLogin = document.getElementById("mensagem-login");
    const pinDigitado = inputPin.value.trim();

    if (!pinDigitado) {
        msgLogin.className = "mensagem-status erro";
        msgLogin.textContent = "Digite o PIN para continuar.";
        return;
    }

    msgLogin.className = "mensagem-status info";
    msgLogin.textContent = "Conectando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinDigitado
            })
        });

        if (resposta.status === 401) {
            msgLogin.className = "mensagem-status erro";
            msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
            return;
        }

        if (resposta.status === 429) {
            msgLogin.className = "mensagem-status erro";
            msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            return;
        }

        if (!resposta.ok) {
            msgLogin.className = "mensagem-status erro";
            msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
            return;
        }

        const json = await resposta.json();

        // Sucesso: armazena PIN em memória e limpa campo visual
        pinSessao = pinDigitado;
        inputPin.value = "";

        // Processa os dados recebidos ou usa os locais
        if (json.dados && Array.isArray(json.dados.disciplinas) && json.dados.disciplinas.length > 0) {
            dadosAtuais = json.dados.disciplinas.map(item => ({
                disciplina: item.disciplina,
                tri1: item.tri1 !== undefined ? item.tri1 : (item.notas ? item.notas[0] : null),
                tri2: item.tri2 !== undefined ? item.tri2 : (item.notas ? item.notas[1] : null),
                tri3: item.tri3 !== undefined ? item.tri3 : (item.notas ? item.notas[2] : null),
                faltas: Array.isArray(item.faltas) ? item.faltas : [0, 0, 0]
            }));
        } else {
            dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimPadrao));
        }

        document.getElementById("area-login").style.display = "none";
        document.getElementById("conteudo-boletim").style.display = "block";
        renderizarBoletim();

    } catch (erro) {
        msgLogin.className = "mensagem-status erro";
        msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    }
}

// RENDERIZAR TABELA E CARDS
function renderizarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = "";

    let somaMediasGeral = 0;
    let qtdDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let contadorBomDesempenho = 0;
    let contadorAtencao = 0;

    dadosAtuais.forEach((item, index) => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const f1 = (item.faltas && item.faltas[0] !== undefined) ? item.faltas[0] : 0;
        const f2 = (item.faltas && item.faltas[1] !== undefined) ? item.faltas[1] : 0;
        const f3 = (item.faltas && item.faltas[2] !== undefined) ? item.faltas[2] : 0;

        const totalFaltasDisciplina = Number(f1) + Number(f2) + Number(f3);
        totalFaltasGeral += totalFaltasDisciplina;

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

        const tr = document.createElement("tr");

        if (modoEdicao) {
            tr.innerHTML = `
                <td></td>
                <td><input type="text" class="input-edicao" id="input-n1-${index}" value="${n1 !== null ? String(n1).replace('.', ',') : ''}"></td>
                <td><input type="text" class="input-edicao" id="input-n2-${index}" value="${n2 !== null ? String(n2).replace('.', ',') : ''}"></td>
                <td><input type="text" class="input-edicao" id="input-n3-${index}" value="${n3 !== null ? String(n3).replace('.', ',') : ''}"></td>
                <td><strong>${formatarExibicao(mediaFinal)}</strong></td>
                <td>
                    <input type="text" class="input-edicao" id="input-f1-${index}" value="${f1}" title="Faltas 1º Tri" placeholder="T1">
                    <input type="text" class="input-edicao" id="input-f2-${index}" value="${f2}" title="Faltas 2º Tri" placeholder="T2">
                    <input type="text" class="input-edicao" id="input-f3-${index}" value="${f3}" title="Faltas 3º Tri" placeholder="T3">
                </td>
                <td><span class="${classeSituacao}">Em edição</span></td>
            `;
            tr.cells[0].textContent = item.disciplina;
        } else {
            tr.innerHTML = `
                <td></td>
                <td>${formatarExibicao(n1)}</td>
                <td>${formatarExibicao(n2)}</td>
                <td>${formatarExibicao(n3)}</td>
                <td><strong>${formatarExibicao(mediaFinal)}</strong></td>
                <td>${totalFaltasDisciplina}</td>
                <td><span class="${classeSituacao}"></span></td>
            `;
            tr.cells[0].textContent = item.disciplina;
            tr.cells[6].querySelector("span").textContent = situacaoTexto;
        }

        corpoTabela.appendChild(tr);
    });

    if (qtdDisciplinasComMedia > 0) {
        const mediaGeralCalculada = somaMediasGeral / qtdDisciplinasComMedia;
        document.getElementById("media-geral").innerText = mediaGeralCalculada.toFixed(1).replace('.', ',');
    } else {
        document.getElementById("media-geral").innerText = "—";
    }

    document.getElementById("total-faltas").innerText = totalFaltasGeral;
    document.getElementById("bom-desempenho").innerText = contadorBomDesempenho;
    document.getElementById("precisa-atencao").innerText = contadorAtencao;
}

// MODOS DE EDIÇÃO
function ativarEdicao() {
    modoEdicao = true;
    document.getElementById("btn-alterar").style.display = "none";
    document.getElementById("btn-salvar").style.display = "inline-block";
    document.getElementById("btn-cancelar").style.display = "inline-block";
    document.getElementById("mensagem-salvar").textContent = "";
    renderizarBoletim();
}

function cancelarEdicao() {
    modoEdicao = false;
    document.getElementById("btn-alterar").style.display = "inline-block";
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-cancelar").style.display = "none";
    document.getElementById("mensagem-salvar").textContent = "";
    renderizarBoletim();
}

// VALIDAÇÕES E SALVAMENTO NA API
function validarNotaDigitada(str) {
    if (str === null || str === undefined) return { valido: true, valor: null };
    const limpo = str.toString().trim();
    if (limpo === "") return { valido: true, valor: null };

    const comPonto = limpo.replace(',', '.');
    const num = Number(comPonto);

    if (isNaN(num) || num < 0 || num > 10) {
        return { valido: false, valor: null };
    }
    return { valido: true, valor: num };
}

function validarFaltaDigitada(str) {
    if (str === null || str === undefined) return { valido: false, valor: null };
    const limpo = str.toString().trim();
    if (limpo === "") return { valido: false, valor: null };

    if (!/^\d+$/.test(limpo)) {
        return { valido: false, valor: null };
    }
    const num = Number(limpo);
    if (num < 0) return { valido: false, valor: null };
    return { valido: true, valor: num };
}

async function salvarAlteracoes() {
    const msgSalvar = document.getElementById("mensagem-salvar");
    msgSalvar.className = "mensagem-status info";
    msgSalvar.textContent = "Validando dados...";

    let temErro = false;
    const novosDados = [];

    for (let i = 0; i < dadosAtuais.length; i++) {
        const inputN1 = document.getElementById(`input-n1-${i}`);
        const inputN2 = document.getElementById(`input-n2-${i}`);
        const inputN3 = document.getElementById(`input-n3-${i}`);
        const inputF1 = document.getElementById(`input-f1-${i}`);
        const inputF2 = document.getElementById(`input-f2-${i}`);
        const inputF3 = document.getElementById(`input-f3-${i}`);

        [inputN1, inputN2, inputN3, inputF1, inputF2, inputF3].forEach(el => el.classList.remove("invalido"));

        const valN1 = validarNotaDigitada(inputN1.value);
        if (!valN1.valido) { inputN1.classList.add("invalido"); temErro = true; }

        const valN2 = validarNotaDigitada(inputN2.value);
        if (!valN2.valido) { inputN2.classList.add("invalido"); temErro = true; }

        const valN3 = validarNotaDigitada(inputN3.value);
        if (!valN3.valido) { inputN3.classList.add("invalido"); temErro = true; }

        const valF1 = validarFaltaDigitada(inputF1.value);
        if (!valF1.valido) { inputF1.classList.add("invalido"); temErro = true; }

        const valF2 = validarFaltaDigitada(inputF2.value);
        if (!valF2.valido) { inputF2.classList.add("invalido"); temErro = true; }

        const valF3 = validarFaltaDigitada(inputF3.value);
        if (!valF3.valido) { inputF3.classList.add("invalido"); temErro = true; }

        novosDados.push({
            disciplina: dadosAtuais[i].disciplina,
            tri1: valN1.valor,
            tri2: valN2.valor,
            tri3: valN3.valor,
            faltas: [valF1.valor, valF2.valor, valF3.valor]
        });
    }

    if (temErro) {
        msgSalvar.className = "mensagem-status erro";
        msgSalvar.textContent = "Verifique os campos destacados em vermelho. Notas: 0 a 10. Faltas: números inteiros ≥ 0.";
        return;
    }

    msgSalvar.className = "mensagem-status info";
    msgSalvar.textContent = "Salvando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novosDados
                }
            })
        });

        if (!resposta.ok) {
            msgSalvar.className = "mensagem-status erro";
            msgSalvar.textContent = "Erro ao salvar alterações no servidor. Tente novamente.";
            return;
        }

        dadosAtuais = novosDados;
        modoEdicao = false;
        document.getElementById("btn-alterar").style.display = "inline-block";
        document.getElementById("btn-salvar").style.display = "none";
        document.getElementById("btn-cancelar").style.display = "none";
        msgSalvar.className = "mensagem-status sucesso";
        msgSalvar.textContent = "Dados salvos com sucesso.";

        renderizarBoletim();

    } catch (erro) {
        msgSalvar.className = "mensagem-status erro";
        msgSalvar.textContent = "Falha na conexão ao salvar. Seus dados não foram perdidos.";
    }
}