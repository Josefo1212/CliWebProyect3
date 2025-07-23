# PIT STOP FINANZAS

Aplicación web para la gestión de finanzas personales, inspirada en la estética de la Fórmula 1. Permite registrar ingresos, egresos, categorías, presupuestos y visualizar estadísticas de manera sencilla e interactiva.

## 🚦 Características principales

- **Inicio de sesión y registro de usuario** 
- **Dashboard** con resumen de ingresos, egresos y balance mensual
- **Gráficas interactivas** (gastos por categoría, evolución de balance, ingresos vs egresos)
- **Registro y edición de transacciones** (ingresos y egresos)
- **Gestión de categorías** (crear, editar, eliminar)
- **Asignación de presupuestos** por categoría y mes
- **Alertas visuales** si se supera el presupuesto
- **Filtros avanzados** para buscar transacciones por descripción, tipo y categoría
- **Transacciones recientes** siempre visibles en el dashboard
- **Sonidos de confirmación** al registrar operaciones
- **Diseño responsive** para móviles y escritorio
- **Persistencia local** usando IndexedDB y LocalStorage

## 🏁 Guía de uso

1. **Registro e inicio de sesión**
   - Al abrir la página, crea una cuenta con usuario y contraseña.
   - Inicia sesión con tus credenciales.

2. **Navegación**
   - Usa la barra superior para moverte entre las secciones: Dashboard, Transacciones, Categorías y Presupuestos.

3. **Dashboard**
   - Visualiza el resumen de tus finanzas del mes actual.
   - Cambia el mes con el selector para ver datos históricos.
   - Consulta las gráficas y las transacciones más recientes.

4. **Transacciones**
   - Registra ingresos o egresos usando el formulario.
   - Filtra por descripción, tipo o categoría.
   - Edita o elimina transacciones existentes desde la tabla.

5. **Categorías**
   - Agrega nuevas categorías para organizar tus gastos e ingresos.
   - Edita o elimina categorías (al eliminar una, también se eliminan sus transacciones asociadas).

6. **Presupuestos**
   - Asigna un monto estimado a cada categoría y mes.
   - Edita o elimina presupuestos según lo necesites.
   - Si superas el presupuesto de una categoría, se mostrará una alerta visual.

7. **Sonidos**
   - Al registrar transacciones o presupuestos, escucharás un sonido de confirmación.
