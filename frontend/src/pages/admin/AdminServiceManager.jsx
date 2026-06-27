// frontend/src/pages/admin/AdminServiceManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { btn, C, inp } from "../../styles/theme";
import { serviceAPI } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
  FiX,
  FiLoader,
} from "react-icons/fi";

export default function AdminServiceManager({ t }) {
  const { showToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [hoveredDept, setHoveredDept] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    dept: "",
    deptEn: "",
    name: "",
    nameEn: "",
    active: true,
    stdTime: "",
    image: "",
  });

  const isInitialLoadRef = useRef(true);
  const isExpandedInitializedRef = useRef(false);

  const groupServicesByDept = useCallback((services) => {
    const grouped = {};
    services.forEach((service) => {
      const dept = service.dept || "Uncategorized";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(service);
    });
    return grouped;
  }, []);

  const loadServices = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadServices();
    }
  }, [loadServices]);

  useEffect(() => {
    if (services.length > 0 && !isExpandedInitializedRef.current) {
      const grouped = groupServicesByDept(services);
      const allExpanded = {};
      Object.keys(grouped).forEach((dept) => {
        allExpanded[dept] = false;
      });
      setExpandedDepts(allExpanded);
      isExpandedInitializedRef.current = true;
    }
  }, [services, groupServicesByDept]);

  const handleSeedServices = async () => {
    if (!window.confirm("This will add all default services. Continue?"))
      return;
    try {
      const response = await serviceAPI.seed();
      showToast(response.data.message, "success");
      isExpandedInitializedRef.current = false;
      await loadServices();
    } catch (err) {
      showToast(err.response?.data?.message || "Seed failed", "error");
    }
  };

  // Handle image upload - convert to Base64 for sending to backend
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please upload an image file", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);

      const submitData = { ...formData };

      // If image is empty string and editing, it means user wants to remove image
      if (submitData.image === "" && editingService && editingService.image) {
        submitData.image = "";
      }

      if (editingService) {
        await serviceAPI.update(editingService._id, submitData);
        showToast("Service updated successfully!", "success");
      } else {
        await serviceAPI.create(submitData);
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
        image: "",
      });
      setImagePreview("");
      isExpandedInitializedRef.current = false;
      await loadServices();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;
    try {
      await serviceAPI.delete(id);
      showToast("Service deleted successfully!", "success");
      isExpandedInitializedRef.current = false;
      await loadServices();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      dept: service.dept,
      deptEn: service.deptEn || "",
      name: service.name,
      nameEn: service.nameEn || "",
      active: service.active,
      stdTime: service.stdTime || "",
      image: service.image || "",
    });
    setImagePreview(service.image || "");
    setShowAddModal(true);
  };

  const toggleDepartment = (dept) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const safeT = t || {};
  const ts = safeT.services || {};
  const groupedServices = groupServicesByDept(services);
  const deptKeys = Object.keys(groupedServices);

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @keyframes expandIcon {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(180deg) scale(1); }
        }
        @keyframes collapseIcon {
          0% { transform: rotate(180deg) scale(1); }
          50% { transform: rotate(0deg) scale(1.2); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .dept-header {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dept-header:hover {
          background: #e8f5f0 !important;
          transform: translateX(4px);
        }
        .expand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a9d8f, #1a6d63);
          color: white;
          font-size: 14px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(42, 157, 143, 0.3);
        }
        .expand-icon.expanded {
          animation: expandIcon 0.4s ease forwards;
        }
        .expand-icon.collapsed {
          animation: collapseIcon 0.4s ease forwards;
        }
        .expand-icon:hover {
          box-shadow: 0 4px 16px rgba(42, 157, 143, 0.5);
          transform: scale(1.1);
        }
        .dept-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .dept-badge:hover {
          transform: scale(1.05);
        }
        .service-row-enter {
          animation: fadeSlideIn 0.3s ease forwards;
        }
        .image-preview-container {
          position: relative;
          display: inline-block;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
        }
        .image-preview-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-preview-container .remove-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s;
        }
        .image-preview-container .remove-btn:hover {
          transform: scale(1.1);
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
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
            {deptKeys.length} {ts.departments || "departments"} •{" "}
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
                image: "",
              });
              setImagePreview("");
              setShowAddModal(true);
            }}
            style={btn.primary}
          >
            <FiPlus size={16} style={{ marginRight: 6 }} />
            {ts.addServiceBtn || "Add Service"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <FiLoader
            size={24}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div style={{ marginTop: 12 }}>Loading...</div>
        </div>
      ) : (
        /* Services Table */
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
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    width: "50px",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    width: "200px",
                  }}
                >
                  Department
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>
                  Service Name
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>
                  English Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    width: "100px",
                  }}
                >
                  Image
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deptKeys.map((dept) => {
                const deptServices = groupedServices[dept];
                const isExpanded = expandedDepts[dept] !== false;
                const totalCount = deptServices.length;
                const activeCount = deptServices.filter((s) => s.active).length;
                const isHovered = hoveredDept === dept;

                return (
                  <React.Fragment key={`dept-${dept}`}>
                    {/* Department Header Row */}
                    <tr
                      className="dept-header"
                      style={{
                        background: isHovered ? "#e8f5f0" : "#f8f9fa",
                        cursor: "pointer",
                        borderBottom: `2px solid ${C.border}`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onClick={() => toggleDepartment(dept)}
                      onMouseEnter={() => setHoveredDept(dept)}
                      onMouseLeave={() => setHoveredDept(null)}
                    >
                      <td colSpan="7" style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            className={`expand-icon ${isExpanded ? "expanded" : "collapsed"}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: isExpanded
                                ? "linear-gradient(135deg, #2a9d8f, #1a6d63)"
                                : "linear-gradient(135deg, #6c757d, #495057)",
                              color: "white",
                              fontSize: 14,
                              transition:
                                "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: isExpanded
                                ? "0 2px 8px rgba(42, 157, 143, 0.3)"
                                : "0 2px 8px rgba(108, 117, 125, 0.2)",
                              transform: isExpanded
                                ? "rotate(0deg)"
                                : "rotate(-90deg)",
                            }}
                          >
                            {isExpanded ? "−" : "+"}
                          </div>

                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 16,
                              color: C.dark,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 20 }}>🏢</span>
                            {dept}
                          </span>

                          <span
                            className="dept-badge"
                            style={{
                              background:
                                "linear-gradient(135deg, #2a9d8f, #1a6d63)",
                              color: "white",
                              padding: "4px 14px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              boxShadow: "0 2px 8px rgba(42, 157, 143, 0.3)",
                            }}
                          >
                            📋 {totalCount}{" "}
                            {totalCount === 1 ? "service" : "services"}
                          </span>

                          <span
                            className="dept-badge"
                            style={{
                              background:
                                activeCount > 0 ? "#d1fae5" : "#fee2e2",
                              color: activeCount > 0 ? "#065f46" : "#dc2626",
                              padding: "4px 14px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              border: `1px solid ${activeCount > 0 ? "#a7f3d0" : "#fecaca"}`,
                            }}
                          >
                            {activeCount > 0 ? "✅" : "❌"} {activeCount} active
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              color: C.muted,
                              marginLeft: "auto",
                              opacity: 0.6,
                              fontStyle: "italic",
                            }}
                          >
                            {isExpanded
                              ? "Click to collapse"
                              : "Click to expand"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Service Rows - shown only if expanded */}
                    {isExpanded &&
                      deptServices.map((s, idx) => {
                        const globalIndex = services.indexOf(s) + 1;
                        return (
                          <tr
                            key={s._id}
                            className="service-row-enter"
                            style={{
                              borderBottom: `1px solid ${C.border}`,
                              background: idx % 2 === 0 ? C.white : C.cardBg,
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f0faf7";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                idx % 2 === 0 ? C.white : C.cardBg;
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 16px",
                                color: "#999",
                                textAlign: "center",
                              }}
                            >
                              {globalIndex}
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                paddingLeft: 60,
                                color: C.muted,
                                fontSize: 12,
                              }}
                            >
                              <span
                                style={{ opacity: 0.3, fontStyle: "italic" }}
                              >
                                ─
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 14 }}>📄</span>
                              {s.name}
                            </td>
                            <td
                              style={{ padding: "10px 16px", color: C.muted }}
                            >
                              {s.nameEn}
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                textAlign: "center",
                              }}
                            >
                              {s.image ? (
                                <img
                                  src={s.image}
                                  alt={s.name}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 6,
                                    objectFit: "cover",
                                    border: `1px solid ${C.border}`,
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    color: C.muted,
                                    fontSize: 11,
                                    fontStyle: "italic",
                                  }}
                                >
                                  No image
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 14px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: s.active ? "#d1fae5" : "#fee2e2",
                                  color: s.active ? "#065f46" : "#dc2626",
                                  border: `1px solid ${s.active ? "#a7f3d0" : "#fecaca"}`,
                                  display: "inline-block",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {s.active ? "✅ Active" : "❌ Inactive"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => handleEdit(s)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: 16,
                                  marginRight: 8,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#e8f5f0";
                                  e.currentTarget.style.transform =
                                    "scale(1.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                                title="Edit"
                              >
                                <FiEdit2 size={16} color="#3b82f6" />
                              </button>
                              <button
                                onClick={() => handleDelete(s._id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: 16,
                                  color: "#dc2626",
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fee2e2";
                                  e.currentTarget.style.transform =
                                    "scale(1.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal with Image Upload */}
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
          onClick={() => {
            if (!uploading) setShowAddModal(false);
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 28,
              width: "90%",
              maxWidth: 550,
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                marginBottom: 16,
                fontSize: "clamp(20px, 5vw, 24px)",
                fontWeight: 800,
                color: C.dark,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {editingService ? (
                <>
                  <FiEdit2 size={22} color="#3b82f6" />
                  Edit Service
                </>
              ) : (
                <>
                  <FiPlus size={22} color={C.primary} />
                  Add New Service
                </>
              )}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 12 }}>
                {/* Department (Amharic) */}
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
                    placeholder="e.g., ስርዓቶች"
                  />
                </div>

                {/* Department (English) */}
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
                    placeholder="e.g., Systems"
                  />
                </div>

                {/* Service Name (Amharic) */}
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
                    placeholder="e.g., ቲን ፈጅስትፈሸን"
                  />
                </div>

                {/* Service Name (English) */}
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

                {/* Standard Time */}
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

                {/* Image Upload */}
                <div>
                  <label
                    style={{ fontWeight: 600, fontSize: 13, color: C.dark }}
                  >
                    Service Image
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        background: "#f3f4f6",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: `1px dashed ${C.border}`,
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                      }}
                    >
                      <FiUpload size={16} />
                      <span style={{ fontSize: 13 }}>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                      />
                    </label>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={removeImage}
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    )}

                    <span
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        fontStyle: "italic",
                      }}
                    >
                      Max 5MB • JPG, PNG, GIF
                    </span>
                  </div>
                </div>

                {/* Status */}
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

              {/* Modal Actions */}
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
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...btn.primary,
                    opacity: uploading ? 0.7 : 1,
                    cursor: uploading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <FiLoader
                        size={16}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : editingService ? (
                    "💾 Update"
                  ) : (
                    "✅ Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
