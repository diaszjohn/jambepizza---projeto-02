document.addEventListener('DOMContentLoaded', () => {
    const cardsProdutos = document.querySelectorAll('.card');
    const selectBairro = document.getElementById('bairro');
    const checkboxesAdicionais = document.querySelectorAll('.check-adicional');
    const listaResumo = document.getElementById('lista-resumo');
    const taxaEntregaEl = document.getElementById('taxa-entrega-el');
    const valorTotalEl = document.getElementById('valor-total');
    const formWhatsapp = document.getElementById('form-whatsapp');

    const taxasBairros = {
        "pindorama": 5.00,
        "sao judas tadeu": 8.00,
        "centro/igaracu": 10.00,
        "ilha grande": 18.00,
        "nassau": 14.00,
        "demais": 6.00
    };

    // Bloquear produtos sem estoque visualmente
    cardsProdutos.forEach(card => {
        const disponivel = card.getAttribute('data-disponivel') === 'true';
        const checkbox = card.querySelector('.check-pizza');
        const inputQtd = card.querySelector('.qtd-item');

        if (!disponivel) {
            card.style.opacity = '0.5';
            if (checkbox) checkbox.disabled = true;
            if (inputQtd) inputQtd.disabled = true;
        }
    });

    function calcularOrcamento() {
        let subtotal = 0;
        let htmlResumo = '';
        let itemSelecionadoValido = false;

        cardsProdutos.forEach(card => {
            const disponivel = card.getAttribute('data-disponivel') === 'true';
            const checkbox = card.querySelector('.check-pizza');
            const inputQtd = card.querySelector('.qtd-item');

            if (checkbox && checkbox.checked) {
                if (!disponivel) {
                    alert("Este produto está indisponível no estoque!");
                    checkbox.checked = false;
                    return;
                }

                let qtd = parseInt(inputQtd.value) || 1;
                if (qtd < 1) { qtd = 1; inputQtd.value = 1; }
                if (qtd > 5) { alert("Máximo de 5 unidades por item."); qtd = 5; inputQtd.value = 5; }

                const nome = checkbox.getAttribute('data-nome');
                const valorUnitario = parseFloat(checkbox.getAttribute('data-valor'));
                const totalItem = valorUnitario * qtd;
                
                subtotal += totalItem;
                itemSelecionadoValido = true;

                htmlResumo += `
                    <div class="linha-item-resumo">
                        <span>• ${qtd}x ${nome}</span>
                        <span>R$ ${totalItem.toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
            }
        });

        checkboxesAdicionais.forEach(chk => {
            if (chk.checked) {
                const nome = chk.getAttribute('data-nome');
                const valor = parseFloat(chk.getAttribute('data-valor'));
                subtotal += valor;
                htmlResumo += `
                    <div class="linha-item-resumo">
                        <span>• Adicional: ${nome}</span>
                        <span>R$ ${valor.toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
            }
        });

        let taxaEntrega = 0;
        const bairroEscolhido = selectBairro.value;
        if (bairroEscolhido && taxasBairros[bairroEscolhido] !== undefined) {
            taxaEntrega = taxasBairros[bairroEscolhido];
        }

        const totalGeral = subtotal + taxaEntrega;

        if (!itemSelecionadoValido) {
            htmlResumo = '<p class="placeholder-resumo">Nenhuma pizza selecionada.</p>';
        }

        if (listaResumo) listaResumo.innerHTML = htmlResumo;
        if (taxaEntregaEl) taxaEntregaEl.textContent = `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
        if (valorTotalEl) valorTotalEl.textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    }

    // Ouvintes globais para atualização dinâmica
    document.addEventListener('change', calcularOrcamento);
    document.addEventListener('input', calcularOrcamento);
    
    // Permitir clique em qualquer parte do card para marcar/desmarcar a pizza
    cardsProdutos.forEach(card => {
        card.addEventListener('click', (e) => {
            const disponivel = card.getAttribute('data-disponivel') === 'true';
            const checkbox = card.querySelector('.check-pizza');
            if (disponivel && checkbox && !e.target.classList.contains('qtd-item') && e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
                calcularOrcamento();
            }
        });
    });

    calcularOrcamento();

    // Envio para o WhatsApp
    if (formWhatsapp) {
        formWhatsapp.addEventListener('submit', (e) => {
            e.preventDefault();

            const nomeCliente = document.getElementById('nome').value.trim();
            const ruaNumero = document.getElementById('endereco').value.trim();
            const bairroSelecionado = selectBairro.value;
            const bairroTexto = selectBairro.options[selectBairro.selectedIndex].text;
            const valorTotalTexto = valorTotalEl ? valorTotalEl.textContent : 'R$ 0,00';
            const taxaTexto = taxaEntregaEl ? taxaEntregaEl.textContent : 'R$ 0,00';

            if (!nomeCliente || !bairroSelecionado || !ruaNumero) {
                alert("Por favor, preencha todos os campos obrigatórios de entrega.");
                return;
            }

            let itemValido = false;
            let itensSelecionados = [];

            cardsProdutos.forEach(card => {
                const checkbox = card.querySelector('.check-pizza');
                const inputQtd = card.querySelector('.qtd-item');
                if (checkbox && checkbox.checked) {
                    itemValido = true;
                    const qtd = inputQtd.value;
                    const nome = checkbox.getAttribute('data-nome');
                    const valorUnit = parseFloat(checkbox.getAttribute('data-valor'));
                    itensSelecionados.push(`- ${qtd}x ${nome} (R$ ${(valorUnit * qtd).toFixed(2).replace('.', ',')})`);
                }
            });

            if (!itemValido) {
                alert("Por favor, selecione pelo menos uma pizza do cardápio.");
                return;
            }

            checkboxesAdicionais.forEach(chk => {
                if (chk.checked) {
                    itensSelecionados.push(`- Adicional: ${chk.getAttribute('data-nome')} (R$ 5,00)`);
                }
            });

            const numeroWhatsApp = "5586995884824";

            let mensagem = `*🍕 NOVO PEDIDO - JAMBE PIZZA* 🍕\n\n`;
            mensagem += `👤 *Cliente:* ${nomeCliente}\n`;
            mensagem += `📍 *Endereço:* ${ruaNumero}\n`;
            mensagem += `🏘️ *Bairro:* ${bairroTexto}\n\n`;
            mensagem += `📋 *Itens:*\n${itensSelecionados.join('\n')}\n\n`;
            mensagem += `🚚 *Taxa:* ${taxaTexto}\n`;
            mensagem += `💰 *Total Geral:* ${valorTotalTexto}\n\n`;
            mensagem += `Pode confirmar o pedido?`;

            window.location.href = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        });
    }
});