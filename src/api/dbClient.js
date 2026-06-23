class EntityService {
  constructor(name) {
    this.name = name;
  }
  
  _getAll() {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`sp_${this.name}`);
    return data ? JSON.parse(data) : [];
  }
  
  _saveAll(items) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`sp_${this.name}`, JSON.stringify(items));
  }
  
  async list(sort = null, limit = null) {
    let items = this._getAll();
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      items.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (valA === undefined) valA = '';
        if (valB === undefined) valB = '';
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    if (limit) {
      items = items.slice(0, limit);
    }
    return items;
  }
  
  async filter(query = {}, sort = null, limit = null) {
    let items = this._getAll();
    items = items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      items.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (valA === undefined) valA = '';
        if (valB === undefined) valB = '';
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    if (limit) {
      items = items.slice(0, limit);
    }
    return items;
  }
  
  async create(data) {
    const items = this._getAll();
    const newItem = {
      id: `${this.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_date: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this._saveAll(items);
    return newItem;
  }
  
  async update(id, data) {
    const items = this._getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${this.name} with id ${id} not found`);
    items[index] = { ...items[index], ...data };
    this._saveAll(items);
    return items[index];
  }
  
  async delete(id) {
    let items = this._getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${this.name} with id ${id} not found`);
    items.splice(index, 1);
    this._saveAll(items);
    return true;
  }
}

const auth = {
  me: async () => {
    if (typeof window === 'undefined') throw { status: 401, message: 'Not authenticated' };
    const sessionUserId = localStorage.getItem('stokpintar_session_user_id');
    if (!sessionUserId) {
      throw { status: 401, message: 'Not authenticated' };
    }
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const currentUser = users.find(u => u.id === sessionUserId);
    if (!currentUser) {
      localStorage.removeItem('stokpintar_session_user_id');
      throw { status: 401, message: 'User session invalid' };
    }
    if (currentUser.is_blocked) {
      throw { status: 403, message: 'User is blocked' };
    }
    return currentUser;
  },
  loginViaEmailPassword: async (email, password) => {
    if (typeof window === 'undefined') throw new Error('Browser environment required');
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Email atau password salah');
    }
    if (user.is_blocked) {
      throw new Error('Akun Anda dinonaktifkan. Hubungi administrator.');
    }
    localStorage.setItem('stokpintar_session_user_id', user.id);
    return user;
  },
  register: async ({ email, password }) => {
    if (typeof window === 'undefined') throw new Error('Browser environment required');
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('Email sudah terdaftar');
    }
    localStorage.setItem('sp_temp_reg', JSON.stringify({ email, password }));
    return { success: true };
  },
  verifyOtp: async ({ email, otpCode }) => {
    if (typeof window === 'undefined') throw new Error('Browser environment required');
    const temp = localStorage.getItem('sp_temp_reg');
    if (!temp) {
      throw new Error('Sesi pendaftaran tidak ditemukan. Silakan daftar kembali.');
    }
    const { email: tempEmail, password } = JSON.parse(temp);
    if (tempEmail.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Email tidak cocok');
    }
    if (!otpCode || otpCode.length !== 6) {
      throw new Error('Kode OTP harus 6 digit');
    }
    
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('Email sudah terdaftar');
    }
    
    const newUser = {
      id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      password,
      role: 'owner', // Default to owner so they can test everything
      is_blocked: false,
      created_date: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('sp_User', JSON.stringify(users));
    localStorage.removeItem('sp_temp_reg');
    
    localStorage.setItem('stokpintar_session_user_id', newUser.id);
    return { access_token: `mock_token_${newUser.id}` };
  },
  resendOtp: async (email) => {
    return { success: true };
  },
  resetPassword: async ({ resetToken, newPassword }) => {
    return { success: true };
  },
  loginWithProvider: async (provider, redirectUrl) => {
    if (typeof window === 'undefined') return;
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    let owner = users.find(u => u.role === 'owner');
    if (!owner) {
      owner = {
        id: 'user-owner-1',
        email: 'owner1@stokpintar.com',
        password: 'OwnerPassword123!',
        role: 'owner',
        is_blocked: false,
        created_date: new Date().toISOString()
      };
      users.push(owner);
      localStorage.setItem('sp_User', JSON.stringify(users));
    }
    localStorage.setItem('stokpintar_session_user_id', owner.id);
    window.location.href = redirectUrl || '/';
  },
  logout: async (redirectUrl) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('stokpintar_session_user_id');
    if (redirectUrl) {
      window.location.href = '/login';
    }
  },
  setToken: (token) => {
    // NOP for local storage db
  },
  redirectToLogin: (redirectUrl) => {
    if (typeof window === 'undefined') return;
    window.location.href = '/login';
  },
  createUser: async ({ email, password, role }) => {
    if (typeof window === 'undefined') throw new Error('Browser environment required');
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('Email sudah terdaftar');
    }
    const newUser = {
      id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      password,
      role,
      is_blocked: false,
      created_date: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('sp_User', JSON.stringify(users));
    return newUser;
  }
};

const usersService = {
  inviteUser: async (email, role) => {
    if (typeof window === 'undefined') throw new Error('Browser environment required');
    const users = JSON.parse(localStorage.getItem('sp_User') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('Email sudah terdaftar');
    }
    const newUser = {
      id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      password: 'TemporaryPassword123!',
      role,
      is_blocked: false,
      created_date: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('sp_User', JSON.stringify(users));
    return newUser;
  }
};

export const db = {
  auth,
  users: usersService,
  entities: {
    User: new EntityService('User'),
    Product: new EntityService('Product'),
    StaffStock: new EntityService('StaffStock'),
    ApprovalRequest: new EntityService('ApprovalRequest'),
    Transaction: new EntityService('Transaction'),
    CashFlow: new EntityService('CashFlow'),
    Expedition: new EntityService('Expedition'),
    StockMovement: new EntityService('StockMovement'),
    ShopeeReconciliation: new EntityService('ShopeeReconciliation'),
    AuditLog: new EntityService('AuditLog')
  }
};

const initializeDatabase = () => {
  if (typeof window === 'undefined') return;
  
  // Seed Users
  if (!localStorage.getItem('sp_User')) {
    const defaultUsers = [
      { id: 'user-owner-1', email: 'owner1@stokpintar.com', password: 'OwnerPassword123!', role: 'owner', is_blocked: false, created_date: new Date().toISOString() },
      { id: 'user-admin-1', email: 'admin1@stokpintar.com', password: 'AdminPassword123!', role: 'admin', is_blocked: false, created_date: new Date().toISOString() },
      { id: 'user-staff-1', email: 'staff1@stokpintar.com', password: 'StaffPassword123!', role: 'staff', is_blocked: false, created_date: new Date().toISOString() }
    ];
    localStorage.setItem('sp_User', JSON.stringify(defaultUsers));
  }
  
  // Seed Expeditions
  if (!localStorage.getItem('sp_Expedition')) {
    const defaultExpeditions = [
      { id: 'exp-jne', name: 'JNE', created_date: new Date().toISOString() },
      { id: 'exp-jnt', name: 'J&T', created_date: new Date().toISOString() },
      { id: 'exp-sicepat', name: 'SiCepat', created_date: new Date().toISOString() },
      { id: 'exp-gosend', name: 'GoSend', created_date: new Date().toISOString() },
      { id: 'exp-grab', name: 'GrabExpress', created_date: new Date().toISOString() }
    ];
    localStorage.setItem('sp_Expedition', JSON.stringify(defaultExpeditions));
  }
  
  // Seed Products
  if (!localStorage.getItem('sp_Product')) {
    const defaultProducts = [
      { id: 'prod-1', name: 'Semen Tiga Roda 50kg', price: 65000, stock_main: 150, description: 'Semen berkualitas tinggi untuk konstruksi kokoh.', created_date: new Date().toISOString() },
      { id: 'prod-2', name: 'Besi Beton 10mm', price: 85000, stock_main: 300, description: 'Besi beton ulir SNI.', created_date: new Date().toISOString() },
      { id: 'prod-3', name: 'Cat Tembok Dulux 5kg', price: 180000, stock_main: 75, description: 'Cat tembok interior premium.', created_date: new Date().toISOString() },
      { id: 'prod-4', name: 'Paku Kayu 3 Inch (per kg)', price: 20000, stock_main: 50, description: 'Paku berkualitas anti karat.', created_date: new Date().toISOString() },
      { id: 'prod-5', name: 'Baja Ringan C75', price: 95000, stock_main: 120, description: 'Rangka atap baja ringan kuat.', created_date: new Date().toISOString() }
    ];
    localStorage.setItem('sp_Product', JSON.stringify(defaultProducts));
  }
  
  // Seed StaffStock
  if (!localStorage.getItem('sp_StaffStock')) {
    const defaultStaffStock = [
      { id: 'ss-1', staff_id: 'user-staff-1', product_id: 'prod-1', quantity: 50, created_date: new Date().toISOString() },
      { id: 'ss-2', staff_id: 'user-staff-1', product_id: 'prod-2', quantity: 30, created_date: new Date().toISOString() },
      { id: 'ss-3', staff_id: 'user-staff-1', product_id: 'prod-3', quantity: 15, created_date: new Date().toISOString() },
      { id: 'ss-4', staff_id: 'user-staff-1', product_id: 'prod-4', quantity: 100, created_date: new Date().toISOString() },
      { id: 'ss-5', staff_id: 'user-staff-1', product_id: 'prod-5', quantity: 25, created_date: new Date().toISOString() }
    ];
    localStorage.setItem('sp_StaffStock', JSON.stringify(defaultStaffStock));
  }
  
  // Seed some transaction history
  if (!localStorage.getItem('sp_Transaction')) {
    const defaultTransactions = [
      {
        id: 'txn-1',
        staff_id: 'user-staff-1',
        customer_name: 'Budi Santoso',
        items: [{ product_id: 'prod-1', name: 'Semen Tiga Roda 50kg', price: 65000, qty: 10 }],
        total: 650000,
        status: 'completed',
        channel: 'offline',
        created_date: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'txn-2',
        staff_id: 'user-staff-1',
        customer_name: 'CV Makmur Jaya',
        items: [
          { product_id: 'prod-2', name: 'Besi Beton 10mm', price: 85000, qty: 20 },
          { product_id: 'prod-5', name: 'Baja Ringan C75', price: 95000, qty: 10 }
        ],
        total: 2650000,
        status: 'completed',
        channel: 'grosir',
        created_date: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    localStorage.setItem('sp_Transaction', JSON.stringify(defaultTransactions));
  }
  
  // Seed some cashflow
  if (!localStorage.getItem('sp_CashFlow')) {
    const defaultCashflows = [
      {
        id: 'cf-1',
        staff_id: 'user-staff-1',
        amount: 650000,
        type: 'sale',
        status: 'confirmed',
        created_date: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'cf-2',
        staff_id: 'user-staff-1',
        amount: 2650000,
        type: 'sale',
        status: 'confirmed',
        created_date: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    localStorage.setItem('sp_CashFlow', JSON.stringify(defaultCashflows));
  }
  
  const tables = ['ApprovalRequest', 'StockMovement', 'ShopeeReconciliation', 'AuditLog'];
  tables.forEach(table => {
    if (!localStorage.getItem(`sp_${table}`)) {
      localStorage.setItem(`sp_${table}`, '[]');
    }
  });
};

initializeDatabase();
