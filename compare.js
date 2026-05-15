const list1 = `Acari
Acu
Afonso Bezerra
Agua Nova
Alexandria
Almino Afonso
Alto do Rodrigues
Angicos
Antonio Martins
Apodi
Areia Branca
Arez
Baia Formosa
Barcelona
Bento Fernandes
Boa Saude
Bodo
Caicara do Norte
Caicara do Rio do Vento
Caico
Campo Redondo
Canguaretama
Carnauba dos Dantas
Carnaubais
Ceara-Mirim
Cerro Cora
Coronel Ezequiel
Coronel Joao Pessoa
Cruzeta
Currais Novos
Doutor Severiano
Encanto
Equador
Espirito Santo
Parau
Extremoz
Felipe Guerra
Fernando Pedroza
Florania
Francisco Dantas
Frutuoso Gomes
Galinhos
Goianinha
Governador Dix-Sept Rosado
Grossos
Guamare
Ielmo Marinho
Ipanguacu
Ipueira
Itaja
Itau
Jacana
Janduis
Japi
Jardim de Angicos
Jardim de Piranhas
Jardim do Serido
Joao Camara
Joao Dias
Jose da Penha
Jucurutu
Lagoa D'Anta
Lagoa de Pedras
Lagoa de Velhos
Lagoa Nova
Lagoa Salgada
Lajes
Lajes Pintadas
Lucrecia
Luis Gomes
Macau
Major Sales
Marcelino Vieira
Martins
Maxaranguape
Messias Targino
Montanhas
Monte Alegre
Monte das Gameleiras
Mossoro
Nisia Floresta
Nova Cruz
Olho-D'Agua do Borges
Parana
Parazinho
Parelhas
Passa e Fica
Patu
Pau dos Ferros
Pedra Grande
Pedra Preta
Pedro Avelino
Pedro Velho
Pendencias
Poco Branco
Portalegre
Porto do Mangue
Pureza
Rafael Fernandes
Rafael Godeiro
Riacho da Cruz
Riachuelo
Rio do Fogo
Rodolfo Fernandes
Santa Maria
Santana do Matos
Santana do Serido
Santo Antonio
Sao Bento do Norte
Sao Bento do Trairi
Sao Fernando
Sao Francisco do Oeste
Sao Joao do Sabugi
Sao Jose de Mipibu
Sao Jose do Campestre
Sao Jose do Serido
Sao Miguel
Sao Miguel do Gostoso
Sao Paulo do Potengi
Sao Pedro
Sao Rafael
Sao Tome
Sao Vicente
Senador Eloi de Souza
Senador Georgino Avelino
Serra Caiada
Serra de Sao Bento
Serra do Mel
Serra Negra do Norte
Serrinha dos Pintos
Severiano Melo
Taboleiro Grande
Taipu
Tangara
Tenente Ananias
Tenente Laurentino Cruz
Tibau
Tibau do Sul
Timbauba dos Batistas
Touros
Triunfo Potiguar
Umarizal
Upanema
Venha-Ver
Vila Flor`.split('\n').map(s => s.trim()).filter(Boolean);

const list2 = `Acari
Açu
Afonso Bezerra
Água Nova
Alexandria
Almino Afonso
Alto do Rodrigues
Angicos
Antônio Martins
Apodi
Areia Branca
Arez
Baía Formosa
Barcelona
Bento Fernandes
Boa Saúde
Bodó
Caiçara do Norte
Caiçara do Rio do Vento
Caicó
Campo Redondo
Canguaretama
Carnaúba dos Dantas
Carnaubais
Ceará-Mirim
Cerro Corá
Coronel Ezequiel
Coronel João Pessoa
Cruzeta
Currais Novos
Doutor Severiano
Encanto
Equador
Espírito Santo
Extremoz
Felipe Guerra
Fernando Pedroza
Florânia
Francisco Dantas
Frutuoso Gomes
Galinhos
Goianinha
Governador Dix-Sept Rosado
Grossos
Guamaré
Ielmo Marinho
Ipanguaçu
Ipueira
Itajá
Itaú
Jaçanã
Janduís
Japi
Jardim de Angicos
Jardim de Piranhas
Jardim do Seridó
João Câmara
João Dias
José da Penha
Jucurutu
Lagoa d'Anta
Lagoa de Pedras
Lagoa de Velhos
Lagoa Nova
Lagoa Salgada
Lajes
Lajes Pintadas
Lucrécia
Luís Gomes
Macau
Major Sales
Marcelino Vieira
Martins
Maxaranguape
Messias Targino
Montanhas
Monte Alegre
Monte das Gameleiras
Mossoró
Nísia Floresta
Nova Cruz
Paraná
Paraú
Parazinho
Parelhas
Passa e Fica
Patu
Pau dos Ferros
Pedra Grande
Pedra Preta
Pedro Avelino
Pedro Velho
Pendências
Poço Branco
Portalegre
Porto do Mangue
Pureza
Rafael Fernandes
Rafael Godeiro
Riacho da Cruz
Riachuelo
Rio do Fogo
Rodolfo Fernandes
Santa Maria
Santana do Matos
Santana do Seridó
Santo Antônio
São Bento do Norte
São Bento do Trairí
São Fernando
São Francisco do Oeste
São João do Sabugi
São José de Mipibu
São José do Campestre
São José do Seridó
São Miguel
São Miguel do Gostoso
São Paulo do Potengi
São Pedro
São Rafael
São Tomé
São Vicente
Senador Elói de Souza
Senador Georgino Avelino
Serra Caiada
Serra de São Bento
Serra do Mel
Serra Negra do Norte
Serrinha dos Pintos
Severiano Melo
Taboleiro Grande
Taipu
Tangará
Tenente Ananias
Tenente Laurentino Cruz
Tibau
Tibau do Sul
Timbaúba dos Batistas
Touros
Triunfo Potiguar
Umarizal
Upanema
Venha-Ver
Vila Flor`.split('\n').map(s => s.trim()).filter(Boolean);

const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[']/g, '');

const normalizedList2 = list2.map(normalize);

const missing = list1.filter(city => !normalizedList2.includes(normalize(city)));
console.log('Missing from List 2:', missing);

const extras = list2.filter(city => !list1.map(normalize).includes(normalize(city)));
console.log('Extras in List 2:', extras);

console.log('List 1 length:', list1.length);
console.log('List 2 length:', list2.length);
