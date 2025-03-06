let contas = JSON.parse(localStorage.getItem('contas')) || [];

const formConta = document.getElementById('form-conta');
const editContaIndex = document.getElementById('edit-conta-index');
const tabelaContas = document.getElementById('tabela-contas');
const formCartao = document.getElementById('form-cartao');
const tabelaCartoes = document.getElementById('tabela-cartoes');
const historicoContas = document.getElementById('historico-contas');
const tipoCartaoSelect = document.getElementById('tipo-cartao');
const creditoOptions = document.getElementById('credito-options');
const contaCartaoSelect = document.getElementById('conta-cartao');

function atualizarContasSelect() {
    contaCartaoSelect.innerHTML = '';
    contas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.nome;
        option.textContent = `${conta.nome} (${conta.instituicao})`;
        contaCartaoSelect.appendChild(option);
    });
}

function renderizarContas() {
    tabelaContas.innerHTML = '';
    contas.forEach((conta, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${conta.nome}</td>
            <td>${conta.instituicao}</td>
            <td>${parseFloat(conta.saldo).toFixed(2)}</td>
            <td>
                <button class="btn-editar" onclick="editarConta(${index})">Editar</button>
                <button class="btn-apagar" onclick="apagarConta(${index})">Apagar</button>
            </td>
        `;
        tabelaContas.appendChild(tr);
    });

    tabelaCartoes.innerHTML = '';
    contas.forEach(conta => {
        if (conta.cartoes) {
            conta.cartoes.forEach((cartao, cartaoIndex) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${conta.nome}</td>
                    <td>${cartao.nome}</td>
                    <td>${cartao.tipo === 'credito' ? 'Crédito' : 'Débito'}</td>
                    <td>${cartao.limite ? parseFloat(cartao.limite).toFixed(2) : '-'}</td>
                    <td>${cartao.fechamento || '-'}</td>
                    <td>
                        <button class="btn-apagar" onclick="apagarCartao('${conta.nome}', ${cartaoIndex})">Apagar</button>
                    </td>
                `;
                tabelaCartoes.appendChild(tr);
            });
        }
    });

    historicoContas.innerHTML = '';
    contas.forEach(conta => {
        if (conta.historico) {
            conta.historico.forEach(transacao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${conta.nome}</td>
                    <td>${transacao.tipo}</td>
                    <td>${parseFloat(transacao.valor).toFixed(2)}</td>
                    <td>${transacao.data}</td>
                    <td>${transacao.descricao}</td>
                `;
                historicoContas.appendChild(tr);
            });
        }
        if (conta.cartoes) {
            conta.cartoes.forEach(cartao => {
                if (cartao.historico) {
                    cartao.historico.forEach(transacao => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${conta.nome}:${cartao.nome}</td>
                            <td>${transacao.tipo}</td>
                            <td>${parseFloat(transacao.valor).toFixed(2)}</td>
                            <td>${transacao.data}</td>
                            <td>${transacao.descricao}</td>
                        `;
                        historicoContas.appendChild(tr);
                    });
                }
            });
        }
    });
}

formConta.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome-conta').value;
    const instituicao = document.getElementById('instituicao').value;
    const saldo = document.getElementById('saldo').value;
    const index = editContaIndex.value;

    const conta = { nome, instituicao, saldo: parseFloat(saldo), historico: [], cartoes: [] };

    if (index === '') {
        contas.push(conta);
    } else {
        conta.historico = contas[index].historico;
        conta.cartoes = contas[index].cartoes;
        contas[index] = conta;
        editContaIndex.value = '';
    }

    localStorage.setItem('contas', JSON.stringify(contas));
    this.reset();
    atualizarContasSelect();
    renderizarContas();
});

tipoCartaoSelect.addEventListener('change', () => {
    creditoOptions.style.display = tipoCartaoSelect.value === 'credito' ? 'block' : 'none';
});

formCartao.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const contaNome = document.getElementById('conta-cartao').value;
    const nome = document.getElementById('nome-cartao').value;
    const tipo = document.getElementById('tipo-cartao').value;
    const limite = document.getElementById('limite').value;
    const fechamento = document.getElementById('fechamento').value;

    const cartao = { nome, tipo };
    if (tipo === 'credito') {
        cartao.limite = parseFloat(limite);
        cartao.fechamento = parseInt(fechamento);
    }

    const conta = contas.find(c => c.nome === contaNome);
    conta.cartoes = conta.cartoes || [];
    conta.cartoes.push(cartao);

    localStorage.setItem('contas', JSON.stringify(contas));
    this.reset();
    creditoOptions.style.display = 'none';
    renderizarContas();
});

function editarConta(index) {
    const conta = contas[index];
    document.getElementById('nome-conta').value = conta.nome;
    document.getElementById('instituicao').value = conta.instituicao;
    document.getElementById('saldo').value = conta.saldo;
    editContaIndex.value = index;
}

function apagarConta(index) {
    if (confirm('Deseja apagar esta conta e seus cartões?')) {
        contas.splice(index, 1);
        localStorage.setItem('contas', JSON.stringify(contas));
        atualizarContasSelect();
        renderizarContas();
    }
}

function apagarCartao(contaNome, cartaoIndex) {
    if (confirm('Deseja apagar este cartão?')) {
        const conta = contas.find(c => c.nome === contaNome);
        conta.cartoes.splice(cartaoIndex, 1);
        localStorage.setItem('contas', JSON.stringify(contas));
        renderizarContas();
    }
}

atualizarContasSelect();
renderizarContas();