let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

function agruparPorDia() {
    const porDia = {};
    gastos.forEach(gasto => {
        const data = gasto.data;
        porDia[data] = (porDia[data] || 0) + (gasto.tipo === 'credito' ? parseFloat(gasto.valor) : (gasto.pago ? -parseFloat(gasto.valor) : 0));
    });
    return porDia;
}

function agruparPorMes() {
    const porMes = {};
    gastos.forEach(gasto => {
        const mes = gasto.data.slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + (gasto.tipo === 'credito' ? parseFloat(gasto.valor) : (gasto.pago ? -parseFloat(gasto.valor) : 0));
    });
    return porMes;
}

function agruparPorCategoria() {
    const porCategoria = {};
    gastos.forEach(gasto => {
        const cat = gasto.categoria;
        porCategoria[cat] = (porCategoria[cat] || 0) + (gasto.tipo === 'credito' ? parseFloat(gasto.valor) : (gasto.pago ? -parseFloat(gasto.valor) : 0));
    });
    return porCategoria;
}

const diarioData = agruparPorDia();
new Chart(document.getElementById('grafico-diario'), {
    type: 'line',
    data: {
        labels: Object.keys(diarioData),
        datasets: [{
            label: 'Transações Diárias (R$)',
            data: Object.values(diarioData),
            borderColor: '#3498db',
            fill: false
        }]
    },
    options: { scales: { y: { beginAtZero: true } } }
});

const mensalData = agruparPorMes();
new Chart(document.getElementById('grafico-mensal'), {
    type: 'bar',
    data: {
        labels: Object.keys(mensalData),
        datasets: [{
            label: 'Transações Mensais (R$)',
            data: Object.values(mensalData),
            backgroundColor: '#2ecc71'
        }]
    },
    options: { scales: { y: { beginAtZero: true } } }
});

const categoriaData = agruparPorCategoria();
new Chart(document.getElementById('grafico-total'), {
    type: 'pie',
    data: {
        labels: Object.keys(categoriaData),
        datasets: [{
            label: 'Total por Categoria (R$)',
            data: Object.values(categoriaData),
            backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6']
        }]
    }
});