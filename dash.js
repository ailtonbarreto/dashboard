window.addEventListener('load', () => {

    const spinner = document.getElementById("loading");
    const ano = document.getElementById("ano");
    const mes = document.getElementById("mes");

    let qtd_mov = document.getElementById('qtd_mov');
    let valor_entrada = document.getElementById('valor_entrada');
    let valor_saida = document.getElementById('valor_saida');
    let saldoElemento = document.getElementById('saldo');

    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl4SLAwFx9XL2z6TusTTdbqj05Rq7kn4JR_xwlCcNhVmtjj4eBJnT9NVnQjSoFWHLvtjhVz1WKL73m/pub?gid=0&single=true&output=csv";

    mes.value = String(new Date().getMonth() + 1).padStart(2, '0');

    const myChart = echarts.init(document.getElementById('pie'));
    const myLineChart = echarts.init(document.getElementById('line'));
    const myBarChartEntradas = echarts.init(document.getElementById('bar_entrada'));
    const myBarChartSaidas = echarts.init(document.getElementById('bar_saida'));

    let movimentacoesBrutas = [];

    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function getCorRotulo() {
        return document.body.classList.contains('dark-mode-variables') ? '#FFFFFF' : '#000000';
    }

    function inicializarGraficoPizza() {
        myChart.setOption({
            color: ['#06d6a0', '#ef233c'],
            tooltip: { trigger: 'item' },
            legend: { show: false },
            series: [{
                type: 'pie',
                radius: ['40%', '60%'],
                avoidLabelOverlap: false,
                label: {
                    show: true,
                    position: 'outside',
                    color: getCorRotulo(),
                },
                labelLine: { show: true, length: 5, length2: 2 },
                data: []
            }]
        });
    }

    function atualizarGraficoPizza(dados) {
        const totais = dados.reduce((acc, mov) => {
            acc[mov.tipo] = (acc[mov.tipo] || 0) + mov.valor;
            return acc;
        }, {});

        const data = Object.keys(totais).map(tipo => ({ name: tipo, value: totais[tipo] }));

        data.sort((a, b) => {
            if (a.name.toLowerCase() === "entrada") return -1;
            if (b.name.toLowerCase() === "entrada") return 1;
            return 0;
        });


        myChart.setOption({
            series: [{
                data,
                label: { color: getCorRotulo() }
            }]
        });
    }


    function atualizarGraficoLinhas(dados) {
        const agrupado = {};

        // Função para converter "dd/mm/yyyy" para Date valido
        function parseDataBR(dataBR) {
            const [dia, mes, ano] = dataBR.split('/');
            return new Date(`${ano}-${mes}-${dia}`); // formato ISO
        }

        dados.forEach(({ data_vencimento, tipo, valor }) => {
            if (!data_vencimento) return;

            const dataObj = parseDataBR(data_vencimento);
            if (isNaN(dataObj)) return;

            const dia = dataObj.getUTCDate().toString().padStart(2, '0');
            if (!agrupado[dia]) agrupado[dia] = { entrada: 0, saida: 0 };

            const tipoFormatado = tipo.trim().toUpperCase();

            if (tipoFormatado === 'ENTRADA') agrupado[dia].entrada += valor;
            else if (tipoFormatado === 'SAÍDA') agrupado[dia].saida += valor;
        });

        const diasComMovimentacao = Object.keys(agrupado).sort((a, b) => parseInt(a) - parseInt(b));

        if (diasComMovimentacao.length === 0) {
            myLineChart.setOption({
                xAxis: { data: [] },
                series: [
                    { data: [] },
                    { data: [] }
                ]
            });
            return;
        }

        const ultimoDia = parseInt(diasComMovimentacao[diasComMovimentacao.length - 1]);

        const dias = [];
        for (let d = 1; d <= ultimoDia; d++) {
            const diaStr = d.toString().padStart(2, '0');
            dias.push(diaStr);
            if (!agrupado[diaStr]) {
                agrupado[diaStr] = { entrada: 0, saida: 0 };
            }
        }

        let acumuladoEntradas = 0;
        let acumuladoSaidas = 0;

        const entradas = [];
        const saidas = [];

        dias.forEach(dia => {
            acumuladoEntradas += agrupado[dia].entrada;
            acumuladoSaidas += agrupado[dia].saida;

            entradas.push(acumuladoEntradas);
            saidas.push(acumuladoSaidas);
        });

        function formatarMoeda(valor) {
            return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        myLineChart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                formatter: params => {
                    return `<strong>Dia: ${params[0].axisValue}</strong><br>` +
                        params.map(p => `${p.seriesName}: ${formatarMoeda(p.data)}`).join("<br>");
                }
            },
            legend: { data: ['Entradas', 'Saídas'], show: false },
            grid: { left: '-3%', right: '2%', bottom: '8%', top: '1%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: dias, axisLabel: { color: getCorRotulo() } },
            yAxis: { type: 'value', show: false },
            series: [
                {
                    name: 'Entradas',
                    type: 'line',
                    symbol: 'none',
                    itemStyle: { color: '#06d6a0' },
                    areaStyle: { color: '#06d6a0' },
                    lineStyle: { color: '#06d6a0' },
                    data: entradas
                },
                {
                    name: 'Saídas',
                    type: 'line',
                    symbol: 'none',
                    itemStyle: { color: 'red' },
                    areaStyle: { color: 'red' },
                    lineStyle: { color: 'red' },
                    data: saidas
                }
            ]
        });
    }

    function atualizarGraficoBarrasEntradas(dados) {
        const agrupado = {};
        dados.forEach(({ descricao, tipo, valor }) => {
            if (tipo.toUpperCase() === 'ENTRADA') {
                if (!agrupado[descricao]) agrupado[descricao] = 0;
                agrupado[descricao] += valor;
            }
        });

        const topClientes = Object.entries(agrupado)
            .sort((b, a) => b[1] - a[1])
            .slice(0, 10);

        const clientes = topClientes.map(([nome]) => nome);
        const valores = topClientes.map(([_, valor]) => valor);

        myBarChartEntradas.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: params => {
                    const p = params[0];
                    return `${p.name}: ${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                }
            },
            grid: { left: '25%', right: '15%', bottom: '10%', top: '5%', containLabel: false },
            xAxis: {
                show: false,
                type: 'value',
                axisLabel: { formatter: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: getCorRotulo() }
            },
            yAxis: { type: 'category', data: clientes, axisLabel: { color: getCorRotulo(), fontSize: 13 } },
            series: [{
                type: 'bar',
                data: valores,
                itemStyle: { color: '#06d6a0' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: p => p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    color: getCorRotulo()
                }
            }]
        });
    }

    function atualizarGraficoBarrasSaidas(dados) {
        const agrupado = {};
        dados.forEach(({ descricao, tipo, valor }) => {
            if (tipo.toUpperCase() === 'SAÍDA') {
                if (!agrupado[descricao]) agrupado[descricao] = 0;
                agrupado[descricao] += valor;
            }
        });

        const topClientes = Object.entries(agrupado)
            .sort((b, a) => b[1] - a[1])
            .slice(0, 10);

        const clientes = topClientes.map(([nome]) => nome);
        const valores = topClientes.map(([_, valor]) => valor);

        myBarChartSaidas.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: params => {
                    const p = params[0];
                    return `${p.name}: ${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                }
            },
            grid: { left: '25%', right: '15%', bottom: '10%', top: '5%', containLabel: false },
            xAxis: {
                show: false,
                type: 'value',
                axisLabel: { formatter: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: getCorRotulo() }
            },
            yAxis: { type: 'category', data: clientes, axisLabel: { color: getCorRotulo(), fontSize: 13 } },
            series: [{
                type: 'bar',
                data: valores,
                itemStyle: { color: '#ef233c' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: p => p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    color: getCorRotulo()
                }
            }]
        });
    }

    function atualizarTabela() {
        const dados = filtrarDados();
        const container = document.getElementById('tabela-movimentacoes');

        if (!dados.length) {
            container.innerHTML = "<p style='color:#888'>Nenhum dado encontrado para este mês e ano.</p>";
            return;
        }

        // Ordena os dados pela data_vencimento (assumindo formato 'YYYY-MM-DD' ou 'DD/MM/YYYY')
        const dadosOrdenados = [...dados].sort((a, b) => {
            const dataA = new Date(a.data_vencimento.split('/').reverse().join('-'));
            const dataB = new Date(b.data_vencimento.split('/').reverse().join('-'));
            return dataA - dataB;
        });

        let html = `
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th class= "hide-mobile">Tipo</th>
                <th class= "hide-mobile">Cliente/Fornecedor</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
    `;

        dadosOrdenados.forEach(item => {
            const corTipo = item.tipo.trim().toUpperCase() === 'ENTRADA'
                ? '#06d6a0'
                : '#ef233c';

            const corStatus = ['A RECEBER', 'A PAGAR'].includes(item.status.trim().toUpperCase())
                ? '#ef233c'
                : '#06d6a0';

            html += `
        <tr>
            <td>${item.data_vencimento}</td>
            <td style="color:${corTipo};font-weight:bold;" class= "hide-mobile">${item.tipo}</td>
            <td class= "hide-mobile">${item.cliente_fornecedor}</td>
            <td>${item.descricao}</td>
            <td>${item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td style="color:${corStatus};font-weight:bold;">${item.status}</td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }


    function filtrarDados() {
        return movimentacoesBrutas.filter(item =>
            item.ano === ano.value &&
            item.mes === mes.value
        );
    }

    function contarElementosFiltrados() {
        const filtrados = filtrarDados();
        qtd_mov.innerHTML = filtrados.length;
        return filtrados.length;
    }

    function somarEntradasBruto() {
        const filtrados = filtrarDados();
        return filtrados
            .filter(item => item.tipo.toUpperCase() === "ENTRADA")
            .reduce((acc, item) => acc + item.valor, 0);
    }

    function somarSaidasBruto() {
        const filtrados = filtrarDados();
        return filtrados
            .filter(item => item.tipo.toUpperCase() === "SAÍDA")
            .reduce((acc, item) => acc + item.valor, 0);
    }

    function atualizarValorEntrada() {
        const soma = somarEntradasBruto();
        valor_entrada.innerHTML = soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function atualizarValorSaida() {
        const soma = somarSaidasBruto();
        valor_saida.innerHTML = soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function ColorirSaldo() {

        const saldo = somarEntradasBruto() - somarSaidasBruto();

        let color_saldo;

        if (saldo >= 0) {

            color_saldo = "#00bbf9";

        }

        else {
            color_saldo = 'red';
        }

        saldoElemento.style.color = color_saldo;

    }

    function calcularSaldo() {
        const saldo = somarEntradasBruto() - somarSaidasBruto();
        return saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function atualizarSaldo() {
        saldoElemento.innerHTML = calcularSaldo();
    }


    function atualizarGraficos() {
        const dados_filtrados = filtrarDados();

        atualizarGraficoPizza(dados_filtrados);
        atualizarGraficoLinhas(dados_filtrados);
        atualizarGraficoBarrasEntradas(dados_filtrados);
        atualizarGraficoBarrasSaidas(dados_filtrados);

        contarElementosFiltrados();
        atualizarValorEntrada();
        atualizarValorSaida();
        atualizarSaldo();
        atualizarTabela(dados_filtrados);
        ColorirSaldo();
    }


    function observarModoEscuro() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {

                    const cor = getCorRotulo();

                    myChart.setOption({
                        series: [{
                            label: { color: cor }
                        }]
                    });

                    myLineChart.setOption({
                        xAxis: { axisLabel: { color: cor } }
                    });

                    myBarChartEntradas.setOption({
                        xAxis: { axisLabel: { color: cor } },
                        yAxis: { axisLabel: { color: cor } },
                        series: [{
                            label: { color: cor }
                        }]
                    });

                    myBarChartSaidas.setOption({
                        xAxis: { axisLabel: { color: cor } },
                        yAxis: { axisLabel: { color: cor } },
                        series: [{
                            label: { color: cor }
                        }]
                    });
                }
            });
        });

        observer.observe(document.body, { attributes: true });
    }

    inicializarGraficoPizza();
    observarModoEscuro();

    fetch(url)


        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar planilha");
            return response.text();
        })
        .then(csvText => {
            const resultados = Papa.parse(csvText, {
                header: true,
                dynamicTyping: false,
                skipEmptyLines: true,
                transformHeader: h => h.trim().toLowerCase()
            });


            movimentacoesBrutas = resultados.data.map(row => {

                const dataStr = row['data']?.trim() || '';
                let ano = '', mes = '';

                if (dataStr.includes('/')) {
                    const [, m, a] = dataStr.split('/');
                    ano = a;
                    mes = m.padStart(2, '0');
                } else if (dataStr.includes('-')) {
                    const [a, m] = dataStr.split('-');
                    ano = a;
                    mes = m.padStart(2, '0');
                }

                return {
                    tipo: row['tipo'],
                    cliente_fornecedor: row['cliente/fornecedor'],
                    descricao: row['descrição'],
                    data_vencimento: dataStr,
                    valor: parseFloat(row['valor'].replace(/\./g, '').replace(',', '.')) || 0,
                    status: row['status'],
                    ano,
                    mes
                };
            });


            atualizarGraficos();


        })
        .catch(error => console.error(error));

    ano.addEventListener("change", atualizarGraficos);
    mes.addEventListener("change", atualizarGraficos);

});
