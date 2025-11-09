const express = require('express');
const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

const mysql = require('mysql2/promise');

// Crea una pool de conexiones con la información de tu base de datos
const pool = mysql.createPool({
    host: 'database-1.ccximeccczok.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'holapapa111',
    database: 'test-db'
});


app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Endpoint GET para obtener todos los usuarios
app.get("/usuarios", (req, res) => {
    pool.query('SELECT * FROM users')
        .then(([rows, fields]) => {
            res.json(rows);
        })
        .catch(err => {
            console.error('Error executing query', err);
            res.status(500).send('Error retrieving users');
        });
})

// Endpoint POST para crear un usuario
app.post("/usuarios", (req, res) => {
    const { nombre, email, telefono, edad } = req.body;

    // Validación básica
    if (!nombre || !email) {
        return res.status(400).json({
            error: 'Los campos nombre y email son obligatorios'
        });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Formato de email inválido'
        });
    }

    const query = 'INSERT INTO users (nombre, email, telefono, edad) VALUES (?, ?, ?, ?)';

    pool.query(query, [nombre, email, telefono || null, edad || null])
        .then(([result]) => {
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                id: result.insertId,
                usuario: {
                    id: result.insertId,
                    nombre,
                    email,
                    telefono,
                    edad,
                }
            });
        })
        .catch(err => {
            console.error('Error creating user', err);

            // Manejar error de email duplicado (si existe constraint UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El email ya está registrado'
                });
            }

            res.status(500).json({
                error: 'Error interno del servidor al crear el usuario'
            });
        });
});

app.get("/usuarios/:id" ,(req,res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM users WHERE id = ?";
    pool.query(sql, [id])
    .then((rows, fields) =>{
        if(rows.length > 0){
        res.json(rows[0])   
        } else {
            res.status(404).send("User not Found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(404).send("User not Found");
    })
    
})




// Endpoint para identificar los productos 
app.get("/productos", (req, res) => {
    pool.query('SELECT * FROM products')
        .then(([rows, fields]) => {
            res.json(rows);
        })
        .catch(err => {
            console.error('Error executing query', err);
            res.status(500).send('Error retrieving products');
        });
})

app.get("/productos/:id" ,(req,res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM products WHERE id = ?";
    pool.query(sql, [id])
    .then((rows, fields) =>{
        if(rows.length > 0){
        res.json(rows[0])   
        } else {
            res.status(404).send("product not Found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(404).send("product not Found");
    })
    
})



// Endpoint POST para crear un producto
app.post("/productos", (req, res) => {
    const { name, description, price, stock, image } = req.body;

    // Validación básica
    if (!name) {
        return res.status(400).json({
            error: 'El campo name es obligatorio'
        });
    }

    const query = 'INSERT INTO products (name, description, price, stock, image, created_at) VALUES (?, ?, ?, ?, ?, NOW())';

    pool.query(query, [name, description, price || null, stock || null, image])
        .then(([result]) => {
            res.status(201).json({
                message: 'Producto creado exitosamente',
                id: result.insertId,
                producto: {
                    id: result.insertId,
                    name,
                    description,
                    price,
                    stock,
                    image
                }
            });
        })
        .catch(err => {
            console.error('Error creating product', err);

            // Manejar error de email duplicado (si existe constraint UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El nombre del producto ya está registrado'
                });
            }

            res.status(500).json({
                error: 'Error interno del servidor al crear el producto'
            });
        })
        .catch(err => {
            console.error('Error creating Product', err);

            // Manejar error de email duplicado (si existe constraint UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El nombre del producto ya está registrado'
                });
            }

            res.status(500).json({
                error: 'Error interno del servidor al crear el producto'
            });
        });
});

app.delete("/productos/:id" ,(req,res) => {
    const id = req.params.id;
    const sql = "DELETE FROM products WHERE id = ?"; 
    pool.query(sql, [id])
    .then((rows, fields) =>{
        if(rows.length > 0){
        res.json(rows[0])   
        } else {
            res.status(404).send("product not Found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(404).send("product not Found");
    })
    
})


app.put("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, image } = req.body;
    const sql = `
      UPDATE products
      SET name = ?, description = ?, price = ?, stock = ?, image = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      name,
      description,
      price,
      stock,
      image,
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto actualizado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





// Endpoint para identificar los purchases 
app.get("/compras", (req, res) => {
    pool.query('SELECT * FROM purchases')
        .then(([rows, fields]) => {
            res.json(rows);
        })
        .catch(err => {
            console.error('Error executing query', err);
            res.status(500).send('Error retrieving products');
        });
})

app.get("/compras/:id" ,(req,res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM purchases WHERE id = ?";
    pool.query(sql, [id])
    .then((rows, fields) =>{
        if(rows.length > 0){
        res.json(rows[0])   
        } else {
            res.status(404).send("product not Found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(404).send("product not Found");
    })
    
})

app.post("/compras", (req, res) => {
    const { user_id, total, status, purchase_date } = req.body;

    if (!user_id) {
        return res.status(400).json({
            error: 'El campo usuario es obligatorio'
        });
    }

    const query = 'INSERT INTO purchases (user_id, total, status, purchase_date) VALUES (?, ?, ?, ?)';

    pool.query(query, [user_id, total || null, status || null, purchase_date || null])
        .then(([result]) => {
            res.status(201).json({
                message: 'compra creada exitosamente',
                id: result.insertId,
                compra: {
                    id: result.insertId,
                    user_id,
                    total,
                    status,
                    purchase_date
                }
            });
        })
        .catch(err => {
            console.error('Error creating purchase', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El usuario ya tiene una compra registrada con ese ID'
                });
            }
        })
        .catch(err => {
            console.error('Error creating product', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El nombre del producto ya está registrado'
                });
            }

            res.status(500).json({
                error: 'Error interno del servidor al crear el producto'
            });
        })
        .catch(err => {
            console.error('Error creating Product', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'El nombre del producto ya está registrado'
                });
            }

            res.status(500).json({
                error: 'Error interno del servidor al crear el producto'
            });
        });
});

app.delete("/compras/:id" ,(req,res) => {
    const id = req.params.id;
    const sql = "DELETE FROM purchases WHERE id = ?"; 
    pool.query(sql, [id])
    .then((rows, fields) =>{
        if(rows.length > 0){
        res.json(rows[0])   
        } else {
            res.status(404).send("product not Found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(404).send("product not Found");
    })
    
})

app.put("/compras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, total, status, purchase_date } = req.body;
    const sql = `
      UPDATE purchases
      SET user_id = ?, total = ?, status = ?, purchase_date = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [
      user_id,
      total,
      status,
      purchase_date
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Compra no encontrada" });
    res.json({ message: "Compra actualizada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});