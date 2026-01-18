if (!window.storage) {
  window.storage = {
    async set(key, value) {
      localStorage.setItem(key, value);
      return { success: true };
    },
    
    async get(key) {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    },
    
    async delete(key) {
      localStorage.removeItem(key);
      return { success: true };
    },
    
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    }
  };
}
