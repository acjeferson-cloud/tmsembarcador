import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Package, Truck, CreditCard, ExternalLink, ZoomIn, ZoomOut, RefreshCw, PackageCheck } from 'lucide-react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Document types
type DocumentType = 'order' | 'invoice' | 'pickup' | 'cte' | 'bill';

// Document interface
interface Document {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  status: string;
  value: number;
}

// Relationship map modal props
interface RelationshipMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDocument: Document;
  onDocumentClick?: (document: Document) => void;
}

import { supabase } from '../../lib/supabase';

// Add these to imports at the top:
// import { supabase } from '../../lib/supabase';

const getLiveRelatedDocuments = async (sourceDocument: Document) => {
  const documents: Document[] = [sourceDocument];
  const relationships: Array<{from: string, to: string}> = [];
  
  if (sourceDocument.type === 'order') {
    // Busca Invoices e CTes relacionados a esse pedido
    const orderId = sourceDocument.id.replace('order-', '');
    
    // Invoices by order_id
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('id, numero, data_emissao, status, valor_total')
      .eq('order_id', orderId);

    if (invoicesData && invoicesData.length > 0) {
      for (const inv of invoicesData) {
        const invId = `invoice-${inv.id}`;
        documents.push({
          id: invId,
          type: 'invoice',
          number: inv.numero,
          date: inv.data_emissao || new Date().toISOString(),
          status: inv.status || 'Emitida',
          value: Number(inv.valor_total || 0)
        });
        relationships.push({ from: sourceDocument.id, to: invId });
        
        // E procura CTes conectados a essa Invoice
        const { data: ctesData } = await supabase
          .from('ctes')
          .select('id, numero, data_emissao, status, valor_total')
          .eq('invoice_id', inv.id);
          
        if (ctesData && ctesData.length > 0) {
          for (const cte of ctesData) {
            const cteId = `cte-${cte.id}`;
            documents.push({
              id: cteId,
              type: 'cte',
              number: cte.numero,
              date: cte.data_emissao || new Date().toISOString(),
              status: cte.status || 'Emitido',
              value: Number(cte.valor_total || 0)
            });
            relationships.push({ from: invId, to: cteId });
          }
        }
      }
    } else {
      // Se não tem invoice, tenta achar CTe direto pelo order_id
      const { data: ctesDirect } = await supabase
        .from('ctes')
        .select('id, numero, data_emissao, status, valor_total')
        .eq('order_id', orderId);
        
      if (ctesDirect && ctesDirect.length > 0) {
        for (const cte of ctesDirect) {
          const cteId = `cte-${cte.id}`;
          documents.push({
            id: cteId,
            type: 'cte',
            number: cte.numero,
            date: cte.data_emissao || new Date().toISOString(),
            status: cte.status || 'Emitido',
            value: Number(cte.valor_total || 0)
          });
          relationships.push({ from: sourceDocument.id, to: cteId });
        }
      }
    }
  }

  // A partir daqui pode-se expandir os fluxos reversos (quando abre mapa pela Invoice, por exempo)
  // Como a tela em que estamos está listando a partir dos Pedidos, esse foi o foco:
  
  return { documents, relationships };
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Format currency
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Get document icon based on type
const getDocumentIcon = (type: DocumentType) => {
  switch (type) {
    case 'order':
      return <Package className="text-blue-600 dark:text-blue-400" />;
    case 'invoice':
      return <FileText className="text-green-600 dark:text-green-400" />;
    case 'pickup':
      return <PackageCheck className="text-cyan-600 dark:text-cyan-400" />;
    case 'cte':
      return <Truck className="text-orange-600 dark:text-orange-400" />;
    case 'bill':
      return <CreditCard className="text-purple-600 dark:text-purple-400" />;
  }
};

// Get document color based on type
const getDocumentColor = (type: DocumentType) => {
  switch (type) {
    case 'order':
      return { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' };
    case 'invoice':
      return { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' };
    case 'pickup':
      return { bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-800 dark:text-cyan-200' };
    case 'cte':
      return { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-200' };
    case 'bill':
      return { bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' };
  }
};

// Get document type label
const getDocumentTypeLabel = (type: DocumentType) => {
  switch (type) {
    case 'order':
      return 'Pedido';
    case 'invoice':
      return 'Nota Fiscal';
    case 'pickup':
      return 'Coleta';
    case 'cte':
      return 'CT-e';
    case 'bill':
      return 'Fatura';
  }
};

// Custom node component
const DocumentNode: React.FC<{
  data: {
    document: Document;
    onClick?: (document: Document) => void;
  };
}> = ({ data }) => {
  const { document, onClick } = data;
  const colors = getDocumentColor(document.type);
  
  return (
    <div 
      className={`p-3 rounded-lg shadow-md border ${colors.border} ${colors.bg} max-w-xs`}
      onClick={() => onClick && onClick(document)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getDocumentIcon(document.type)}
          <span className={`text-sm font-semibold ${colors.text}`}>{getDocumentTypeLabel(document.type)}</span>
        </div>
        {onClick && (
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Abrir documento"
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-gray-900 dark:text-white font-medium">{document.number}</p>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{formatDate(document.date)}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(document.value)}</span>
        </div>
        <div className="mt-1">
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {document.status}
          </span>
        </div>
      </div>
    </div>
  );
};

// Node types
const nodeTypes = {
  documentNode: DocumentNode,
};

export const RelationshipMapModal: React.FC<RelationshipMapModalProps> = ({
  isOpen,
  onClose,
  sourceDocument,
  onDocumentClick
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create nodes and edges from documents and relationships
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    
    // Asynchronous call wrapper
    const loadMap = async () => {
      try {
        const { documents, relationships } = await getLiveRelatedDocuments(sourceDocument);
        
        // Create nodes
        const newNodes: Node[] = documents.map((doc, index) => {
          // Calculate position based on document type
          let position = { x: 0, y: 0 };
          
          // Position nodes in a logical flow: Order -> Invoice -> CTe -> Bill
          switch (doc.type) {
            case 'order':
              position = { x: 0, y: 100 * index };
              break;
            case 'invoice':
              position = { x: 300, y: 100 * index };
              break;
            case 'pickup':
              position = { x: 450, y: 100 * index };
              break;
            case 'cte':
              position = { x: 600, y: 100 * index };
              break;
            case 'bill':
              position = { x: 900, y: 100 * index };
              break;
          }
          
          return {
            id: doc.id,
            type: 'documentNode',
            position,
            data: { 
              document: doc,
              onClick: onDocumentClick
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          };
        });
        
        // Create edges
        const newEdges: Edge[] = relationships.map((rel, index) => ({
          id: `e${index}`,
          source: rel.from,
          target: rel.to,
          animated: true,
          style: { stroke: '#64748b' },
        }));
        
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error("Failed to load map relations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMap();
  }, [isOpen, sourceDocument, onDocumentClick]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mapa de Relações</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {getDocumentTypeLabel(sourceDocument.type)} {sourceDocument.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 h-full">
          <h2 className="text-xl font-semibold mb-4">Mapa de Relacionamentos</h2>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Carregando mapa de relações...</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <Background />
              <Controls />
              <MiniMap 
                nodeStrokeWidth={3}
                zoomable 
                pannable
                className="bg-white dark:bg-gray-800"
              />
            </ReactFlow>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Visualização dos relacionamentos</p>
        </div>
      </div>
    </div>
  );
};