const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

// 1. Add import
if (!content.includes("import { useInnovations }")) {
    content = content.replace(
        "import { supabase } from '../../lib/supabase';",
        "import { supabase } from '../../lib/supabase';\nimport { useInnovations } from '../../hooks/useInnovations';"
    );
}

// 2. Add hook inside component
if (!content.includes("const { isInnovationActive }")) {
    content = content.replace(
        "const [isGenerating, setIsGenerating] = useState(false);",
        "const { isInnovationActive } = useInnovations();\n  const whatsappActive = isInnovationActive('whatsapp');\n  const [isGenerating, setIsGenerating] = useState(false);"
    );
}

// 3. Replace the button HTML
const oldButtonHtml = `<button
              onClick={handleSendByWhatsApp}
              disabled={isSendingWhatsApp || !cteData.carrierPhone}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Enviando por WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={20} />
                  <span>
                    {cteData.carrierPhone
                      ? \`Enviar por WhatsApp (\${cteData.carrierPhone})\`
                      : 'WhatsApp não cadastrado'}
                  </span>
                </>
              )}
            </button>`;

const newButtonHtml = `<button
              onClick={handleSendByWhatsApp}
              disabled={isSendingWhatsApp || !cteData.carrierPhone || !whatsappActive}
              className={\`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed \${
                !whatsappActive
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
              }\`}
              title={!whatsappActive ? 'Integração com WhatsApp não contratada. Ative em Inovações & Sugestões.' : ''}
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Enviando por WhatsApp...</span>
                </>
              ) : (
                <>
                  {whatsappActive && <MessageCircle size={20} />}
                  <span>
                    {!whatsappActive 
                      ? 'WhatsApp não Contratado' 
                      : cteData.carrierPhone
                        ? \`Enviar por WhatsApp (\${cteData.carrierPhone})\`
                        : 'WhatsApp não cadastrado'}
                  </span>
                </>
              )}
            </button>`;

// Some files might use single quotes or different whitespace. Try a more dynamic regex if literal string replace fails.
if (content.includes(oldButtonHtml)) {
   content = content.replace(oldButtonHtml, newButtonHtml);
} else {
   const buttonRegex = /<button[\s\S]*?handleSendByWhatsApp[\s\S]*?<\/button>/m;
   content = content.replace(buttonRegex, newButtonHtml);
}

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
