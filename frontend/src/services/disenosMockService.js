// Mock service para diseños guardados
class DisenosMockService {
  constructor() {
    this.key = 'disenos_guardados_mock';
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify([]));
    }
  }

  async getDisenos() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const disenos = JSON.parse(localStorage.getItem(this.key) || '[]');
        resolve(disenos);
      }, 300); // Simula latencia de red
    });
  }

  async guardarDiseno(diseno) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const disenos = JSON.parse(localStorage.getItem(this.key) || '[]');
        const nuevoDiseno = {
          id: Date.now().toString(),
          ...diseno,
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString()
        };
        disenos.push(nuevoDiseno);
        localStorage.setItem(this.key, JSON.stringify(disenos));
        resolve(nuevoDiseno);
      }, 500); // Simula latencia de guardado
    });
  }

  async eliminarDiseno(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const disenos = JSON.parse(localStorage.getItem(this.key) || '[]');
        const disenosFiltrados = disenos.filter(d => d.id !== id);
        localStorage.setItem(this.key, JSON.stringify(disenosFiltrados));
        resolve(true);
      }, 300);
    });
  }

  async actualizarDiseno(id, cambios) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const disenos = JSON.parse(localStorage.getItem(this.key) || '[]');
        const index = disenos.findIndex(d => d.id === id);
        if (index !== -1) {
          disenos[index] = {
            ...disenos[index],
            ...cambios,
            fecha_modificacion: new Date().toISOString()
          };
          localStorage.setItem(this.key, JSON.stringify(disenos));
          resolve(disenos[index]);
        } else {
          throw new Error('Diseño no encontrado');
        }
      }, 400);
    });
  }

  // Método para limpiar todos los diseños (útil para desarrollo)
  async limpiarDisenos() {
    localStorage.setItem(this.key, JSON.stringify([]));
    return true;
  }
}

const disenosMockService = new DisenosMockService();
export default disenosMockService;