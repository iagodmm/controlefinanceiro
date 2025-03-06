let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || [
    "Carro", "Refeição", "Casa", "Lazer", "Compras"
];
let contas = JSON.parse(localStorage.getItem('contas')) || [];

const formGasto = document.getElementById('form-gasto');
const editIndex = document.getElementById('edit-index');
const categoriasDiv = document.getElementById('categorias');
const novaCategoria = document.getElementById('nova-categoria');
const addCategoriaBtn = document.getElementById('add-categoria');
const removeCategoriaBtn = document.getElementById('remove-categoria');
const selectConta = document.getElementById('conta');
const tipoSelect = document.getElementById('tipo');
const cartaoCreditoOptions = document.getElementById('cartao-credito-options');
const faturaSelect = document.getElementById('fatura');
const faturaManualDiv = document.getElementById('fatura-manual');
const parcelasInput = document.getElementById('parcelas');
const resumoParcelasDiv = document.getElementById('resumo-parcelas');
let selectedCategoria = null;

function atualizarCategorias() {
    categoriasDiv.innerHTML = '';
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.classList.add('categoria-item');
        div.textContent = cat;
        div.addEventListener('click', () => {
            document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('selected'));
            div.classList.add('selected');
            selectedCategoria = cat;
        });
        categoriasDiv.appendChild(div);
    });
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

function atualizarContas() {
    selectConta.innerHTML = '<option value="">Nenhuma</option>';
    contas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.nome;
        option.textContent = `${conta.nome} (${conta.instituicao}) - R$ ${parseFloat(conta.saldo).toFixed(2)}`;
        selectConta.appendChild(option);
        if (conta.cartoes) {
            conta.cartoes.forEach(cartao => {
                const cartaoOption = document.createElement('option');
                cartaoOption.value = `${conta.nome}:${cartao.nome}`;
                cartaoOption.textContent = `${cartao.nome} (${cartao.tipo === 'credito' ? 'Crédito' : 'Débito'}) - ${conta.nome}`;
                selectConta.appendChild(cartaoOption);
            });
        }
    });
}

function atualizarResumoParcelas() {
    const valor = parseFloat(document.getElementById('valor').value) || 0;
    const parcelas = parseInt(parcelasInput.value) || 1;
    const data = document.getElementById('data').value;
    const fatura = faturaSelect.value === 'atual' ? calcularFaturaAtual(getFechamentoCartao()) : document.getElementById('fatura-data').value;

    if (!data || !fatura) {
        resumoParcelasDiv.innerHTML = 'Preencha a data e a fatura para ver o resumo.';
        return;
    }

    const valorParcela = valor / parcelas;
    let resumo = '<strong>Resumo das Parcelas:</strong><ul>';
    const dataInicio = new Date(fatura);

    for (let i = 0; i < parcelas; i++) {
        const dataParcela = new Date(dataInicio);
        dataParcela.setMonth(dataParcela.getMonth() + i);
        resumo += `<li>${dataParcela.toLocaleDateString('pt-BR')} - R$ ${valorParcela.toFixed(2)}</li>`;
    }
    resumo += '</ul>';
    resumoParcelasDiv.innerHTML = resumo;
}

function getFechamentoCartao() {
    const conta = selectConta.value;
    if (conta.includes(':')) {
        const [contaNome, cartaoNome] = conta.split(':');
        const contaSelecionada = contas.find(c => c.nome === contaNome);
        const cartao = contaSelecionada.cartoes.find(c => c.nome === cartaoNome);
        return cartao.fechamento;
    }
    return 1; // Default para evitar erro
}

addCategoriaBtn.addEventListener('click', () => {
    const nova = novaCategoria.value.trim();
    if (nova && !categorias.includes(nova)) {
        categorias.push(nova);
        atualizarCategorias();
        novaCategoria.value = '';
    }
});

removeCategoriaBtn.addEventListener('click', () => {
    if (selectedCategoria && confirm(`Deseja remover a categoria "${selectedCategoria}"?`)) {
        if (gastos.some(g => g.categoria === selectedCategoria)) {
            alert('Não é possível remover uma categoria que está sendo usada em transações.');
            return;
        }
        categorias = categorias.filter(cat => cat !== selectedCategoria);
        selectedCategoria = null;
        atualizarCategorias();
        document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('selected'));
    }
});

tipoSelect.addEventListener('change', () => {
    cartaoCreditoOptions.style.display = tipoSelect.value === 'debito' && selectConta.value.includes(':') && contas.some(c => c.cartoes && c.cartoes.some(cart => `${c.nome}:${cart.nome}` === selectConta.value && cart.tipo === 'credito')) ? 'block' : 'none';
    if (cartaoCreditoOptions.style.display === 'block') atualizarResumoParcelas();
});

selectConta.addEventListener('change', () => {
    cartaoCreditoOptions.style.display = tipoSelect.value === 'debito' && selectConta.value.includes(':') && contas.some(c => c.cartoes && c.cartoes.some(cart => `${c.nome}:${cart.nome}` === selectConta.value && cart.tipo === 'credito')) ? 'block' : 'none';
    if (cartaoCreditoOptions.style.display === 'block') atualizarResumoParcelas();
});

faturaSelect.addEventListener('change', () => {
    faturaManualDiv.style.display = faturaSelect.value === 'manual' ? 'block' : 'none';
    atualizarResumoParcelas();
});

document.getElementById('data').addEventListener('change', atualizarResumoParcelas);
document.getElementById('valor').addEventListener('input', atualizarResumoParcelas);
document.getElementById('fatura-data').addEventListener('change', atualizarResumoParcelas);

formGasto.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const descricao = document.getElementById('descricao').value;
    const tipo = document.getElementById('tipo').value;
    const valor = document.getElementById('valor').value;
    const data = document.getElementById('data').value;
    const conta = document.getElementById('conta').value;
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const fatura = document.getElementById('fatura').value;
    const faturaData = document.getElementById('fatura-data').value;
    const index = editIndex.value;

    if (!selectedCategoria) {
        alert('Selecione uma categoria!');
        return;
    }

    let transacao = { descricao, tipo, categoria: selectedCategoria, valor, data, conta: conta || null, pago: false };
    let parcelasArray = [];

    if (conta) {
        const [contaNome, cartaoNome] = conta.split(':');
        const contaSelecionada = contas.find(c => c.nome === contaNome);
        let cartaoSelecionado = cartaoNome ? contaSelecionada.cartoes.find(c => c.nome === cartaoNome) : null;

        if (tipo === 'debito' && !cartaoNome) {
            if (parseFloat(contaSelecionada.saldo) < parseFloat(valor)) {
                alert('Saldo insuficiente na conta selecionada para débito!');
                return;
            }
            contaSelecionada.saldo = parseFloat(contaSelecionada.saldo) - parseFloat(valor);
            contaSelecionada.historico = contaSelecionada.historico || [];
            contaSelecionada.historico.push({
                tipo: 'Débito',
                valor: valor,
                data: new Date().toISOString().split('T')[0],
                descricao: descricao
            });
        } else if (tipo === 'credito') {
            contaSelecionada.saldo = parseFloat(contaSelecionada.saldo) + parseFloat(valor);
            contaSelecionada.historico = contaSelecionada.historico || [];
            contaSelecionada.historico.push({
                tipo: 'Crédito',
                valor: valor,
                data: new Date().toISOString().split('T')[0],
                descricao: descricao
            });
        } else if (tipo === 'debito' && cartaoNome && cartaoSelecionado.tipo === 'credito') {
            const valorParcela = parseFloat(valor) / parcelas;
            transacao.parcelas = parcelas;
            transacao.valorTotal = parseFloat(valor);
            transacao.valor = valorParcela;
            transacao.fatura = fatura === 'atual' ? calcularFaturaAtual(cartaoSelecionado.fechamento) : faturaData;

            parcelasArray = Array.from({ length: parcelas }, (_, i) => {
                const parcelaData = new Date(transacao.fatura);
                parcelaData.setMonth(parcelaData.getMonth() + i);
                return {
                    ...transacao,
                    parcelaAtual: i + 1,
                    data: parcelaData.toISOString().split('T')[0]
                };
            });

            cartaoSelecionado.historico = cartaoSelecionado.historico || [];
            cartaoSelecionada.historico.push({
                tipo: 'Débito (Crédito)',
                valor: valor,
                data: new Date().toISOString().split('T')[0],
                descricao: `${descricao} (${parcelas}x)`
            });
        } else if (tipo === 'debito' && cartaoNome && cartaoSelecionado.tipo === 'debito') {
            if (parseFloat(contaSelecionada.saldo) < parseFloat(valor)) {
                alert('Saldo insuficiente na conta selecionada para débito!');
                return;
            }
            contaSelecionada.saldo = parseFloat(contaSelecionada.saldo) - parseFloat(valor);
            cartaoSelecionado.historico = cartaoSelecionado.historico || [];
            cartaoSelecionado.historico.push({
                tipo: 'Débito',
                valor: valor,
                data: new Date().toISOString().split('T')[0],
                descricao: descricao
            });
        }
        localStorage.setItem('contas', JSON.stringify(contas));
    }

    if (index === '') {
        if (parcelasArray.length > 0) {
            gastos.push(...parcelasArray);
        } else {
            gastos.push(transacao);
        }
    } else {
        const oldTransacao = gastos[index];
        if (oldTransacao.conta) {
            const [oldContaNome, oldCartaoNome] = oldTransacao.conta.split(':');
            const oldConta = contas.find(c => c.nome === oldContaNome);
            const oldCartao = oldCartaoNome ? oldConta.cartoes.find(c => c.nome === oldCartaoNome) : null;
            if (oldTransacao.tipo === 'credito') {
                oldConta.saldo = parseFloat(oldConta.saldo) - parseFloat(oldTransacao.valor);
            } else if (!oldCartao || oldCartao.tipo === 'debito') {
                oldConta.saldo = parseFloat(oldConta.saldo) + parseFloat(oldTransacao.valor);
            }
        }
        gastos[index] = transacao; // Simplificação: edição não recria parcelas
        editIndex.value = '';
    }

    localStorage.setItem('gastos', JSON.stringify(gastos));
    this.reset();
    selectedCategoria = null;
    document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('selected'));
    cartaoCreditoOptions.style.display = 'none';
    resumoParcelasDiv.innerHTML = '';
    atualizarContas();
    alert('Transação salva com sucesso!');
});

function calcularFaturaAtual(fechamento) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    let fatura = new Date(hoje);
    if (diaAtual > fechamento) {
        fatura.setMonth(fatura.getMonth() + 1);
    }
    fatura.setDate(fechamento);
    return fatura.toISOString().split('T')[0];
}

atualizarCategorias();
atualizarContas();

const editIdx = localStorage.getItem('editIndex');
if (editIdx !== null) {
    const transacao = gastos[parseInt(editIdx)];
    document.getElementById('descricao').value = transacao.descricao;
    document.getElementById('tipo').value = transacao.tipo;
    document.getElementById('valor').value = transacao.valorTotal || transacao.valor;
    document.getElementById('data').value = transacao.data;
    document.getElementById('conta').value = transacao.conta || '';
    document.getElementById('parcelas').value = transacao.parcelas || 1;
    document.getElementById('fatura').value = transacao.fatura ? 'manual' : 'atual';
    document.getElementById('fatura-data').value = transacao.fatura || '';
    editIndex.value = editIdx;
    selectedCategoria = transacao.categoria;
    atualizarCategorias();
    document.querySelectorAll('.categoria-item').forEach(item => {
        if (item.textContent === transacao.categoria) item.classList.add('selected');
    });
    cartaoCreditoOptions.style.display = transacao.conta && transacao.conta.includes(':') && contas.some(c => c.cartoes && c.cartoes.some(cart => `${c.nome}:${cart.nome}` === transacao.conta && cart.tipo === 'credito')) ? 'block' : 'none';
    faturaManualDiv.style.display = transacao.fatura ? 'block' : 'none';
    atualizarResumoParcelas();
    localStorage.removeItem('editIndex');
}