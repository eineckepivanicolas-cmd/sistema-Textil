import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID

load_dotenv()  # Carrega as variáveis do arquivo .env

client = Client()
# Mantendo o endpoint correto da nuvem
client.set_endpoint('https://nyc.cloud.appwrite.io/v1')

# Puxa o ID do projeto do seu arquivo .env
client.set_project(os.getenv('APPWRITE_PROJECT_ID')) 

# Sua API Key secreta gerada no painel
client.set_key('standard_94d52e1dec7a7e91bcf1b37ca0ad102cf9ba8a97ed753eb3bb04ad5db8e581375c033aaff91c2ae9559e862804d51c3932fa70bbdb4be0f11d9276c5d2fe0f285c8f5cc64b0b25e948f354a2b61ccc53678f60b134e4de993010803b32b84ebf34ae35a00d03d510e5705e97908a49a3a577c08d76e47e7bb4519946b2a0d811') 

databases = Databases(client)

DATABASE_ID = '6a383648000d85e5fca5'
TABELA_LOTES_ID = 'lotes' 

# --- EXEMPLO 1: Cadastrar um Novo Lote via Python ---
# --- EXEMPLO 1: Cadastrar um Novo Lote via Python ---
def cadastrar_novo_lote(numero, cliente, servico, total_pecas, preco_unitario):
    try:
        dados_do_lote = {
            'numero': str(numero),
            'cliente': cliente.upper(),
            'servico': servico,
            
            # 🚨 Mudei para tudo minúsculo aqui. Se o erro persistir, 
            # vá no painel do Appwrite e veja exatamente como está o ID dessa coluna!
            'totalpecas': int(total_pecas), 
            
            'pendentespecas': 0,
            'pecasdefeitos': 0,
            'status': 'A Iniciar',
            'progresso': 0,
            'precoUnitario': float(preco_unitario)
        }
        
        resposta = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=TABELA_LOTES_ID,
            document_id=ID.unique(),
            data=dados_do_lote
        )
        # Acessando com ponto ( . ) que é o correto para o objeto do Python
        print(f"✅ Lote {numero} cadastrado com sucesso! ID do Documento: {resposta.id}")
        return resposta

    except Exception as e:
        print(f"❌ Erro ao cadastrar lote: {e}")

# --- EXEMPLO 2: Listar todos os Lotes cadastrados ---
# --- EXEMPLO 2: Listar todos os Lotes cadastrados ---
def listar_lotes():
    try:
        resultado = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TABELA_LOTES_ID
        )
        print("\n--- LISTA DE LOTES NO BANCO ---")
        
        # O segredo no SDK do Python é acessar os documentos usando ponto (.documents)
        # e os dados internos usando .data.get()
        lotes_no_banco = resultado.documents
        
        for documento in lotes_no_banco: 
            dados = documento.data
            print(f"Lote: {dados.get('numero')} | Cliente: {dados.get('cliente')} | Status: {dados.get('status')}")
            
    except Exception as e:
        print(f"❌ Erro ao listar lotes: {e}")

# --- EXECUTANDO O TESTE ---
if __name__ == '__main__':
    # Teste cadastrar um lote fictício para a sua facção
    cadastrar_novo_lote(
        numero="5012", 
        cliente="Malhas Sul", 
        servico="CAMISETA BASIC", 
        total_pecas=500, 
        preco_unitario=1.80
    )
    
    # Teste ler os dados do banco
    listar_lotes()