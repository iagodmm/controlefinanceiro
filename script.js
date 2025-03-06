let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
const totalGasto = document.getElementById('total-gasto');

function atualizarTotal() {
    const total = gastos.reduce((acc, gasto) => {
        return gasto.tipo === 'credito' ? acc + parseFloat(gasto.valor) : acc - parseFloat(gasto.valorTotal || gasto.valor);
    }, 0);
    totalGasto.textContent = total.toFixed(2);
}

atualizarTotal();