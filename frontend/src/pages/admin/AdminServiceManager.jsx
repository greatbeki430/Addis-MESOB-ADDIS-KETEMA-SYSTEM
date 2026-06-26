// frontend/src/pages/admin/AdminServiceManager.jsx
import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { btn, C, F, inp } from "../../styles/theme";
import { serviceAPI } from "../../services/api";
import { useToast } from "../../hooks/useToast";

export default function AdminServiceManager({ t }) {
  const { showToast, ToastContainer } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    dept: "",
    deptEn: "",
    name: "",
    nameEn: "",
    active: true,
    stdTime: "",
  });

  // ✅ Load services
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getAll();
      setServices(response.data);
    } catch (err) {
      console.error("Failed to load services:", err);
      showToast("Failed to load services", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed useEffect - no state update in effect body
  useEffect(() => {
    const fetchServices = async () => {
      await loadServices();
    };
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Seed all services from constants
  const handleSeedServices = async () => {
    if (!window.confirm("This will add all default services. Continue?"))
      return;
    try {
      const response = await serviceAPI.seed();
      showToast(response.data.message, "success");
      await loadServices();
    } catch (err) {
      showToast(err.response?.data?.message || "Seed failed", "error");
    }
  };

  // ✅ Add/Update service
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await serviceAPI.update(editingService._id, formData);
        showToast("Service updated successfully!", "success");
      } else {
        await serviceAPI.create(formData);
        showToast("Service added successfully!", "success");
      }
      setShowAddModal(false);
      setEditingService(null);
      setFormData({
        dept: "",
        deptEn: "",
        name: "",
        nameEn: "",
        active: true,
        stdTime: "",
      });
      await loadServices();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
  };

  // ✅ Delete service - fixed unused error variable
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;
    try {
      await serviceAPI.delete(id);
      showToast("Service deleted successfully!", "success");
      await loadServices();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  // ✅ Edit button handler
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      dept: service.dept,
      deptEn: service.deptEn || "",
      name: service.name,
      nameEn: service.nameEn || "",
      active: service.active,
      stdTime: service.stdTime || "",
    });
    setShowAddModal(true);
  };

  const safeT = t || {};
  const ts = safeT.services || {};

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
      <ToastContainer />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: 900,
              color: C.dark,
            }}
          >
            🔧 {ts.manageTitle || "Service Management"}
          </h1>
          <p style={{ color: C.muted, fontSize: "clamp(12px, 3vw, 14px)" }}>
            {services.length} {ts.totalServices || "services"} •{" "}
            {ts.manageSubtitle || "Add, edit, or remove services"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleSeedServices}
            style={{
              ...btn.secondary,
              background: "#f59e0b",
              color: "#fff",
              border: "none",
            }}
          >
            📦 {ts.seedBtn || "Bulk Import"}
          </button>
          <button
            onClick={() => {
              setEditingService(null);
              setFormData({
                dept: "",
                deptEn: "",
                name: "",
                nameEn: "",
                active: true,
                stdTime: "",
              });
              setShowAddModal(true);
            }}
            style={btn.primary}
          >
            ➕ {ts.addServiceBtn || "Add Service"}
          </button>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          ⏳ Loading...
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: C.white,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>
                  Department
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>
                  Service Name
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>
                  English Name
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr
                  key={s._id}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? C.white : C.cardBg,
                  }}
                >
                  <td style={{ padding: "10px 16px", color: "#999" }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                    {s.dept}
                  </td>
                  <td style={{ padding: "10px 16px" }}>{s.name}</td>
                  <td style={{ padding: "10px 16px", color: C.muted }}>
                    {s.nameEn}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "2px 12px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: s.active ? "#d1fae5" : "#fee2e2",
                        color: s.active ? "#065f46" : "#dc2626",
                      }}
                    >
                      {s.active ? "✅ Active" : "❌ Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(s)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        marginRight: 8,
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        color: "#dc2626",
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 28,
              width: "90%",
              maxWidth: 500,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                marginBottom: 16,
                fontSize: "clamp(20px, 5vw, 24px)",
                fontWeight: 800,
                color: C.dark,
              }}
            >
              {editingService ? "✏️ Edit Service" : "➕ Add New Service"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Department (Amharic) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dept}
                    onChange={(e) =>
                      setFormData({ ...formData, dept: e.target.value })
                    }
                    style={inp}
                    placeholder="e.g., ገቢዎች"
                  />
                </div>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Department (English)
                  </label>
                  <input
                    type="text"
                    value={formData.deptEn}
                    onChange={(e) =>
                      setFormData({ ...formData, deptEn: e.target.value })
                    }
                    style={inp}
                    placeholder="e.g., Revenue"
                  />
                </div>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Service Name (Amharic) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={inp}
                    placeholder="e.g., ቲን ሬጅስትሬሽን"
                  />
                </div>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Service Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    style={inp}
                    placeholder="e.g., TIN Registration"
                  />
                </div>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Standard Time
                  </label>
                  <input
                    type="text"
                    value={formData.stdTime}
                    onChange={(e) =>
                      setFormData({ ...formData, stdTime: e.target.value })
                    }
                    style={inp}
                    placeholder="e.g., 30 min"
                  />
                </div>
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Status
                  </label>
                  <select
                    value={formData.active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        active: e.target.value === "true",
                      })
                    }
                    style={inp}
                  >
                    <option value="true">✅ Active</option>
                    <option value="false">❌ Inactive</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 20,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={btn.secondary}
                >
                  Cancel
                </button>
                <button type="submit" style={btn.primary}>
                  {editingService ? "💾 Update" : "✅ Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
