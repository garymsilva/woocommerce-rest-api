# WooCommerce REST API
Esta aplicação contém uma API REST que manipula recursos de uma base de dados de WooCommerce e realiza as seguintes tarefas:
||
|-|
|Listar produtos|
|Consultar produto|
|Criar produto|
|Atualizar produto|
|Excluir produto|
|Consultar estatísticas de vendas

## Instalando e executando
Para executar a aplicação é necessário ter o NodeJS instalado, bem como o `npm`.

1. Instale o NodeJS (o npm já vem incluso): https://nodejs.org/

2. Copie ou renomeie o arquivo `.env.example` para `.env` e adicione as informações de conexão ao banco de dados (MySQL);

3. Abra o terminal na raiz do projeto e execute o comando `npm install` para baixar as dependências da aplicação;

4. Execute o comando `npm start` para iniciar a aplicação;

5. Abra o navegador e acesse http://localhost:3000/, para visualizar a interface de testes.

## Tabelas usadas
### wp_posts
Essa tabela é nativa do WordPress e normalmente é usada para armazenar páginas, posts, etc. O WooCommerce a usa para armazenar as informações de produtos. As colunas usadas nesse trabalho foram:
|Coluna|Descrição|
|-|-|
|ID|id do produto|
|post_author|quem inseriu o produto|
|post_date|data da criação do produto|
|post_date_gmt|data da criação do produto em GMT-0|
|post_content|descrição do produto|
|post_title|nome do produto|
|post_modified|data da atualização do produto|
|post_modified_gmt|data da atualização do produto em GMT-0|
|post_type|usado sempre como 'product' para posts que são produtos|

<br>

### wp_postmeta
Essa tabela é nativa do WordPress e normalmente é usada para armazenar metadados dos posts. O WooCommerce a usa para guardar variáveis acerca dos produtos. As colunas usadas nesse trabalho foram:
|Coluna|Descrição|
|-|-|
|post_id|id do produto|
|meta_key|nome da variável|
|meta_value|valor da variável|

As variáveis usadas no trabalho foram `"_price"` e `"_stock"`.

<br>

### wp_wc_order_stats
Essa tabela é criada pelo WooCommerce, e armazena estatísticas de compras. As colunas usadas nesse trabalho foram:
|Coluna|Descrição|
|-|-|
|num_items_sold|quantidade de itens vendidos em cada compra|
|total_sales|valor total de cada compra|

<br>

## Queries dos webservices
As queries são usadas na camada de serviço da API (`src/api/services/product.service.js`).

### `GET /produto`
```SQL
SELECT
    p.ID AS productId,
    p.post_title AS productName,
    p.post_content AS productDescription,
    CAST((price.meta_value) AS DECIMAL(10, 2)) AS productPrice,
    CAST((stock.meta_value) AS UNSIGNED) AS productStock
  FROM wp_posts as p
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_price") AS price
	  ON price.post_id = p.ID
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_stock") AS stock
    ON stock.post_id = p.ID
  WHERE
  	p.post_type="product"
```
Para obter todos os produtos, foi necessário fazer JOIN com duas subconsultas que traziam o preço e a quantidade em estoque de cada produto. Como os metadados são armazenados todos como `varchar`, também foi preciso fazer o CAST para decimal e inteiro, de preço e estoque, respectivamente.

<br>

### `GET /produto/:id_produto`
```SQL
SELECT
    p.ID AS productId,
    p.post_title AS productName,
    p.post_content AS productDescription,
    CAST((price.meta_value) AS DECIMAL(10, 2)) AS productPrice,
    CAST((stock.meta_value) AS UNSIGNED) AS productStock
  FROM wp_posts AS p
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_price") AS price
	  ON price.post_id = p.ID
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_stock") AS stock
    ON stock.post_id = p.ID
  WHERE
    p.post_type="product"
    AND
    p.ID=?
```
A consulta de um único produto repete exatamente a mesma query da consulta anterior, com a adição apenas da condição `WHERE p.ID=?`.

<br>

### `POST /produto`
```SQL
INSERT INTO wp_posts (
    post_author,
    post_date,
    post_date_gmt,
    post_content,
    post_title,
    post_excerpt,
    ping_status,
    to_ping,
    pinged,
    post_content_filtered,
    post_type
  )
  VALUES (1, NOW(), adddate(NOW(), interval 3 hour), ?, ?, "", "closed", "", "", "", "product")
```
Para crar um produto, primeiro inserimos os dados básicos na tabela `wp_posts`. Os registros de datas e outras colunas que não têm relevância para os posts do tipo `"product"` foram fixados com strings vazias ou valores padrões conforme observação do que já estava no banco de dados. `post_content` e `post_title` recebem os valores enviados pelo usuário ao webservice.

<br>

```SQL
INSERT INTO wp_postmeta (
    post_id,
    meta_key,
    meta_value
  )
  VALUES (?, '_stock', ?), (?, '_price', ?)
```
Por fim, criamos as variáveis `"_stock"` e `"_price"` na tabela `wp_postmeta`, passando o `post_id` da query anterior e o preço e o estoque enviados pelo usuário ao webserice.

<br>

### `PUT /produto/:id_produto`
```SQL
UPDATE wp_posts
  SET
    post_content=?,
    post_title=?,
    post_modified=NOW(),
    post_modified_gmt=ADDDATE(NOW(), INTERVAL 3 HOUR)
  WHERE ID=?
  
UPDATE wp_postmeta
  SET
    meta_value=?
  WHERE post_id=? AND meta_key='_price'

UPDATE wp_postmeta
  SET
    meta_value=?
  WHERE post_id=? AND meta_key='_stock'
```
O update inicia atualizando os produtos na tabela `wp_posts` e, em seguida, atualiza o preço e o estoque.

<br>

### `DELETE /produto/:id_produto`
```SQL
DELETE FROM wp_posts WHERE ID=? AND post_type='product'

DELETE FROM wp_postmeta WHERE post_id=?
```
Para remover um produto, excluímos seus registros da tabela `wp_posts` e, em seguida, da tabela `wp_postmeta`.

<br>

### `GET /stats`
```SQL
SELECT
    SUM(num_items_sold) AS totalProductsSold,
    SUM(total_sales) AS totalProductRevenue,
    (SUM(total_sales) / SUM(num_items_sold)) AS averageProductPrice
  FROM wp_wc_order_stats
```
As estatísticas são obtidas lendo a tabela `wp_wc_order_stats`, somando a coluna `num_items_sold` para obter o total de produtos vendidos, a coluna `total_sales` para obter a receita total das vendas e dividindo a receita total pelo total de produtos, para obter a média de preço de cada produto vendido.