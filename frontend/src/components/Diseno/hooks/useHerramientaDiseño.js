import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import articulosService from "../../../services/articulosService";
import objetosService from "../../../services/objetosService";
import diseniosBaseService from "../../../services/diseniosBaseService";
import disenosService from "../../../services/disenosService";
import cartService from "../../../services/cartService";
import { configurarImagenesVistas, calcularPosicionElemento } from "../utils/disenoHelpers";


import { Analytics } from "../../../services/analytics";

export const useHerramientaDiseño = (onDisenoGuardado, disenoIdParaEditar = null) => {
  const navigate = useNavigate();
  
  const [elementosPorVista, setElementosPorVista] = useState({
    frente: [],
    izquierda: [],
    derecha: [],
    detras: []
  });
  const [selectedId, setSelectedId] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [todosLosObjetos, setTodosLosObjetos] = useState([]);
  const [objetoSeleccionado, setObjetoSeleccionado] = useState(null);
  const [diseniosBase, setDiseniosBase] = useState([]);
  const [vistaActual, setVistaActual] = useState('frente');
  const [imagenesVistas, setImagenesVistas] = useState({
    frente: null,
    izquierda: null,
    derecha: null,
    detras: null
  });
  const [loading, setLoading] = useState(true);
  const [guardandoDiseno, setGuardandoDiseno] = useState(false);
  const [agregandoAlCarrito, setAgregandoAlCarrito] = useState(false);

  // Estados para edición
  const [textInputValue, setTextInputValue] = useState("");
  const [textStyle, setTextStyle] = useState({ 
    fontSize: 20, 
    fill: "#000000", 
    fontFamily: "Arial", 
    fontStyle: "normal" 
  });
  const [imageEditMode, setImageEditMode] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 100, height: 100 });
  const [currentImageRotation, setCurrentImageRotation] = useState(0);

  // Referencias
  const stageRef = useRef(null);
  const inputRef = useRef(null);

  // Constantes
  const canvasWidth = 400;
  const canvasHeight = 500;

  // Función auxiliar para obtener elementos de la vista actual
  const elementos = elementosPorVista[vistaActual] || [];
  
  // Función auxiliar para actualizar elementos de la vista actual
  const setElementos = (callback) => {
    setElementosPorVista(prev => ({
      ...prev,
      [vistaActual]: typeof callback === 'function' ? callback(prev[vistaActual] || []) : callback
    }));
  };

  // Reemplazar elementos de la vista actual desde fuera (p. ej., al editar)
  const replaceElements = (elements) => {
    setElementos(elements || []);
    setSelectedId(null);
    setImageEditMode(false);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [articulosData, diseniosData] = await Promise.all([
          articulosService.getArticulos(),
          diseniosBaseService.getAll()
        ]);
        setArticulos(articulosData);
        setDiseniosBase(diseniosData);
        
        // Cargar todos los objetos de todos los artículos
        const todosObjetos = [];
        for (const articulo of articulosData) {
          try {
            const objetosArticulo = await objetosService.getObjetos(articulo.id);
            // Agregar información del artículo a cada objeto
            const objetosConArticulo = objetosArticulo.map(objeto => ({
              ...objeto,
              articulo_nombre: articulo.nombre,
              articulo_descripcion: articulo.descripcion
            }));
            todosObjetos.push(...objetosConArticulo);
          } catch (error) {
            console.error(`Error al cargar objetos del artículo ${articulo.id}:`, error);
          }
        }
        setTodosLosObjetos(todosObjetos);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (disenoIdParaEditar && todosLosObjetos.length > 0 && diseniosBase.length > 0 && articulos.length > 0) {
      const cargarDiseno = async () => {
        try {
          setLoading(true);
          const diseno = await disenosService.getDiseno(disenoIdParaEditar);
          
          if (diseno.elementos_por_vista) {
            setElementosPorVista(diseno.elementos_por_vista);
          }
          
          if (diseno.vista_actual) {
            setVistaActual(diseno.vista_actual);
          }
          
          if (diseno.objeto_id) {
            const objeto = todosLosObjetos.find(o => o.id === diseno.objeto_id);
            if (objeto) {
              setObjetoSeleccionado(objeto);
              const imagenesConfiguradas = configurarImagenesVistas(objeto, diseniosBase, articulos);
              setImagenesVistas(imagenesConfiguradas);
            }
          }
          
          setSelectedId(null);
          setImageEditMode(false);
        } catch (error) {
          console.error('Error cargando diseño:', error);
        } finally {
          setLoading(false);
        }
      };
      cargarDiseno();
    }
  }, [disenoIdParaEditar, todosLosObjetos.length, diseniosBase.length, articulos.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      const selectedElement = elementos.find((el) => el.id === selectedId);
      if (!selectedElement) return;
      if (selectedElement.type === "text" && document.activeElement === inputRef.current) return;

      switch (e.key) {
        case "Delete":
          e.preventDefault();
          eliminarElemento(selectedId);
          break;
        case "d":
        case "D":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            duplicarElemento(selectedId);
          }
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elementos, vistaActual]);

  // Escape key handler
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setImageEditMode(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  // Funciones de manipulación de elementos
  const agregarTexto = () => {
    const marginY = 120;
    const fontSize = 20;
    const text = "Texto";
    const estimatedWidth = text.length * fontSize * 0.6;
    const x = (canvasWidth - estimatedWidth) / 2;
    const y = marginY;
    
    const nuevoTexto = { 
      id: Date.now(), 
      type: "text", 
      x, 
      y, 
      text, 
      fontSize, 
      fill: "#000000", 
      fontFamily: "Arial", 
      fontStyle: "normal", 
      rotation: 0, 
      scale: 1 
    };
    setElementos((prev) => [...prev, nuevoTexto]);
    
    setSelectedId(nuevoTexto.id);
    setImageEditMode(false);
    setTextInputValue(text);
    setTextStyle({ fontSize, fill: "#000000", fontFamily: "Arial", fontStyle: "normal", rotation: 0, scale: 1 });
    
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const agregarImagen = (url, originalWidth = 100, originalHeight = 100) => {
    const marginY = 120;
    
    // Escalar la imagen si es muy grande, manteniendo la proporción
    const maxWidth = 200;
    const maxHeight = 200;
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }
    
    const x = (canvasWidth - width) / 2;
    const y = marginY;
    
    const nuevaImagen = { 
      id: Date.now(), 
      type: "image", 
      x, 
      y, 
      url, 
      width: Math.round(width), 
      height: Math.round(height), 
      rotation: 0, 
      draggable: true 
    };
    setElementos((prev) => [...prev, nuevaImagen]);
    
    setSelectedId(nuevaImagen.id);
    setImageEditMode(true);
    setImageDimensions({ width: Math.round(width), height: Math.round(height) });
    setCurrentImageRotation(0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }
    const url = URL.createObjectURL(file);
    
    // Crear una imagen temporal para obtener las dimensiones originales
    const img = new Image();
    img.onload = () => {
      agregarImagen(url, img.width, img.height);
    };
    img.src = url;
    
    e.target.value = "";
  };

  const handleObjetoSelect = (objeto) => {
    setObjetoSeleccionado(objeto);
    const imagenesConfiguradas = configurarImagenesVistas(objeto, diseniosBase, articulos);
    setImagenesVistas(imagenesConfiguradas);
  };

  const cambiarVista = (vista) => {
    setVistaActual(vista);
    // Limpiar selección al cambiar de vista
    setSelectedId(null);
    setImageEditMode(false);
  };

  const posicionarElemento = (posicion) => {
    if (!selectedId) return;
    
    const elemento = elementos.find(el => el.id === selectedId);
    if (!elemento) return;

    const elementWidth = elemento.width || (elemento.text ? elemento.text.length * (elemento.fontSize || 16) * 0.6 : 100);
    const elementHeight = elemento.height || (elemento.fontSize || 16);

    const { x, y } = calcularPosicionElemento(posicion, canvasWidth, canvasHeight, elementWidth, elementHeight);
    actualizarElemento(selectedId, { x, y });
  };

  const captureAndUploadViews = async () => {
    try {
      setGuardandoDiseno(true);

      if (!stageRef.current || !objetoSeleccionado) {
        alert('Selecciona un objeto antes de guardar');
        return null;
      }

      const nombreIngresado = prompt("Ingresa un nombre para tu diseño:", 
        `Diseño ${objetoSeleccionado.articulo_nombre} ${new Date().toLocaleDateString()}`);
      
      if (!nombreIngresado) {
        setGuardandoDiseno(false);
        return null;
      }

      const elementoSeleccionadoAntes = selectedId;
      setSelectedId(null);
      setImageEditMode(false);
      
      await new Promise(resolve => requestAnimationFrame(resolve));

      const toDataURL = async (url) => {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

      const procesarElementosPorVista = async () => {
        const resultado = {};
        for (const vista of ['frente', 'detras', 'izquierda', 'derecha']) {
          const elementosVista = elementosPorVista[vista] || [];
          const procesados = [];
          
          for (const el of elementosVista) {
            if (el?.type === 'image' && el.url && !el.url.startsWith('data:')) {
              const dataurl = await toDataURL(el.url);
              procesados.push({ ...el, url: dataurl || el.url });
            } else {
              procesados.push(el);
            }
          }
          resultado[vista] = procesados;
        }
        return resultado;
      };

      const elementosProcesados = await procesarElementosPorVista();

      const stage = stageRef.current;
      const dataURL = stage.toDataURL({ pixelRatio: 2 });

      setSelectedId(elementoSeleccionadoAntes);
      if (elementoSeleccionadoAntes) {
        const elemento = elementos.find(el => el.id === elementoSeleccionadoAntes);
        if (elemento?.type === "image") {
          setImageEditMode(true);
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para guardar tus diseños');
        setGuardandoDiseno(false);
        return null;
      }

      const disenoData = {
        nombre: nombreIngresado,
        objeto_id: objetoSeleccionado.id,
        elementos_por_vista: elementosProcesados,
        vista_actual: vistaActual,
        imagen_preview: dataURL,
        costo: objetoSeleccionado.precio || 0
      };

      let response;
      if (disenoIdParaEditar) {
        response = await disenosService.actualizarDiseno(disenoIdParaEditar, disenoData);
      } else {
        response = await disenosService.guardarDiseno(disenoData);
      }

      if (onDisenoGuardado) {
        onDisenoGuardado();
      }

      // --- 🛑 2. AÑADE EL EVENTO DE GOOGLE ANALYTICS AQUÍ ---
      // Lo ponemos ANTES del 'alert', ya que el alert pausa el navegador
      // y nos da tiempo de sobra para enviar el evento.
      try {
        console.log("--- 🛑 ENVIANDO EVENTO 'save_design' A GA ---");
        Analytics.trackEvent("save_design", {
          category: "Design",
          label: nombreIngresado, // ¡Usamos el nombre que el usuario ingresó!
          // (Opcional) puedes enviar más datos si quieres
          item_id: objetoSeleccionado.id, 
          item_name: objetoSeleccionado.articulo_nombre,
        });
      } catch (gaError) {
        console.error("Error al enviar evento a GA:", gaError);
      }
      // --- FIN DE GOOGLE ANALYTICS ---

      alert(disenoIdParaEditar ? 'Diseño actualizado correctamente' : 'Diseño guardado correctamente');
      navigate('/disenos');

      return response?.id || disenoIdParaEditar;
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el diseño');
      return null;
    } finally {
      setGuardandoDiseno(false);
    }
  };

  const saveAndAddToCart = async () => {
    setAgregandoAlCarrito(true);
    try {
      const designId = await captureAndUploadViews();
      if (!designId) return;
      
      await cartService.addItem({ id: objetoSeleccionado.articulo_id }, 1, { designId });
      alert('Diseño agregado al carrito');
      // Navegar al carrito
      navigate('/cart');
    } catch (e) {
      console.error('Error al agregar al carrito', e);
      alert('No se pudo agregar al carrito');
    } finally {
      setAgregandoAlCarrito(false);
    }
  };

  const actualizarElemento = (id, cambios) => {
    setElementos((prev) => prev.map((el) => (el.id === id ? { ...el, ...cambios } : el)));
    
    // Force re-render del canvas para cambios inmediatos
    if (stageRef.current) {
      requestAnimationFrame(() => {
        stageRef.current.batchDraw();
      });
    }
  };

  const actualizarRotacionImagen = (id, rotation) => {
    let newRotation = Math.round(Number(rotation)) || 0;
    
    // Normalizar rotación a rango 0-360
    newRotation = ((newRotation % 360) + 360) % 360;
    
    // Actualizar elemento inmediatamente
    actualizarElemento(id, { rotation: newRotation });
    
    // Sincronizar estado local
    setCurrentImageRotation(newRotation);
  };

  // Función para sincronizar estados en tiempo real durante transformaciones
  const sincronizarEstadoTexto = (id, fontSize, rotation) => {
    if (selectedId === id) {
      setTextStyle(prev => ({ ...prev, fontSize }));
    }
  };

  const sincronizarEstadoImagen = (id, rotation, width, height) => {
    if (selectedId === id) {
      // Normalizar rotación a números enteros 0-360
      let normalizedRotation = Math.round(rotation);
      normalizedRotation = ((normalizedRotation % 360) + 360) % 360;
      
      setCurrentImageRotation(normalizedRotation);
      setImageDimensions({ width: Math.round(width), height: Math.round(height) });
    }
  };

  const eliminarElemento = (id) => {
    setElementos((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setImageEditMode(false);
    }
  };

  const duplicarElemento = (id) => {
    const elemento = elementos.find((el) => el.id === id);
    if (!elemento) return;
    const nuevoElemento = { ...elemento, id: Date.now(), x: elemento.x + 20, y: elemento.y + 20 };
    setElementos((prev) => [...prev, nuevoElemento]);
    setSelectedId(nuevoElemento.id);
    if (elemento.type === "image") {
      setImageEditMode(true);
      setImageDimensions({ width: elemento.width, height: elemento.height });
    }
  };

  const cambiarCapaElemento = (id, direccion) => {
    const index = elementos.findIndex((el) => el.id === id);
    if (index === -1) return;
    const nuevosElementos = [...elementos];
    const elemento = nuevosElementos[index];
    if (direccion === "arriba" && index < elementos.length - 1) {
      nuevosElementos[index] = nuevosElementos[index + 1];
      nuevosElementos[index + 1] = elemento;
    } else if (direccion === "abajo" && index > 0) {
      nuevosElementos[index] = nuevosElementos[index - 1];
      nuevosElementos[index - 1] = elemento;
    }
    setElementos(nuevosElementos);
  };

  const actualizarDimensionesImagen = (id, width, height) => {
    const newWidth = Math.max(20, width);
    const newHeight = Math.max(20, height);
    
    // Actualizar elemento en canvas inmediatamente
    actualizarElemento(id, { width: newWidth, height: newHeight });
    
    // Sincronizar estado local
    setImageDimensions({ width: newWidth, height: newHeight });
    
    // Force re-render del canvas
    if (stageRef.current) {
      stageRef.current.batchDraw();
    }
  };

  const handleSelectElement = (el) => {
    setSelectedId(el.id);
    if (el.type === "text") {
      setImageEditMode(false);
      setTextInputValue(el.text);
      setTextStyle({ 
        fontSize: el.fontSize, 
        fill: el.fill, 
        fontFamily: el.fontFamily || "Arial", 
        fontStyle: el.fontStyle || "normal", 
        rotation: el.rotation || 0, 
        scale: el.scale || 1 
      });
      setTimeout(() => inputRef.current?.focus(), 10);
    } else if (el.type === "image") {
      setImageEditMode(true);
      setImageDimensions({ width: el.width, height: el.height });
      
      // Normalizar rotación a entero 0-360
      let normalizedRotation = Math.round(el.rotation || 0);
      normalizedRotation = ((normalizedRotation % 360) + 360) % 360;
      setCurrentImageRotation(normalizedRotation);
    }
  };

  const handleTextInputChange = (e) => {
    setTextInputValue(e.target.value);
    actualizarElemento(selectedId, { text: e.target.value });
  };

  // Función para cargar un diseño existente
  const cargarDiseno = async (disenoId) => {
    try {
      console.log("=== CARGANDO DISEÑO ===");
      console.log("ID del diseño:", disenoId);
      console.log("Objetos disponibles:", todosLosObjetos.length);
      
      setLoading(true);
      const diseno = await disenosService.getDiseno(disenoId);
      console.log("Diseño obtenido:", diseno);
      
      // Buscar el objeto correspondiente
      const objeto = todosLosObjetos.find(obj => obj.id === diseno.objeto_id);
      console.log("Objeto encontrado:", objeto);
      
      if (!objeto) {
        alert("No se encontró el objeto asociado a este diseño. Puede que ya no esté disponible.");
        return;
      }
      
      // Seleccionar el objeto
      console.log("Seleccionando objeto...");
      handleObjetoSelect(objeto);
      
      // Cargar elementos completos
      try {
        let elementosCargados = {};
        
        // Opción 1: Si hay elementos_por_vista (nuevo formato)
        if (diseno.elementos_por_vista) {
          console.log("Cargando elementos por vista (formato nuevo)");
          elementosCargados = diseno.elementos_por_vista;
          
          // Asegurar que todas las vistas existen
          elementosCargados = {
            frente: elementosCargados.frente || [],
            izquierda: elementosCargados.izquierda || [],
            derecha: elementosCargados.derecha || [],
            detras: elementosCargados.detras || []
          };
        } 
        // Opción 2: Si hay elementos (formato legacy)
        else if (diseno.elementos) {
          console.log("Cargando elementos (formato legacy)");
          const elementosArray = Array.isArray(diseno.elementos) 
            ? diseno.elementos 
            : [];
          
          // Colocar todos en la vista actual (frente por defecto)
          elementosCargados = {
            frente: elementosArray,
            izquierda: [],
            derecha: [],
            detras: []
          };
        }
        // Opción 3: No hay elementos, crear vacío
        else {
          console.log("No hay elementos guardados");
          elementosCargados = {
            frente: [],
            izquierda: [],
            derecha: [],
            detras: []
          };
        }
        
        console.log("Elementos cargados por vista:", {
          frente: elementosCargados.frente?.length || 0,
          izquierda: elementosCargados.izquierda?.length || 0,
          derecha: elementosCargados.derecha?.length || 0,
          detras: elementosCargados.detras?.length || 0,
        });
        
        // Regenerar IDs únicos para evitar conflictos
        const regenerarIds = (elementos) => {
          return elementos.map((el, index) => ({
            ...el,
            id: Date.now() + index + Math.random() * 1000
          }));
        };
        
        // Establecer elementos por vista con IDs regenerados
        setElementosPorVista({
          frente: regenerarIds(elementosCargados.frente || []),
          izquierda: regenerarIds(elementosCargados.izquierda || []),
          derecha: regenerarIds(elementosCargados.derecha || []),
          detras: regenerarIds(elementosCargados.detras || [])
        });
        
        // Establecer vista actual
        const vistaInicial = diseno.vista_actual || 'frente';
        setVistaActual(vistaInicial);
        
        // Guardar ID y nombre del diseño para permitir actualización
        setDisenoIdActual(diseno.id);
        setNombreDisenoActual(diseno.nombre_diseno);
        
        // Limpiar selección
        setSelectedId(null);
        setImageEditMode(false);
        
        const totalElementos = 
          (elementosCargados.frente?.length || 0) +
          (elementosCargados.izquierda?.length || 0) +
          (elementosCargados.derecha?.length || 0) +
          (elementosCargados.detras?.length || 0);
        
        console.log(
          `✅ Diseño "${diseno.nombre_diseno}" cargado exitosamente!\n` +
          `📦 Objeto: ${objeto.articulo_nombre}\n` +
          `🎨 Elementos: ${totalElementos}\n` +
          `👁️ Vista: ${vistaInicial}`
        );
        
      } catch (error) {
        console.error("Error al parsear elementos del diseño:", error);
        console.warn("El diseño se cargó pero hubo un error al recuperar los elementos:", error.message);
      }
    } catch (error) {
      console.error("Error al cargar diseño:", error);
      console.error("Detalles del error:", error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados
    elementos,
    selectedId,
    setSelectedId,
    articulos,
    todosLosObjetos,
    objetoSeleccionado,
    diseniosBase,
    vistaActual,
    imagenesVistas,
    loading,
    guardandoDiseno,
    agregandoAlCarrito,
    textInputValue,
    textStyle,
    setTextStyle,
    imageEditMode,
    setImageEditMode,
    imageDimensions,
    currentImageRotation,
    setCurrentImageRotation,
    canvasWidth,
    canvasHeight,
    
    // Referencias
    stageRef,
    inputRef,
    
    // Funciones
    agregarTexto,
    agregarImagen,
    handleImageUpload,
    handleObjetoSelect,
    cambiarVista,
    posicionarElemento,
    captureAndUploadViews,
    replaceElements,
    saveAndAddToCart,
    actualizarElemento,
    eliminarElemento,
    duplicarElemento,
    cambiarCapaElemento,
    actualizarDimensionesImagen,
    actualizarRotacionImagen,
    sincronizarEstadoTexto,
    sincronizarEstadoImagen,
    handleSelectElement,
    handleTextInputChange,
    cargarDiseno
  };
};