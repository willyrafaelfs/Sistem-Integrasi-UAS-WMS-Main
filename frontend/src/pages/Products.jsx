import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Download, Upload, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Server-side filter & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ id: null, sku: '', name: '', category: 'A', uom: 'pcs', safety_stock: 0 });
  
  const [deleteConfirm, setDeleteConfirm] = useState(null); // stores product ID to delete
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Debounce search
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, categoryFilter, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({ 
        search: searchTerm, 
        category: categoryFilter,
        page: page,
        per_page: 10
      });
      // Assuming Laravel standard pagination structure: data.data is the array, data.last_page is total pages
      setProducts(data.data || data);
      setTotalPages(data.last_page || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Actions
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.createProduct(formData);
      } else {
        await api.updateProduct(formData.id, formData);
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      alert(error.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  const openEdit = (product) => {
    setModalMode('edit');
    setFormData({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category || 'A',
      uom: product.uom,
      safety_stock: product.safety_stock || 0
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteProduct(deleteConfirm);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      alert('Gagal menghapus produk');
    }
  };

  // Export & Import
  const handleExport = () => {
    window.location.href = api.getExportUrl();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      setLoading(true);
      const res = await api.importProducts(fd);
      alert(res.message);
      fetchProducts();
    } catch (error) {
      alert(error.data?.message || 'Gagal mengimpor file');
    } finally {
      e.target.value = null; // reset input
      setLoading(false);
    }
  };

  return (
    <div className="products-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper bg-primary-transparent">
            <Package size={24} className="text-primary" />
          </div>
          <div>
            <h2>Katalog SKU (Master Data)</h2>
            <p className="text-muted">Enterprise CRUD dengan Server-side Pagination & Export/Import</p>
          </div>
        </div>
        <div className="header-actions">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileChange} />
          
          <button className="secondary-btn" onClick={handleImportClick}>
            <Upload size={18} /> Import CSV
          </button>
          
          <button className="secondary-btn" onClick={handleExport}>
            <Download size={18} /> Export CSV
          </button>
          
          <button className="primary-btn" onClick={() => { setModalMode('add'); setFormData({ sku: '', name: '', category: 'A', uom: 'pcs', safety_stock: 0 }); setShowModal(true); }}>
            <Plus size={18} /> Tambah SKU
          </button>
        </div>
      </div>

      <div className="glass table-card">
        {/* Toolbar: Search & Filter */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari SKU atau Nama Server-side..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-box">
            <Filter size={18} className="text-muted" />
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">Semua Kelas ABC</option>
              <option value="A">Class A (Fast Moving)</option>
              <option value="B">Class B (Medium Moving)</option>
              <option value="C">Class C (Slow Moving)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th>Kategori (ABC)</th>
                <th>UOM</th>
                <th>Safety Stock</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Memuat data dari server...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Data tidak ditemukan.</td></tr>
              ) : (
                products.map(product => (
                  <tr key={product.id}>
                    <td><div className="font-medium mono">{product.sku}</div></td>
                    <td>{product.name}</td>
                    <td><span className={`badge class-${product.category?.toLowerCase() || 'a'}`}>Class {product.category || 'A'}</span></td>
                    <td>{product.uom}</td>
                    <td>{product.safety_stock}</td>
                    <td className="text-right action-cells">
                      <button className="icon-btn edit" onClick={() => openEdit(product)} title="Edit"><Edit2 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => setDeleteConfirm(product.id)} title="Hapus"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <span className="text-sm text-muted">Halaman {page} dari {totalPages}</span>
          <div className="pagination-buttons">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={18} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* CRUD Modal (Add/Edit) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="crud-form">
              <div className="form-group">
                <label>SKU (Barcode)</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} disabled={modalMode === 'edit'} />
              </div>
              <div className="form-group">
                <label>Nama Produk</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ABC Class (Kategori)</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Satuan (UOM)</label>
                  <input required type="text" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Safety Stock</label>
                <input required type="number" min="0" value={formData.safety_stock} onChange={e => setFormData({...formData, safety_stock: parseInt(e.target.value)})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="primary-btn">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass small">
            <h3>Konfirmasi Hapus</h3>
            <p>Yakin ingin menghapus produk ini secara permanen?</p>
            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="secondary-btn" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="primary-btn" style={{ background: '#ef4444', color: 'white' }} onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
