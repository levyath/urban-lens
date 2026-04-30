# 🏙️ Urban Lens

**Urban Lens** é uma plataforma de análise urbana que permite visualizar e avaliar características de localidades no Rio de Janeiro, incluindo infraestrutura de transporte, pontos de interesse, áreas de vulnerabilidade social e estatísticas de segurança.

![Urban Lens](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7.3-blue.svg)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

Urban Lens é um **Projeto Integrador** desenvolvido para análise de localidades urbanas, oferecendo uma visão abrangente sobre diversos aspectos de uma região através de:

- 🗺️ **Visualização Geoespacial**: Mapa interativo com marcadores e áreas de vulnerabilidade
- 🚇 **Análise de Transporte**: Avaliação da infraestrutura de transporte público (ônibus, trem, metrô)
- 🏪 **Pontos de Interesse**: Identificação e categorização de estabelecimentos próximos
- ⚠️ **Vulnerabilidade Social**: Mapeamento de áreas vulneráveis com dados populacionais
- 🚨 **Segurança**: Estatísticas criminais por região (CISP)

O sistema utiliza dados do **OpenStreetMap (OSM)**, **IBGE**, **IPP** e **ISP-RJ** para fornecer análises precisas e atualizadas.

---

## ✨ Funcionalidades

### 🔍 Busca e Geocodificação
- Busca de endereços com autocompletar
- Geocodificação reversa (clique no mapa)
- Raio de busca ajustável (500m - 5km)

### 📊 Análise Multidimensional
- **Transporte**: Avaliação em estrelas (0-5) baseada em proximidade e quantidade
- **Lugares**: Categorização automática com paginação
- **Vulnerabilidade**: Score de vulnerabilidade social com visualização de polígonos
- **Segurança**: Índice de risco criminal por delegacia (CISP)

### 🗺️ Visualização Interativa
- Mapa base OpenStreetMap
- Marcadores coloridos (azul para seleção, verde para lugares)
- Polígonos de áreas vulneráveis com gradiente de cor
- Círculo de raio de busca
- Popups informativos

### 📱 Interface Responsiva
- Painel de análise minimizável
- Grid de categorias com paginação
- Expansão de categorias com carregamento incremental
- Seleção visual de lugares no mapa

---

## 🛠️ Tecnologias

### Frontend
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Leaflet** - Mapas interativos
- **React Leaflet** - Integração React + Leaflet
- **Axios** - Cliente HTTP
- **SASS** - Pré-processador CSS

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Tipagem estática
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **PostGIS** - Extensão geoespacial
- **Axios** - Cliente HTTP para Nominatim

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **PostgreSQL + PostGIS** - Banco de dados geoespacial
- **Nominatim** - Serviço de geocodificação OSM

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │
│   Port: 5173    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend       │
│   NestJS API    │
│   Port: 3000    │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌──────────┐ ┌──────────┐
│PostGIS │ │Nominatim │ │ OSM Data │
│Port:   │ │Port: 8080│ │          │
│5432    │ └──────────┘ └──────────┘
└────────┘
```

### Módulos do Backend

- **Geocode**: Busca de endereços via Nominatim
- **Places**: Pontos de interesse do OSM
- **Transports**: Infraestrutura de transporte
- **Vulnerability**: Áreas de vulnerabilidade social
- **Criminal Statistics**: Dados de segurança por CISP

---

## 📦 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Git**

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/urban-lens.git
cd urban-lens
```

### 2. Configure as variáveis de ambiente

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:
```env
PORT=3000
DB_HOST_DB=localhost
DB_PORT_DB=5432
DB_USER=osm
DB_PASSWORD=osm
DB_DATABASE_DB=osm
NOMINATIM_URL=http://localhost:8080
```

#### Frontend (.env)
```bash
cd frontend/urban-lens
cp .env.example .env
```

Edite o arquivo `.env`:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Inicie a infraestrutura (PostgreSQL + Nominatim)

```bash
cd infra
docker-compose up -d
```

Aguarde alguns minutos para o Nominatim importar os dados do OSM.

### 4. Instale as dependências

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend/urban-lens
npm install
```

### 5. Execute as migrações do banco de dados

```bash
cd backend
npm run migration:run
```

Isso irá:
- Criar a extensão PostGIS
- Criar índices espaciais no OSM
- Criar tabela de vulnerabilidade
- Importar dados de favelas (Limite_Favelas_2022.geojson)
- Criar tabelas de estatísticas criminais (CISP)
- Importar dados do ISP-RJ

---

## ⚙️ Configuração

### Banco de Dados

O projeto utiliza PostgreSQL com PostGIS. A estrutura é criada automaticamente pelas migrações.

#### Tabelas Principais:
- `planet_osm_point` - Pontos do OSM (lugares, transportes)
- `planet_osm_line` - Linhas do OSM
- `planet_osm_polygon` - Polígonos do OSM
- `vulnerability_areas` - Áreas de vulnerabilidade social
- `cisp_areas` - Áreas de delegacias (CISP)
- `cisp_statistics` - Estatísticas criminais

### Dados Geoespaciais

Os dados são importados de:
- **OSM**: Via Nominatim (dados do Rio de Janeiro)
- **Favelas**: `backend/src/data/Limite_Favelas_2022.geojson`
- **CISP**: `backend/src/data/cisp-mapa.json`
- **Estatísticas**: `backend/src/data/dados-isp.csv`

---

## 🎮 Uso

### Desenvolvimento

#### 1. Inicie o backend
```bash
cd backend
npm run start:dev
```

O backend estará disponível em `http://localhost:3000`

#### 2. Inicie o frontend
```bash
cd frontend/urban-lens
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Produção

#### Backend
```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend
```bash
cd frontend/urban-lens
npm run build
npm run preview
```

---

## 📡 API Endpoints

### Geocode
- `GET /geocode` - Busca de endereços

### Places
- `GET /places/near` - Lugares próximos
- `GET /places/categories` - Categorias disponíveis

### Transports
- `GET /transports/near` - Transportes próximos

### Vulnerability
- `GET /vulnerability` - Vulnerabilidade em ponto específico
- `GET /vulnerability/near` - Áreas vulneráveis próximas

### Criminal Statistics
- `GET /cisp-statistic/local` - Estatísticas criminais por localização
- `POST /cisp-statistic/importar` - Importar dados do CSV
- `POST /cisp-area/importar` - Importar áreas CISP

Para documentação completa, consulte [endpoints.md](./endpoints.md)

---

## 📁 Estrutura do Projeto

```
urban-lens/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── migrations/        # Migrações TypeORM
│   │   │   └── typeorm.config.ts  # Configuração do banco
│   │   ├── modules/
│   │   │   ├── geocode/           # Módulo de geocodificação
│   │   │   ├── places/            # Módulo de lugares
│   │   │   ├── transports/        # Módulo de transportes
│   │   │   ├── vulnerability/     # Módulo de vulnerabilidade
│   │   │   └── criminal-statistic/# Módulo de estatísticas criminais
│   │   ├── data/                  # Dados GeoJSON e CSV
│   │   └── main.ts                # Entry point
│   ├── scripts/                   # Scripts utilitários
│   └── package.json
│
├── frontend/
│   └── urban-lens/
│       ├── src/
│       │   ├── components/
│       │   │   ├── AnalysisPanel/ # Painel de análise
│       │   │   ├── Map/           # Componente do mapa
│       │   │   ├── SearchBar/     # Barra de busca
│       │   │   └── GeocodeResults/# Resultados de busca
│       │   ├── services/          # Serviços API
│       │   ├── hooks/             # React hooks
│       │   ├── utils/             # Utilitários
│       │   ├── types/             # TypeScript types
│       │   └── App.tsx            # Componente principal
│       └── package.json
│
├── infra/
│   └── docker-compose.yml         # Infraestrutura Docker
│
├── endpoints.md                   # Documentação da API
└── README.md                      # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

### Convenção de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Seu Nome** - *Desenvolvimento* - [GitHub](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- **OpenStreetMap** - Dados geoespaciais
- **IBGE** - Dados demográficos
- **IPP** - Instituto Pereira Passos (dados de favelas)
- **ISP-RJ** - Instituto de Segurança Pública do Rio de Janeiro
- **NestJS** - Framework backend
- **React** - Biblioteca frontend
- **Leaflet** - Biblioteca de mapas

---

## 📞 Contato

Para dúvidas ou sugestões, abra uma [issue](https://github.com/seu-usuario/urban-lens/issues) no GitHub.

---

<div align="center">
  Feito com ❤️ para análise urbana
</div>
