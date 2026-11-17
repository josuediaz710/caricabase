(() => {
  const menuButton = document.querySelector(".menu-toggle");
  if (menuButton) {
    const navigation = document.getElementById(menuButton.getAttribute("aria-controls"));
    if (navigation) {
      menuButton.addEventListener("click", () => {
        const expanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!expanded));
        navigation.classList.toggle("open", !expanded);
      });
    }
  }

  let isTransitioning = false;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || link.target
      || link.hasAttribute("download")
      || new URL(link.href, window.location.href).pathname.split("/").pop() !== "database.html"
      || window.location.pathname.split("/").pop() === "database.html"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    event.preventDefault();
    if (isTransitioning) return;
    isTransitioning = true;

    const transition = document.createElement("div");
    transition.className = "papaya-transition";
    transition.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 7; index += 1) {
      const papaya = document.createElement("img");
      papaya.src = "papaya-whole.svg";
      papaya.alt = "";
      transition.append(papaya);
    }
    document.body.append(transition);
    requestAnimationFrame(() => transition.classList.add("is-active"));
    window.setTimeout(() => window.location.assign(link.href), 1250);
  });

  const databasePage = document.querySelector(".database-page");
  if (!databasePage) return;

  const tableList = document.getElementById("table-list");
  const dataTable = document.getElementById("data-table");
  const tableTitle = document.getElementById("active-table-title");
  const rowCount = document.getElementById("row-count");
  const tableSubtitle = document.getElementById("table-subtitle");
  const searchInput = document.getElementById("table-search");
  const storageStatus = document.getElementById("storage-status");
  const editDialog = document.getElementById("edit-dialog");
  const columnsDialog = document.getElementById("columns-dialog");
  const authPanel = document.getElementById("auth-panel");
  const loginForm = document.getElementById("login-form");
  const authStatus = document.getElementById("auth-status");
  const accountBar = document.getElementById("account-bar");
  const accountEmail = document.getElementById("account-email");
  const logoutButton = document.getElementById("logout-button");
  const workspace = document.querySelector(".database-workspace");
  const databaseModel = document.querySelector(".database-model");

  const supabaseConfig = window.CARICABASE_SUPABASE_CONFIG;
  const supabaseClient = window.supabase && supabaseConfig
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
    : null;

  const makeColumns = (fields) => fields.map(([id, name, type]) => ({ id, name, type }));
  const makeTable = (id, name, fields, rows = []) => ({
    id,
    name,
    columns: makeColumns(fields),
    rows,
  });

  const createDefaultState = () => ({
    version: 1,
    activeTableId: "fruta",
    tables: [
      makeTable("fruta", "Fruta", [
        ["id_fruta", "ID fruta", "text"],
        ["nom_fruta", "Nombre", "text"],
        ["clasificacion", "Clasificación", "text"],
      ], [
        { id_fruta: "F-01", nom_fruta: "Papaya", clasificacion: "Fruta tropical" },
      ]),
      makeTable("variedad", "Variedad", [
        ["id_variedad", "ID variedad", "text"],
        ["nom_variedad", "Variedad", "text"],
        ["color_predominante", "Color predominante", "text"],
        ["id_fruta", "ID fruta", "text"],
      ], [
        { id_variedad: "V-01", nom_variedad: "Maradol", color_predominante: "Por registrar", id_fruta: "F-01" },
        { id_variedad: "V-02", nom_variedad: "Tainung", color_predominante: "Por registrar", id_fruta: "F-01" },
        { id_variedad: "V-03", nom_variedad: "Solo", color_predominante: "Por registrar", id_fruta: "F-01" },
      ]),
      makeTable("maquina", "Máquina", [
        ["id_maquina", "ID máquina", "text"],
        ["nom_maquina", "Nombre", "text"],
        ["tipo_maquina", "Tipo", "text"],
        ["marca", "Marca", "text"],
        ["modelo", "Modelo", "text"],
        ["capacidad_kg", "Capacidad (kg)", "number"],
        ["temperatura_max_c", "Temperatura máx. (°C)", "number"],
      ]),
      makeTable("preparacion", "Preparación", [
        ["id_preparacion", "ID preparación", "text"],
        ["peso_fruta_total_g", "Peso de fruta (g)", "number"],
        ["cantidad_frutas", "Cantidad de frutas", "number"],
        ["merma_preparacion_g", "Merma (g)", "number"],
        ["pelado", "Pelado", "text"],
        ["tipo_corte", "Tipo de corte", "text"],
        ["tratamiento_previo", "Tratamiento previo", "text"],
        ["id_variedad", "ID variedad", "text"],
      ]),
      makeTable("experimento", "Experimento", [
        ["id_experimento", "ID experimento", "text"],
        ["fecha_experimento", "Fecha", "date"],
        ["hora_inicio", "Hora de inicio", "time"],
        ["hora_fin", "Hora de finalización", "time"],
        ["temperatura_trabaj", "Temperatura de trabajo (°C)", "number"],
        ["observaciones", "Observaciones", "text"],
        ["id_maquina", "ID máquina", "text"],
      ]),
      makeTable("muestra", "Muestra", [
        ["id_muestra", "ID muestra", "text"],
        ["peso_inicial_g", "Peso inicial (g)", "number"],
        ["grado_madurez", "Grado de madurez", "text"],
        ["estado_fruta", "Estado de la fruta", "text"],
        ["fecha_preparacion", "Fecha de preparación", "date"],
        ["id_preparacion", "ID preparación", "text"],
        ["id_experimento", "ID experimento", "text"],
      ]),
      makeTable("medicion", "Medición", [
        ["id_medicion", "ID medición", "text"],
        ["hora_medicion", "Hora de medición", "time"],
        ["tiempo_transcurrido_min", "Tiempo transcurrido (min)", "number"],
        ["peso_g", "Peso (g)", "number"],
        ["id_experimento", "ID experimento", "text"],
        ["id_muestra", "ID muestra", "text"],
      ]),
    ],
  });

  const newId = (prefix) => {
    const value = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${value}`;
  };

  const validState = (value) => value
    && value.version === 1
    && Array.isArray(value.tables)
    && value.tables.every((table) => (
      typeof table.id === "string"
      && typeof table.name === "string"
      && Array.isArray(table.columns)
      && table.columns.every((column) => (
        typeof column.id === "string"
        && typeof column.name === "string"
        && ["text", "number", "date", "time"].includes(column.type)
      ))
      && Array.isArray(table.rows)
      && table.rows.every((row) => row && typeof row === "object" && !Array.isArray(row))
    ));

  let state = createDefaultState();
  let cloudVersion = null;
  let saveBlocked = false;
  let saveQueue = Promise.resolve();

  const getActiveTable = () => state.tables.find((table) => table.id === state.activeTableId);

  const setStatus = (message, isError = false) => {
    storageStatus.textContent = message;
    storageStatus.classList.toggle("error", isError);
  };

  const setAuthStatus = (message, isError = false) => {
    authStatus.textContent = message;
    authStatus.classList.toggle("error", isError);
  };

  const persist = () => {
    if (!supabaseClient || cloudVersion === null) {
      setStatus("Inicia sesión para guardar los cambios.", true);
      return false;
    }

    const snapshot = JSON.parse(JSON.stringify(state));
    saveQueue = saveQueue.then(async () => {
      if (saveBlocked) return;
      setStatus("Sincronizando cambios con Supabase…");
      const { data, error } = await supabaseClient.rpc("save_caricabase_state", {
        p_payload: snapshot,
        p_expected_version: cloudVersion,
      });
      if (error) throw error;
      if (data === null || data === undefined) {
        saveBlocked = true;
        setStatus("Otra persona guardó cambios primero. Recarga la página antes de seguir editando.", true);
        return;
      }

      cloudVersion = Number(data);
      if (!Number.isSafeInteger(cloudVersion)) {
        saveBlocked = true;
        throw new Error("Supabase devolvió una versión de datos no válida.");
      }
      setStatus("Cambios guardados y compartidos con el equipo.");
    }).catch((error) => {
      saveBlocked = true;
      const detail = error instanceof Error ? error.message : "Error desconocido.";
      setStatus(`No se pudieron guardar los cambios en Supabase. ${detail}`, true);
    });
    return true;
  };

  const showDatabase = (visible) => {
    authPanel.hidden = visible;
    accountBar.hidden = !visible;
    workspace.hidden = !visible;
    databaseModel.hidden = !visible;
  };

  const loadSharedState = async (user) => {
    accountEmail.textContent = user.email || "Usuario del equipo";
    accountBar.hidden = false;
    setAuthStatus("Cargando los datos compartidos…");
    const { data, error } = await supabaseClient
      .from("caricabase_state")
      .select("payload, version")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error("No existe el estado inicial. Ejecuta supabase-schema.sql en Supabase SQL Editor.");
    }
    if (!validState(data.payload)) {
      throw new Error("El estado compartido no tiene el formato esperado.");
    }

    state = data.payload;
    if (!state.tables.some((table) => table.id === state.activeTableId)) {
      state.activeTableId = state.tables[0] ? state.tables[0].id : "";
    }
    cloudVersion = Number(data.version);
    if (!Number.isSafeInteger(cloudVersion)) {
      throw new Error("La versión del estado compartido no es válida.");
    }
    saveBlocked = false;
    showDatabase(true);
    render();
    setAuthStatus("");
    setStatus("Datos cargados desde Supabase.");
  };

  const initializeCloud = async () => {
    showDatabase(false);
    if (!supabaseClient) {
      setAuthStatus("No se pudo iniciar Supabase. Revisa la configuración y vuelve a cargar la página.", true);
      return;
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      setAuthStatus(`No se pudo comprobar la sesión. ${error.message}`, true);
      return;
    }
    if (!data.session) {
      setAuthStatus("Inicia sesión con la cuenta del equipo.");
      return;
    }

    try {
      await loadSharedState(data.session.user);
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : "Error desconocido.";
      setAuthStatus(`No se pudieron cargar los datos compartidos. ${detail}`, true);
    }
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const createActionButton = (label, action, className = "") => {
    const button = createElement("button", className, label);
    button.type = "button";
    button.dataset.action = action;
    return button;
  };

  const renderTableList = () => {
    tableList.replaceChildren();
    state.tables.forEach((table) => {
      const button = createElement("button", "table-nav-item");
      button.type = "button";
      button.dataset.action = "select-table";
      button.dataset.tableId = table.id;
      button.setAttribute("role", "listitem");
      if (table.id === state.activeTableId) button.setAttribute("aria-current", "true");

      button.append(
        createElement("span", "table-nav-icon", "▦"),
        createElement("span", "table-nav-name", table.name),
        createElement("span", "table-count", String(table.rows.length).padStart(2, "0")),
      );
      tableList.append(button);
    });
  };

  const renderTableBody = (table) => {
    const body = createElement("tbody");
    const query = searchInput.value.trim().toLocaleLowerCase("es");
    const matchingRows = table.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !query || table.columns.some((column) => (
        String(row[column.id] ?? "").toLocaleLowerCase("es").includes(query)
      )));

    if (matchingRows.length === 0) {
      const tr = createElement("tr");
      const td = createElement("td", "table-empty", query
        ? "No se encontraron registros que coincidan con la búsqueda."
        : "Esta tabla todavía no tiene registros.");
      td.colSpan = Math.max(1, table.columns.length + 1);
      tr.append(td);
      body.append(tr);
      return body;
    }

    matchingRows.forEach(({ row, index }) => {
      const tr = document.createElement("tr");
      table.columns.forEach((column) => {
        tr.append(createElement("td", "", String(row[column.id] ?? "")));
      });
      const actions = createElement("td", "actions-cell");
      actions.append(
        createActionButton("Editar", "edit-record", "row-action"),
        document.createTextNode(" · "),
        createActionButton("Eliminar", "delete-record", "row-action delete"),
      );
      actions.querySelectorAll("button").forEach((button) => {
        button.dataset.rowIndex = String(index);
      });
      tr.append(actions);
      body.append(tr);
    });
    return body;
  };

  const renderActiveTable = () => {
    const table = getActiveTable();
    const hasTable = Boolean(table);
    document.querySelectorAll("[data-action='rename-table'], [data-action='delete-table'], [data-action='create-record'], [data-action='manage-columns']")
      .forEach((button) => { button.disabled = !hasTable; });
    searchInput.disabled = !hasTable;

    if (!table) {
      tableTitle.textContent = "Sin tablas";
      rowCount.textContent = "0 registros";
      tableSubtitle.textContent = "Crea una tabla para comenzar.";
      const caption = createElement("caption", "visually-hidden", "No hay tablas en la base de datos");
      const body = createElement("tbody");
      const row = document.createElement("tr");
      const cell = createElement("td", "table-empty", "No hay tablas. Usa «Crear una tabla» para comenzar.");
      row.append(cell);
      body.append(row);
      dataTable.replaceChildren(caption, body);
      return;
    }

    tableTitle.textContent = table.name;
    rowCount.textContent = `${table.rows.length} ${table.rows.length === 1 ? "registro" : "registros"}`;
    tableSubtitle.textContent = `${table.columns.length} ${table.columns.length === 1 ? "columna" : "columnas"}`;

    const caption = createElement("caption", "visually-hidden", `Registros de ${table.name}`);
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    table.columns.forEach((column) => headerRow.append(createElement("th", "", column.name)));
    headerRow.append(createElement("th", "actions-cell", "Acciones"));
    head.append(headerRow);
    dataTable.replaceChildren(caption, head, renderTableBody(table));
  };

  const render = () => {
    renderTableList();
    renderActiveTable();
  };

  const openFormDialog = ({ title, description = "", fields, initial = {}, submitLabel = "Guardar", onSave }) => {
    editDialog.replaceChildren();
    const form = document.createElement("form");
    form.noValidate = false;
    const heading = createElement("div", "dialog-heading");
    const headingCopy = document.createElement("div");
    headingCopy.append(
      createElement("p", "eyebrow", "Datos del proyecto"),
      createElement("h2", "", title),
    );
    const closeButton = createActionButton("×", "close-dialog", "dialog-close");
    closeButton.setAttribute("aria-label", "Cerrar");
    heading.append(headingCopy, closeButton);
    form.append(heading);
    if (description) form.append(createElement("p", "field-hint dialog-description", description));

    const fieldContainer = createElement("div", "record-fields");
    fields.forEach((field) => {
      const label = createElement("label", "form-field", field.label);
      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 3;
      } else if (field.type === "select") {
        input = document.createElement("select");
        field.options.forEach((option) => input.append(createElement("option", "", option)));
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
      }
      input.name = field.id;
      input.id = `form-${field.id}`;
      if (field.required) input.required = true;
      if (field.maxLength) input.maxLength = field.maxLength;
      if (field.step) input.step = field.step;
      if (field.placeholder) input.placeholder = field.placeholder;
      input.value = String(initial[field.id] ?? "");
      label.htmlFor = input.id;
      label.append(input);
      fieldContainer.append(label);
    });
    form.append(fieldContainer);

    const error = createElement("p", "dialog-error");
    error.setAttribute("role", "alert");
    form.append(error);
    const actions = createElement("div", "dialog-actions");
    const cancelButton = createActionButton("Cancelar", "close-dialog", "button button-quiet button-small");
    const saveButton = createElement("button", "button button-primary button-small", submitLabel);
    saveButton.type = "submit";
    actions.append(cancelButton, saveButton);
    form.append(actions);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const message = onSave(values);
      if (message) {
        error.textContent = message;
        return;
      }
      editDialog.close();
      render();
    });
    editDialog.append(form);
    editDialog.showModal();
    const firstInput = form.querySelector("input, textarea, select");
    if (firstInput) firstInput.focus();
  };

  const createTable = () => openFormDialog({
    title: "Crear una tabla",
    description: "Añade una entidad para organizar información relacionada con los ensayos.",
    fields: [{ id: "name", label: "Nombre de la tabla", required: true, placeholder: "Ej. Lote" }],
    onSave: ({ name }) => {
      const normalizedName = name.trim();
      if (state.tables.some((table) => table.name.toLocaleLowerCase("es") === normalizedName.toLocaleLowerCase("es"))) {
        return "Ya existe una tabla con ese nombre.";
      }
      const id = newId("table");
      state.tables.push({
        id,
        name: normalizedName,
        columns: [{ id: newId("column"), name: "Nombre", type: "text" }],
        rows: [],
      });
      state.activeTableId = id;
      searchInput.value = "";
      persist();
      return "";
    },
  });

  const renameTable = (table) => openFormDialog({
    title: "Renombrar tabla",
    fields: [{ id: "name", label: "Nombre de la tabla", required: true }],
    initial: { name: table.name },
    onSave: ({ name }) => {
      const normalizedName = name.trim();
      if (state.tables.some((other) => (
        other.id !== table.id
        && other.name.toLocaleLowerCase("es") === normalizedName.toLocaleLowerCase("es")
      ))) return "Ya existe una tabla con ese nombre.";
      table.name = normalizedName;
      persist();
      return "";
    },
  });

  const createRecord = (table) => openFormDialog({
    title: `Agregar registro · ${table.name}`,
    description: "Completa los campos disponibles. Puedes dejar vacíos los datos que aún no se han medido.",
    fields: table.columns.map((column) => ({
      id: column.id,
      label: column.name,
      type: column.type,
    })),
    onSave: (values) => {
      table.rows.push(Object.fromEntries(table.columns.map((column) => [column.id, String(values[column.id] ?? "").trim()])));
      persist();
      return "";
    },
  });

  const editRecord = (table, index) => {
    const row = table.rows[index];
    if (!row) return;
    openFormDialog({
      title: `Editar registro · ${table.name}`,
      fields: table.columns.map((column) => ({
        id: column.id,
        label: column.name,
        type: column.type,
      })),
      initial: row,
      onSave: (values) => {
        table.rows[index] = Object.fromEntries(table.columns.map((column) => [column.id, String(values[column.id] ?? "").trim()]));
        persist();
        return "";
      },
    });
  };

  const openColumnsDialog = (table) => {
    columnsDialog.replaceChildren();
    const heading = createElement("div", "dialog-heading");
    const copy = document.createElement("div");
    copy.append(
      createElement("p", "eyebrow", table.name),
      createElement("h2", "", "Administrar columnas"),
    );
    const closeButton = createActionButton("×", "close-columns", "dialog-close");
    closeButton.setAttribute("aria-label", "Cerrar");
    heading.append(copy, closeButton);
    columnsDialog.append(heading);
    columnsDialog.append(createElement("p", "field-hint", "Puedes cambiar nombres y tipos. Al eliminar una columna también se quitan sus valores de los registros."));

    const list = createElement("div", "column-list");
    table.columns.forEach((column) => {
      const item = createElement("div", "column-item");
      const main = createElement("div", "column-item-main");
      main.append(
        createElement("strong", "", column.name),
        createElement("small", "", column.type),
      );
      const actions = createElement("div", "column-actions");
      const editButton = createActionButton("Editar", "edit-column");
      editButton.dataset.columnId = column.id;
      const deleteButton = createActionButton("Eliminar", "delete-column");
      deleteButton.dataset.columnId = column.id;
      actions.append(editButton, deleteButton);
      item.append(main, actions);
      list.append(item);
    });
    columnsDialog.append(list);

    const form = document.createElement("form");
    form.className = "column-form";
    const nameLabel = createElement("label", "form-field", "Nombre");
    const nameInput = document.createElement("input");
    nameInput.name = "name";
    nameInput.required = true;
    nameInput.maxLength = 80;
    nameInput.placeholder = "Ej. Temperatura de secado";
    nameLabel.append(nameInput);
    const typeLabel = createElement("label", "form-field", "Tipo");
    const typeInput = document.createElement("select");
    typeInput.name = "type";
    [["text", "Texto"], ["number", "Número"], ["date", "Fecha"], ["time", "Hora"]]
      .forEach(([value, label]) => {
        const option = createElement("option", "", label);
        option.value = value;
        typeInput.append(option);
      });
    typeLabel.append(typeInput);
    const addButton = createElement("button", "button button-primary", "＋ Añadir");
    addButton.type = "submit";
    form.append(nameLabel, typeLabel, addButton);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = nameInput.value.trim();
      if (table.columns.some((column) => column.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) {
        nameInput.setCustomValidity("Ya existe una columna con ese nombre.");
        nameInput.reportValidity();
        nameInput.setCustomValidity("");
        return;
      }
      const column = { id: newId("column"), name, type: typeInput.value };
      table.columns.push(column);
      table.rows.forEach((row) => { row[column.id] = ""; });
      persist();
      openColumnsDialog(table);
    });
    columnsDialog.append(form);
    if (!columnsDialog.open) columnsDialog.showModal();
  };

  const editColumn = (table, column) => openFormDialog({
    title: "Editar columna",
    fields: [
      { id: "name", label: "Nombre", required: true },
      { id: "type", label: "Tipo de dato", type: "select", options: ["text", "number", "date", "time"] },
    ],
    initial: { name: column.name, type: column.type },
    onSave: ({ name, type }) => {
      const normalizedName = name.trim();
      if (table.columns.some((other) => (
        other.id !== column.id
        && other.name.toLocaleLowerCase("es") === normalizedName.toLocaleLowerCase("es")
      ))) return "Ya existe una columna con ese nombre.";
      column.name = normalizedName;
      column.type = type;
      persist();
      openColumnsDialog(table);
      return "";
    },
  });

  const removeTable = (table) => {
    if (!window.confirm(`¿Eliminar la tabla «${table.name}» y todos sus registros? Esta acción no se puede deshacer.`)) return;
    state.tables = state.tables.filter((item) => item.id !== table.id);
    state.activeTableId = state.tables.length ? state.tables[0].id : "";
    searchInput.value = "";
    persist();
    render();
  };

  const handleAction = (button) => {
    const action = button.dataset.action;
    const table = getActiveTable();
    if (action === "close-dialog") editDialog.close();
    if (action === "close-columns") columnsDialog.close();
    if (action === "create-table") createTable();
    if (action === "select-table") {
      state.activeTableId = button.dataset.tableId;
      searchInput.value = "";
      render();
    }
    if (action === "rename-table" && table) renameTable(table);
    if (action === "delete-table" && table) removeTable(table);
    if (action === "create-record" && table) createRecord(table);
    if (action === "manage-columns" && table) openColumnsDialog(table);
    if (action === "edit-record" && table) editRecord(table, Number(button.dataset.rowIndex));
    if (action === "delete-record" && table) {
      const index = Number(button.dataset.rowIndex);
      if (table.rows[index] && window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) {
        table.rows.splice(index, 1);
        persist();
        render();
      }
    }
    if (action === "edit-column" && table) {
      const column = table.columns.find((item) => item.id === button.dataset.columnId);
      if (column) editColumn(table, column);
    }
    if (action === "delete-column" && table) {
      if (table.columns.length <= 1) {
        setStatus("Cada tabla debe conservar al menos una columna.", true);
        return;
      }
      const column = table.columns.find((item) => item.id === button.dataset.columnId);
      if (column && window.confirm(`¿Eliminar la columna «${column.name}» y sus valores?`)) {
        table.columns = table.columns.filter((item) => item.id !== column.id);
        table.rows.forEach((row) => { delete row[column.id]; });
        persist();
        openColumnsDialog(table);
        render();
      }
    }
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button && !button.disabled) handleAction(button);
  });
  searchInput.addEventListener("input", () => {
    const table = getActiveTable();
    if (table) {
      const body = renderTableBody(table);
      dataTable.tBodies[0]?.replaceWith(body);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity() || !supabaseClient) return;
    const submitButton = loginForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setAuthStatus("Verificando acceso…");
    const formData = new FormData(loginForm);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: String(formData.get("email")).trim(),
      password: String(formData.get("password")),
    });
    if (error) {
      setAuthStatus(`No se pudo iniciar sesión. ${error.message}`, true);
      submitButton.disabled = false;
      return;
    }

    try {
      await loadSharedState(data.user);
      loginForm.reset();
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : "Error desconocido.";
      setAuthStatus(`La sesión se inició, pero no se pudieron cargar los datos. ${detail}`, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    const { error } = await supabaseClient.auth.signOut();
    logoutButton.disabled = false;
    if (error) {
      setStatus(`No se pudo cerrar la sesión. ${error.message}`, true);
      return;
    }
    cloudVersion = null;
    saveBlocked = true;
    state = createDefaultState();
    searchInput.value = "";
    showDatabase(false);
    accountEmail.textContent = "";
    setAuthStatus("Sesión cerrada.");
    setStatus("");
  });

  void initializeCloud();
})();
