import { useState, useEffect, useRef } from "react";
import articulosService from "../../../services/articulosService";
import objetosService from "../../../services/objetosService";
import diseniosBaseService from "../../../services/diseniosBaseService";
import disenosService from "../../../services/disenosService";
import cartService from "../../../services/cartService";
import { configurarImagenesVistas, calcularPosicionElemento } from "../utils/disenoHelpers";

export const useHerramientaDiseño = (onDisenoGuardado, options = {}) => {
  const { editingId = null, initialElements = null, initialObjeto = null, initialNombre = '', initialElementsByView = null } = options || {};
  // Estados principales
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
  const [nombreDiseno, setNombreDiseno] = useState(initialNombre || '');

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

  // Si estamos en modo edición y recibimos datos iniciales, aplicarlos
  useEffect(() => {
    if (initialElements && Array.isArray(initialElements)) {
      replaceElements(initialElements);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(initialElements) ? initialElements.length : 0]);

  useEffect(() => {
    if (initialObjeto) {
      handleObjetoSelect(initialObjeto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialObjeto?.id]);

  useEffect(() => {
    if (initialElementsByView && typeof initialElementsByView === 'object') {
      setElementosPorVista(prev => ({
        frente: Array.isArray(initialElementsByView.frente) ? initialElementsByView.frente : (prev.frente || []),
        detras: Array.isArray(initialElementsByView.detras) ? initialElementsByView.detras : (prev.detras || []),
        izquierda: Array.isArray(initialElementsByView.izquierda) ? initialElementsByView.izquierda : (prev.izquierda || []),
        derecha: Array.isArray(initialElementsByView.derecha) ? initialElementsByView.derecha : (prev.derecha || []),
      }));
      setVistaActual('frente');
      setSelectedId(null);
      setImageEditMode(false);
    }
  }, [initialElementsByView]);

  // Manejo de teclas
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
    if (!objetoSeleccionado) {
      alert("Primero selecciona un objeto para personalizar");
      return;
    }

    try {
      setGuardandoDiseno(true);
      
      // Guardar el ID del elemento seleccionado actual
      const elementoSeleccionadoAntes = selectedId;
      
      // Deseleccionar temporalmente para que no aparezcan los controles
      setSelectedId(null);
      setImageEditMode(false);
      
      // Esperar un frame para que se actualice la UI
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Capturar imagen de la vista actual del canvas
      const stage = stageRef.current;
      const dataURL = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
      
      // Restaurar la selección después de la captura
      setSelectedId(elementoSeleccionadoAntes);
      if (elementoSeleccionadoAntes) {
        const elemento = elementos.find(el => el.id === elementoSeleccionadoAntes);
        if (elemento?.type === "image") {
          setImageEditMode(true);
        }
      }
      
      // Crear el nombre del diseño
      const nombreDefault = nombreDiseno || `Diseño ${objetoSeleccionado.articulo_nombre} ${new Date().toLocaleDateString()}`;
      const nombreIngresado = prompt("Ingresa un nombre para tu diseño:", nombreDefault);
      
      if (!nombreIngresado) {
        setGuardandoDiseno(false);
        return;
      }

      setNombreDiseno(nombreIngresado);

      // Preparar assets de imágenes por elemento como DataURL para edición futura
      const imagenes_elementos = [];
      for (const el of elementos) {
        if (el?.type === 'image' && el.url) {
          try {
            const resp = await fetch(el.url);
            const blob = await resp.blob();
            const b64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            imagenes_elementos.push(String(b64));
          } catch (_) {
            // Si falla, omitimos esa imagen
          }
        }
      }

      // Helper: convertir a DataURL segura
      const toDataURL = async (url) => {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const b64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          return String(b64);
        } catch {
          return null;
        }
      };

      // Construir elementos_por_vista con imágenes como DataURL para robustez
      const elementos_por_vista = { frente: [], detras: [], izquierda: [], derecha: [] };
      for (const vista of ['frente', 'detras', 'izquierda', 'derecha']) {
        const arr = Array.isArray(elementosPorVista[vista]) ? elementosPorVista[vista] : [];
        const out = [];
        for (const el of arr) {
          if (el?.type === 'image' && el.url) {
            const dataurl = await toDataURL(el.url);
            out.push({ ...el, url: dataurl || el.url });
          } else {
            out.push(el);
          }
        }
        elementos_por_vista[vista] = out;
      }

      // Preparar datos del diseño para backend real
      const disenoData = {
        nombre: nombreIngresado,
        articulo_id: objetoSeleccionado.articulo_id,
        imagen: dataURL,
        elementos: elementos,
        variantes: objetoSeleccionado.variantes || [],
        elementos_por_vista,
        imagenes_elementos,
      };

      // Validar sesión
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para guardar tus diseños');
        setGuardandoDiseno(false);
        return null;
      }

      let res;
      if (editingId) {
        res = await disenosService.actualizarDiseno(editingId, disenoData);
        alert(`¡Diseño "${nombreIngresado}" actualizado exitosamente!`);
      } else {
        res = await disenosService.guardarDiseno(disenoData);
        alert(`¡Diseño "${nombreIngresado}" guardado exitosamente!`);
      }

      // Notificar al componente padre que se guardó un diseño
      if (onDisenoGuardado) onDisenoGuardado();
      return res?.id ?? null;

    } catch (error) {
      console.error("Error al guardar el diseño:", error);
      const msg = error?.response?.data?.error || error?.message || 'Fallo desconocido';
      alert("Error al guardar el diseño: " + msg);
    } finally {
      setGuardandoDiseno(false);
    }
  };

  // Guardar y agregar al carrito (backend)
  const saveAndAddToCart = async () => {
    const designId = await captureAndUploadViews();
    if (!designId) return;
    try {
      await cartService.addItem({ id: objetoSeleccionado.articulo_id }, 1, { designId });
      alert('Diseño agregado al carrito');
    } catch (e) {
      console.error('Error al agregar al carrito', e);
      alert('No se pudo agregar al carrito');
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
    nombreDiseno,
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
    handleTextInputChange
  };
};
