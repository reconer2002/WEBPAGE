// frontend/src/components/mantenedor/Testimonios.jsx
import React, { useEffect, useState } from "react";
import {
  getTestimonios,
  crearTestimonio,
  actualizarTestimonio,
  borrarTestimonio,
} from "../../services/testimoniosService";
import "./Testimonios.css";

const Testimonios = () => {
  const [testimonios, setTestimonios] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    foto: null,
    calificacion: "", // agregamos calificación
  });
  const [editando, setEditando] = useState(null);

  // Cargar testimonios
  const cargarTestimonios = async () => {
    try {
      const data = await getTestimonios();
      setTestimonios(data);
    } catch (err) {
      console.error("Error al obtener testimonios:", err);
    }
  };

  useEffect(() => {
    cargarTestimonios();
  }, []);

  // Manejar cambios de inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("nombre", formData.nombre);
      data.append("descripcion", formData.descripcion);
      data.append("calificacion", formData.calificacion); // enviamos calificación
      if (formData.foto) data.append("foto", formData.foto);

      if (editando) {
        await actualizarTestimonio(editando, data);
      } else {
        await crearTestimonio(data);
      }

      setFormData({ nombre: "", descripcion: "", foto: null, calificacion: "" });
      setEditando(null);
      cargarTestimonios();
    } catch (err) {
      console.error("Error al guardar testimonio:", err);
    }
  };

  // Eliminar testimonio
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este testimonio?")) return;
    try {
      await borrarTestimonio(id);
      cargarTestimonios();
    } catch (err) {
      console.error("Error al eliminar testimonio:", err);
    }
  };

  // Editar testimonio
  const handleEdit = (testimonio) => {
    setFormData({
      nombre: testimonio.nombre,
      descripcion: testimonio.descripcion,
      foto: null,
      calificacion: testimonio.calificacion || "",
    });
    setEditando(testimonio.id);
  };

  return (
    <div className="testimonios-container">
      <h2>Gestión de Testimonios</h2>

      {/* Formulario */}
      <form className="testimonios-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          maxLength={25}
          required
        />
        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={formData.descripcion}
          onChange={handleChange}
          required
        />
        <select
          name="calificacion"
          value={formData.calificacion}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Calificación
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} estrella{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <input type="file" name="foto" accept="image/*" onChange={handleChange} />
        <button type="submit">{editando ? "Actualizar" : "Crear"} Testimonio</button>
      </form>

      {/* Tabla de testimonios */}
      <table className="testimonios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Calificación</th>
            <th>Foto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {testimonios.map((t) => (
            <tr key={t.id}>
              <td>{t.nombre}</td>
              <td>{t.descripcion}</td>
              <td>{t.calificacion}</td>
              <td>
                {t.foto_url && <img src={t.foto_url} alt={t.nombre} width="80" />}
              </td>
              <td>
                <button onClick={() => handleEdit(t)}>Editar</button>
                <button onClick={() => handleDelete(t.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Testimonios;