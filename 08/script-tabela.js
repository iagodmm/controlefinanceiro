let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
const tabelaGastos = document.getElementById('tabela-gastos');
const totalGasto = document.getElementById('total-gasto');
const filtro = document.getElementById('filtro');

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

function filtrarGastos(tipo) {
    const hoje = new Date();
    return gastos.filter(gasto => {
        const data = new Date(gasto.data);
        switch (tipo) {
            case 'diario':
                return data.toDateString() === hoje.toDateString();
            case 'semanal':
                const semanaInicio = getWeekStart(hoje);
                return data >= semanaInicio && data <= new Date(semanaInicio.getTime() + 6 * 24 * 60 * 60 * 1000);
            case 'mensal':
                return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
            case 'trimestral':
                return data >= new Date(hoje.setMonth(hoje.getMonth() - 3));
            case 'semestral':
                return data >= new Date(hoje.setMonth(hoje.getMonth() - 6));
            case 'anual':
                return data.getFullYear() === hoje.getFullYear();
            case 'total':
                return true;
            default:
                return true;
        }
    });
}

function atualizarTotal(filtrados) {
    const total = filtrados.reduce((acc, gasto) => {
        return gasto.tipo === 'credito' ? acc + parseFloat(gasto.valor) : (gasto.pago ? acc - parseFloat(gasto.valor) : acc);
    }, 0);
    totalGasto.textContent = total.toFixed(2);
}

function renderizarTabela() {
    const tipoFiltro = filtro.value;
    const gastosFiltrados = filtrarGastos(tipoFiltro);
    tabelaGastos.innerHTML = '';
    let ultimaData = null;
    let par = true;

    gastosFiltrados.forEach((gasto, index) => {
        if (ultimaData !== gasto.data) {
            par = !par;
            ultimaData = gasto.data;
        }
        const tr = document.createElement('tr');
        tr.classList.add(par ? 'data-par' : 'data-impar');
        tr.innerHTML = `
            <td>${gasto.descricao}</td>
            <td>${gasto.tipo === 'credito' ? 'Crédito' : 'Débito'}</td>
            <td>${gasto.categoria}</td>
            <td>${parseFloat(gasto.valor).toFixed(2)}</td>
            <td>${gasto.data}</td>
            <td>${gasto.conta || 'Nenhuma'}</td>
            <td>${gasto.parcelas ? `${gasto.parcelaAtual}/${gasto.parcelas}` : '-'}</td>
            <td>${gasto.fatura || '-'}</td>
            <td><input type="checkbox" ${gasto.pago ? 'checked' : ''} onchange="togglePago(${index})" ${gasto.tipo === 'credito' ? 'disabled' : ''}></td>
            <td>
                <button class="btn-editar" onclick="editarGasto(${index})">Editar</button>
                <button class="btn-apagar" onclick="apagarGasto(${index})">Apagar</button>
            </td>
        `;
        tabelaGastos.appendChild(tr);
    });
    atualizarTotal(gastosFiltrados);
}

function togglePago(index) {
    gastos[index].pago = !gastos[index].pago;
    const conta = gastos[index].conta;
    if (conta) {
        const [contaNome, cartaoNome] = conta.split(':');
        const contaSelecionada = contas.find(c => c.nome === contaNome);
        if (gastos[index].pago && gastos[index].tipo === 'debito') {
            contaSelecionada.saldo = parseFloat(contaSelecionada.saldo) - parseFloat(gastos[index].valor);
            const historico = cartaoNome ? contaSelecionada.cartoes.find(c => c.nome === cartaoNome).historico : contaSelecionada.historico;
            historico.push({
                tipo: 'Pagamento de Parcela',
                valor: gastos[index].valor,
                data: new Date().toISOString().split('T')[0],
                descricao: `${gastos[index].descricao} (Parcela ${gastos[index].parcelaAtual}/${gastos[index].parcelas})`
            });
        }
        localStorage.setItem('contas', JSON.stringify(contas));
    }
    localStorage.setItem('gastos', JSON.stringify(gastos));
    renderizarTabela();
}

function editarGasto(index) {
    localStorage.setItem('editIndex', index);
    window.location.href = 'adicionar-gastos.html';
}

function apagarGasto(index) {
    if (confirm('Deseja apagar esta transação?')) {
        const transacao = gastos[index];
        if (transacao.conta) {
            const [contaNome, cartaoNome] = transacao.conta.split(':');
            const conta = contas.find(c => c.nome === contaNome);
            const cartao = cartaoNome ? conta.cartoes.find(c => c.nome === cartaoNome) : null;
            if (transacao.tipo === 'credito') {
                conta.saldo = parseFloat(conta.saldo) - parseFloat(transacao.valor);
                conta.historico.push({
                    tipo: 'Estorno de Crédito',
                    valor: transacao.valor,
                    data: new Date().toISOString().split('T')[0],
                    descricao: `Estorno de ${transacao.descricao}`
                });
            } else if (!transacao.pago && (!cartao || cartao.tipo === 'debito')) {
                conta.saldo = parseFloat(conta.saldo) + parseFloat(transacao.valor);
                (cartao ? cartao : conta).historico.push({
                    tipo: 'Estorno de Débito',
                    valor: transacao.valor,
                    data: new Date().toISOString().split('T')[0],
                    descricao: `Estorno de ${transacao.descricao}`
                });
            }
            localStorage.setItem('contas', JSON.stringify(contas));
        }
        gastos.splice(index, 1);
        localStorage.setItem('gastos', JSON.stringify(gastos));
        renderizarTabela();
    }
}

filtro.addEventListener('change', renderizarTabela);
renderizarTabela();