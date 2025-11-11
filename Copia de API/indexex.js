app.post("/compras", async (req, res) => {
  try {
    const { user_id, status, details } = req.body;

    if (!user_id || !Array.isArray(details) || details.length === 0)
      return res.status(400).json({ error: "Debe incluir user_id y al menos un producto" });

    if (details.length > MAX_PRODUCTOS)
      return res.status(400).json({ error: `Máximo ${MAX_PRODUCTOS} productos por compra` });

    let total = 0;

    // Verificar stock y calcular total
    for (const d of details) {
      const [prod] = await pool.query(`SELECT stock, name FROM products WHERE id = ?`, [d.product_id]);
      if (prod.length === 0)
        return res.status(404).json({ error: `Producto ${d.product_id} no encontrado` });

      if (prod[0].stock < d.quantity)
        return res.status(400).json({ error: `Stock insuficiente para ${prod[0].name}` });

      total += calcularSubtotal(d.quantity, d.price);
    }

    if (total > MAX_TOTAL)
      return res.status(400).json({ error: `El total excede $${MAX_TOTAL}` });

    // Insertar compra
    const [purchase] = await pool.query(
      `INSERT INTO purchases (user_id, total, status, purchase_date) VALUES (?, ?, ?, NOW())`,
      [user_id, total, status || "PENDING"]
    );

    const purchaseId = purchase.insertId;

    // Insertar detalles y actualizar stock
    for (const d of details) {
      const subtotal = calcularSubtotal(d.quantity, d.price);

      await pool.query(`
        INSERT INTO purchase_details (purchase_id, product_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [purchaseId, d.product_id, d.quantity, d.price, subtotal]);

      await pool.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [d.quantity, d.product_id]);
    }

    res.status(201).json({ message: "Compra creada exitosamente", id: purchaseId, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear la compra", details: err.message });
  }
});

// 📙 PUT: actualizar compra (si no está COMPLETED)
app.put("/compras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, status, details } = req.body;

    const [compra] = await pool.query(`SELECT * FROM purchases WHERE id = ?`, [id]);
    if (compra.length === 0)
      return res.status(404).json({ error: "Compra no encontrada" });

    if (compra[0].status === "COMPLETED")
      return res.status(400).json({ error: "No se puede modificar una compra COMPLETED" });

    let total = compra[0].total;

    if (details && details.length > 0) {
      if (details.length > MAX_PRODUCTOS)
        return res.status(400).json({ error: `Máximo ${MAX_PRODUCTOS} productos por compra` });

      // Revertir stock antiguo
      const [oldDetails] = await pool.query(`SELECT * FROM purchase_details WHERE purchase_id = ?`, [id]);
      for (const d of oldDetails)
        await pool.query(`UPDATE products SET stock = stock + ? WHERE id = ?`, [d.quantity, d.product_id]);

      await pool.query(`DELETE FROM purchase_details WHERE purchase_id = ?`, [id]);

      // Insertar nuevos detalles
      total = 0;
      for (const d of details) {
        const [prod] = await pool.query(`SELECT stock, name FROM products WHERE id = ?`, [d.product_id]);
        if (prod.length === 0)
          return res.status(404).json({ error: `Producto ${d.product_id} no encontrado` });

        if (prod[0].stock < d.quantity)
          return res.status(400).json({ error: `Stock insuficiente para ${prod[0].name}` });

        const subtotal = calcularSubtotal(d.quantity, d.price);
        total += subtotal;

        await pool.query(`
          INSERT INTO purchase_details (purchase_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `, [id, d.product_id, d.quantity, d.price, subtotal]);

        await pool.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [d.quantity, d.product_id]);
      }

      if (total > MAX_TOTAL)
        return res.status(400).json({ error: `El total excede $${MAX_TOTAL}` });
    }

    await pool.query(
      `UPDATE purchases SET user_id = ?, total = ?, status = ?, purchase_date = NOW() WHERE id = ?`,
      [user_id || compra[0].user_id, total, status || compra[0].status, id]
    );

    res.json({ message: "Compra actualizada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la compra", details: err.message });
  }
});

// 📕 DELETE: eliminar compra (solo si no está COMPLETED)
app.delete("/compras/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM purchases WHERE id = ?`, [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Compra no encontrada" });

    if (rows[0].status === "COMPLETED")
      return res.status(400).json({ error: "No se puede eliminar una compra COMPLETED" });

    // Revertir stock
    const [detalles] = await pool.query(`SELECT * FROM purchase_details WHERE purchase_id = ?`, [id]);
    for (const d of detalles)
      await pool.query(`UPDATE products SET stock = stock + ? WHERE id = ?`, [d.quantity, d.product_id]);

    await pool.query(`DELETE FROM purchase_details WHERE purchase_id = ?`, [id]);
    await pool.query(`DELETE FROM purchases WHERE id = ?`, [id]);

    res.json({ message: "Compra eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la compra", details: err.message });
  }
});