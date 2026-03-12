import { ElectronicDocument, DocumentType } from '../data/electronicDocumentsData';

// Função para analisar o XML e extrair os dados relevantes
export const parseXML = (xmlContent: string): Partial<ElectronicDocument> => {
  try {
    // Verifica se o conteúdo XML é válido
    if (!xmlContent || xmlContent.trim() === '') {
      throw new Error('Conteúdo XML vazio ou inválido');
    }

    // Cria um parser XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Verifica se houve erro no parsing
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Erro ao analisar o XML: formato inválido');
    }

    // Determina o tipo de documento (NFe ou CTe)
    let tipo: DocumentType;
    let modelo: string;
    let chaveAcesso: string = '';
    let numeroDocumento: string = '';
    let serie: string = '';
    let protocoloAutorizacao: string = '';
    let dataAutorizacao: string = '';
    let emitente: any = {};
    let destinatario: any = {};
    let valorTotal: number = 0;
    let valorIcms: number | undefined;
    let valorFrete: number | undefined;
    let pesoTotal: number | undefined;
    let modalTransporte: string | undefined;

    // Verifica se é uma NFe
    const nfeNode = xmlDoc.querySelector('NFe') || xmlDoc.querySelector('nfe');
    const cteNode = xmlDoc.querySelector('CTe') || xmlDoc.querySelector('cte');

    if (nfeNode) {
      tipo = 'NFe';
      modelo = '55';

      // Extrai a chave de acesso
      const infNFeNode = xmlDoc.querySelector('infNFe') || xmlDoc.querySelector('infnfe');
      if (infNFeNode) {
        chaveAcesso = infNFeNode.getAttribute('Id')?.replace(/[^0-9]/g, '') || '';
      }

      // Extrai número e série
      const ideNode = xmlDoc.querySelector('ide') || xmlDoc.querySelector('IDE');
      if (ideNode) {
        numeroDocumento = getNodeText(ideNode, 'nNF') || getNodeText(ideNode, 'nnf') || '';
        serie = getNodeText(ideNode, 'serie') || '';
      }

      // Extrai protocolo e data de autorização
      const protNode = xmlDoc.querySelector('protNFe') || xmlDoc.querySelector('protnfe');
      if (protNode) {
        const infProtNode = protNode.querySelector('infProt') || protNode.querySelector('infprot');
        if (infProtNode) {
          protocoloAutorizacao = getNodeText(infProtNode, 'nProt') || getNodeText(infProtNode, 'nprot') || '';
          dataAutorizacao = getNodeText(infProtNode, 'dhRecbto') || getNodeText(infProtNode, 'dhrecbto') || new Date().toISOString();
        }
      }

      // Extrai dados do emitente
      const emitNode = xmlDoc.querySelector('emit') || xmlDoc.querySelector('EMIT');
      if (emitNode) {
        const cnpj = getNodeText(emitNode, 'CNPJ') || getNodeText(emitNode, 'cnpj') || '';
        const razaoSocial = getNodeText(emitNode, 'xNome') || getNodeText(emitNode, 'xnome') || '';
        const inscricaoEstadual = getNodeText(emitNode, 'IE') || getNodeText(emitNode, 'ie') || '';
        
        // Endereço do emitente
        const enderEmitNode = emitNode.querySelector('enderEmit') || emitNode.querySelector('enderemit');
        let endereco = '';
        let cidade = '';
        let uf = '';
        let cep = '';
        
        if (enderEmitNode) {
          const logradouro = getNodeText(enderEmitNode, 'xLgr') || getNodeText(enderEmitNode, 'xlgr') || '';
          const numero = getNodeText(enderEmitNode, 'nro') || '';
          const complemento = getNodeText(enderEmitNode, 'xCpl') || getNodeText(enderEmitNode, 'xcpl') || '';
          const bairro = getNodeText(enderEmitNode, 'xBairro') || getNodeText(enderEmitNode, 'xbairro') || '';
          
          endereco = `${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`;
          cidade = getNodeText(enderEmitNode, 'xMun') || getNodeText(enderEmitNode, 'xmun') || '';
          uf = getNodeText(enderEmitNode, 'UF') || getNodeText(enderEmitNode, 'uf') || '';
          cep = getNodeText(enderEmitNode, 'CEP') || getNodeText(enderEmitNode, 'cep') || '';
          
          // Formata o CEP
          if (cep && cep.length === 8) {
            cep = `${cep.substring(0, 5)}-${cep.substring(5)}`;
          }
        }
        
        emitente = {
          razaoSocial,
          cnpj,
          inscricaoEstadual,
          endereco,
          cidade,
          uf,
          cep
        };
      }

      // Extrai dados do destinatário
      const destNode = xmlDoc.querySelector('dest') || xmlDoc.querySelector('DEST');
      if (destNode) {
        const cnpjCpf = getNodeText(destNode, 'CNPJ') || getNodeText(destNode, 'cnpj') || 
                       getNodeText(destNode, 'CPF') || getNodeText(destNode, 'cpf') || '';
        const razaoSocial = getNodeText(destNode, 'xNome') || getNodeText(destNode, 'xnome') || '';
        
        // Endereço do destinatário
        const enderDestNode = destNode.querySelector('enderDest') || destNode.querySelector('enderdest');
        let endereco = '';
        let cidade = '';
        let uf = '';
        let cep = '';
        
        if (enderDestNode) {
          const logradouro = getNodeText(enderDestNode, 'xLgr') || getNodeText(enderDestNode, 'xlgr') || '';
          const numero = getNodeText(enderDestNode, 'nro') || '';
          const complemento = getNodeText(enderDestNode, 'xCpl') || getNodeText(enderDestNode, 'xcpl') || '';
          const bairro = getNodeText(enderDestNode, 'xBairro') || getNodeText(enderDestNode, 'xbairro') || '';
          
          endereco = `${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`;
          cidade = getNodeText(enderDestNode, 'xMun') || getNodeText(enderDestNode, 'xmun') || '';
          uf = getNodeText(enderDestNode, 'UF') || getNodeText(enderDestNode, 'uf') || '';
          cep = getNodeText(enderDestNode, 'CEP') || getNodeText(enderDestNode, 'cep') || '';
          
          // Formata o CEP
          if (cep && cep.length === 8) {
            cep = `${cep.substring(0, 5)}-${cep.substring(5)}`;
          }
        }
        
        destinatario = {
          razaoSocial,
          cnpjCpf,
          endereco,
          cidade,
          uf,
          cep
        };
      }

      // Extrai valores
      const totalNode = xmlDoc.querySelector('total') || xmlDoc.querySelector('TOTAL');
      if (totalNode) {
        const icmsTotNode = totalNode.querySelector('ICMSTot') || totalNode.querySelector('icmstot');
        if (icmsTotNode) {
          const vNF = getNodeText(icmsTotNode, 'vNF') || getNodeText(icmsTotNode, 'vnf') || '0';
          valorTotal = parseFloat(vNF) || 0;
          
          const vICMS = getNodeText(icmsTotNode, 'vICMS') || getNodeText(icmsTotNode, 'vicms');
          if (vICMS) {
            valorIcms = parseFloat(vICMS) || undefined;
          }
          
          const vFrete = getNodeText(icmsTotNode, 'vFrete') || getNodeText(icmsTotNode, 'vfrete');
          if (vFrete) {
            valorFrete = parseFloat(vFrete) || undefined;
          }
        }
      }
    } else if (cteNode) {
      tipo = 'CTe';
      modelo = '57';

      // Extrai a chave de acesso
      const infCTeNode = xmlDoc.querySelector('infCte') || xmlDoc.querySelector('infcte');
      if (infCTeNode) {
        chaveAcesso = infCTeNode.getAttribute('Id')?.replace(/[^0-9]/g, '') || '';
      }

      // Extrai número e série
      const ideNode = xmlDoc.querySelector('ide') || xmlDoc.querySelector('IDE');
      if (ideNode) {
        numeroDocumento = getNodeText(ideNode, 'nCT') || getNodeText(ideNode, 'nct') || '';
        serie = getNodeText(ideNode, 'serie') || '';
      }

      // Extrai protocolo e data de autorização
      const protNode = xmlDoc.querySelector('protCTe') || xmlDoc.querySelector('protcte');
      if (protNode) {
        const infProtNode = protNode.querySelector('infProt') || protNode.querySelector('infprot');
        if (infProtNode) {
          protocoloAutorizacao = getNodeText(infProtNode, 'nProt') || getNodeText(infProtNode, 'nprot') || '';
          dataAutorizacao = getNodeText(infProtNode, 'dhRecbto') || getNodeText(infProtNode, 'dhrecbto') || new Date().toISOString();
        }
      }

      // Extrai dados do emitente
      const emitNode = xmlDoc.querySelector('emit') || xmlDoc.querySelector('EMIT');
      if (emitNode) {
        const cnpj = getNodeText(emitNode, 'CNPJ') || getNodeText(emitNode, 'cnpj') || '';
        const razaoSocial = getNodeText(emitNode, 'xNome') || getNodeText(emitNode, 'xnome') || '';
        const inscricaoEstadual = getNodeText(emitNode, 'IE') || getNodeText(emitNode, 'ie') || '';
        
        // Endereço do emitente
        const enderEmitNode = emitNode.querySelector('enderEmit') || emitNode.querySelector('enderemit');
        let endereco = '';
        let cidade = '';
        let uf = '';
        let cep = '';
        
        if (enderEmitNode) {
          const logradouro = getNodeText(enderEmitNode, 'xLgr') || getNodeText(enderEmitNode, 'xlgr') || '';
          const numero = getNodeText(enderEmitNode, 'nro') || '';
          const complemento = getNodeText(enderEmitNode, 'xCpl') || getNodeText(enderEmitNode, 'xcpl') || '';
          const bairro = getNodeText(enderEmitNode, 'xBairro') || getNodeText(enderEmitNode, 'xbairro') || '';
          
          endereco = `${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`;
          cidade = getNodeText(enderEmitNode, 'xMun') || getNodeText(enderEmitNode, 'xmun') || '';
          uf = getNodeText(enderEmitNode, 'UF') || getNodeText(enderEmitNode, 'uf') || '';
          cep = getNodeText(enderEmitNode, 'CEP') || getNodeText(enderEmitNode, 'cep') || '';
          
          // Formata o CEP
          if (cep && cep.length === 8) {
            cep = `${cep.substring(0, 5)}-${cep.substring(5)}`;
          }
        }
        
        emitente = {
          razaoSocial,
          cnpj,
          inscricaoEstadual,
          endereco,
          cidade,
          uf,
          cep
        };
      }

      // Extrai dados do destinatário (tomador de serviço no caso do CTe)
      const tomNode = xmlDoc.querySelector('toma') || xmlDoc.querySelector('TOMA') || 
                     xmlDoc.querySelector('toma3') || xmlDoc.querySelector('TOMA3') ||
                     xmlDoc.querySelector('dest') || xmlDoc.querySelector('DEST');
      
      if (tomNode) {
        const cnpjCpf = getNodeText(tomNode, 'CNPJ') || getNodeText(tomNode, 'cnpj') || 
                       getNodeText(tomNode, 'CPF') || getNodeText(tomNode, 'cpf') || '';
        const razaoSocial = getNodeText(tomNode, 'xNome') || getNodeText(tomNode, 'xnome') || '';
        
        // Endereço do destinatário
        const enderTomNode = tomNode.querySelector('enderToma') || tomNode.querySelector('endertoma') ||
                            tomNode.querySelector('enderDest') || tomNode.querySelector('enderdest');
        let endereco = '';
        let cidade = '';
        let uf = '';
        let cep = '';
        
        if (enderTomNode) {
          const logradouro = getNodeText(enderTomNode, 'xLgr') || getNodeText(enderTomNode, 'xlgr') || '';
          const numero = getNodeText(enderTomNode, 'nro') || '';
          const complemento = getNodeText(enderTomNode, 'xCpl') || getNodeText(enderTomNode, 'xcpl') || '';
          const bairro = getNodeText(enderTomNode, 'xBairro') || getNodeText(enderTomNode, 'xbairro') || '';
          
          endereco = `${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}${bairro ? ` - ${bairro}` : ''}`;
          cidade = getNodeText(enderTomNode, 'xMun') || getNodeText(enderTomNode, 'xmun') || '';
          uf = getNodeText(enderTomNode, 'UF') || getNodeText(enderTomNode, 'uf') || '';
          cep = getNodeText(enderTomNode, 'CEP') || getNodeText(enderTomNode, 'cep') || '';
          
          // Formata o CEP
          if (cep && cep.length === 8) {
            cep = `${cep.substring(0, 5)}-${cep.substring(5)}`;
          }
        }
        
        destinatario = {
          razaoSocial,
          cnpjCpf,
          endereco,
          cidade,
          uf,
          cep
        };
      }

      // Extrai valores
      const vPrestNode = xmlDoc.querySelector('vPrest') || xmlDoc.querySelector('vprest');
      if (vPrestNode) {
        const vTPrest = getNodeText(vPrestNode, 'vTPrest') || getNodeText(vPrestNode, 'vtprest') || '0';
        valorTotal = parseFloat(vTPrest) || 0;
        valorFrete = valorTotal; // No CTe, o valor total é o valor do frete
      }

      // Extrai informações específicas do CTe
      const infCargaNode = xmlDoc.querySelector('infCarga') || xmlDoc.querySelector('infcarga');
      if (infCargaNode) {
        const vCarga = getNodeText(infCargaNode, 'vCarga') || getNodeText(infCargaNode, 'vcarga');
        if (vCarga) {
          // O valor da carga pode ser diferente do valor do frete
        }
        
        // Peso total
        const pesoB = getNodeText(infCargaNode, 'mPeso') || getNodeText(infCargaNode, 'mpeso') || 
                     getNodeText(infCargaNode, 'pesoB') || getNodeText(infCargaNode, 'pesob') || '0';
        pesoTotal = parseFloat(pesoB) || undefined;
      }

      // Modal de transporte
      const ideNode2 = xmlDoc.querySelector('ide') || xmlDoc.querySelector('IDE');
      if (ideNode2) {
        const modal = getNodeText(ideNode2, 'modal') || getNodeText(ideNode2, 'MODAL') || '';
        switch (modal) {
          case '01':
            modalTransporte = 'Rodoviário';
            break;
          case '02':
            modalTransporte = 'Aéreo';
            break;
          case '03':
            modalTransporte = 'Aquaviário';
            break;
          case '04':
            modalTransporte = 'Ferroviário';
            break;
          case '05':
            modalTransporte = 'Dutoviário';
            break;
          case '06':
            modalTransporte = 'Multimodal';
            break;
          default:
            modalTransporte = 'Rodoviário';
        }
      }
    } else {
      throw new Error('Tipo de documento não reconhecido. Apenas NFe e CTe são suportados.');
    }

    // Retorna os dados extraídos
    return {
      tipo,
      modelo,
      numeroDocumento,
      serie,
      chaveAcesso,
      protocoloAutorizacao,
      dataAutorizacao,
      status: 'autorizado',
      emitente,
      destinatario,
      valorTotal,
      valorIcms,
      valorFrete,
      pesoTotal,
      modalTransporte
    };
  } catch (error) {

    throw new Error(`Erro ao analisar XML: ${(error as Error).message}`);
  }
};

// Função auxiliar para obter o texto de um nó XML
const getNodeText = (parentNode: Element, nodeName: string): string | null => {
  const node = parentNode.querySelector(nodeName);
  return node ? node.textContent : null;
};

// Função para extrair a chave de acesso de um XML
const extractChaveAcesso = (xmlContent: string): string | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Tenta encontrar a chave de acesso em diferentes locais possíveis
    const infNFeNode = xmlDoc.querySelector('infNFe') || xmlDoc.querySelector('infnfe');
    if (infNFeNode) {
      const id = infNFeNode.getAttribute('Id');
      if (id) {
        return id.replace(/[^0-9]/g, '');
      }
    }
    
    const infCTeNode = xmlDoc.querySelector('infCte') || xmlDoc.querySelector('infcte');
    if (infCTeNode) {
      const id = infCTeNode.getAttribute('Id');
      if (id) {
        return id.replace(/[^0-9]/g, '');
      }
    }
    
    return null;
  } catch (error) {

    return null;
  }
};