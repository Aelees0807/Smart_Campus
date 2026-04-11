import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import "./FacultyDashboard.css";
import "./StudentClassroom.css";

const PeonDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState("Peon");
  const [userId, setUserId] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { url, name, type }

  // Profile states
  const [profileData, setProfileData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");
    const dept = localStorage.getItem("userDepartment");
    if (!id) { navigate("/"); return; }
    if (name) setUserName(name);
    setUserId(id);
    if (dept) setUserDepartment(dept);
    fetchComplaints(dept);
    fetchUserProfile(id);
  }, []);

  const fetchUserProfile = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
      const data = await res.json();
      if (data) setProfileData(data);
    } catch (e) {}
  };

  const fetchComplaints = async (dept) => {
    setLoading(true);
    try {
      const department = dept || userDepartment;
      let url = `${API_BASE_URL}/api/complaints/all?exclude_category=Library";
      if (department) url += `&department=${encodeURIComponent(department)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setComplaints(data);
    } catch (e) {
      console.error("Error fetching complaints:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    if (newStatus === "Closed") {
      if (!window.confirm("Are you sure you want to close this complaint? This action cannot be undone.")) return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints(userDepartment);
      } else {
        alert("Failed: " + data.message);
      }
    } catch (e) {
      alert("Error updating status");
    }
  };

  // --- PROFILE UPDATES ---
  const handleProfileUpdate = async (overrides = {}) => {
    setProfileSaving(true);
    const payload = { ...profileData, ...overrides };
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(payload);
        if (Object.keys(overrides).length === 0) {
          alert("Profile updated successfully");
          setShowProfileModal(false);
        }
      } else {
        alert("Update failed: " + data.message);
      }
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileSaving(true);
    const formData = new FormData();
    formData.append("files", file);
    try {
      const uRes = await fetch(`${API_BASE_URL}/api/upload", { method: "POST", body: formData });
      const uData = await uRes.json();
      if (uData.success && uData.files.length > 0) {
        const photo_url = uData.files[0].file_url;
        await handleProfileUpdate({ photo_url });
        alert("Photo uploaded successfully");
      } else {
        alert("Upload failed: " + uData.message);
      }
    } catch (err) {
      alert("Upload error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // Filters
  const filtered = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (c.student_name || "").toLowerCase().includes(q) ||
      (c.student_id || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q);
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesCategory = !filterCategory || c.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    closed: complaints.filter(c => c.status === "Closed").length,
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const statusBadgeClass = (s) => {
    if (s === "Open") return "rejected";
    if (s === "In Progress") return "pending";
    if (s === "Resolved") return "approved";
    if (s === "Closed") return "approved";
    return "";
  };

  const categoryBadge = (cat) => {
    const colors = {
      Cleanliness: { bg: "#fef3c7", color: "#92400e" },
      Lab: { bg: "#dbeafe", color: "#1e40af" },
      Other: { bg: "#f1f5f9", color: "#475569" },
    };
    const c = colors[cat] || colors.Other;
    return { background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 };
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', marginLeft: "52px", marginBottom: "12px" }}>
        {attachments.map((att, idx) => (
          <span key={idx} onClick={() => setPreviewFile({ url: att.file_url, name: att.file_name, type: att.file_type })}
            style={{ fontSize: "12px", color: "#1d4ed8", textDecoration: "none", background: "#f0fdf4", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "6px" }}>
            {att.file_type === "image" ? "🖼️" : att.file_type === "pdf" ? "📕" : att.file_type === "video" ? "🎥" : "📄"} {att.file_name.length > 20 ? att.file_name.substring(0, 20) + "..." : att.file_name}
          </span>
        ))}
      </div>
    );
  };

  const renderComplaintCard = (c, showActions = true) => (
    <div key={c._id} style={{
      border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 22px",
      background: "#fff", marginBottom: "12px", transition: "box-shadow 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "16px", flexShrink: 0
          }}>
            {(c.student_name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong style={{ fontSize: "15px", color: "#1e293b" }}>{c.student_name}</strong>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              {c.student_id} · {c.student_department} · {c.student_class}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={categoryBadge(c.category)}>{c.category}</span>
          <span className={`status ${statusBadgeClass(c.status)}`}>{c.status}</span>
        </div>
      </div>
      <p style={{ margin: "0 0 12px 52px", fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
        {c.description}
      </p>
      {renderAttachments(c.attachments)}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginLeft: "52px", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>🕐 {formatDate(c.created_at)}</span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {c.status !== "In Progress" && c.status !== "Closed" && (
            <button onClick={() => handleStatusChange(c._id, "In Progress")}
              style={{ padding: "5px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              In Progress
            </button>
          )}
          {c.status !== "Resolved" && c.status !== "Closed" && (
            <button onClick={() => handleStatusChange(c._id, "Resolved")}
              style={{ padding: "5px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Resolve
            </button>
          )}
          {c.status !== "Closed" && (
            <button onClick={() => handleStatusChange(c._id, "Closed")}
              style={{ padding: "5px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
          )}
          {c.status === "Closed" && (
            <button onClick={() => handleStatusChange(c._id, "Open")}
              style={{ padding: "5px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Re-open
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fac-container">
      <aside className="fac-sidebar">
        <div className="logo" style={{ color: "#4f46e5" }}>PeonPanel</div>
        <nav>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button className={activeTab === "complaints" ? "active" : ""} onClick={() => { setActiveTab("complaints"); fetchComplaints(userDepartment); }}>
            Complaints
            {stats.open > 0 && (
              <span style={{
                background: "#ef4444", color: "#fff", borderRadius: "10px",
                padding: "1px 8px", fontSize: "11px", fontWeight: 700, marginLeft: "6px"
              }}>{stats.open}</span>
            )}
          </button>
          <button className={showProfileModal ? "active" : ""} onClick={() => setShowProfileModal(true)}>
            Profile
          </button>
        </nav>
        <button className="logout-link" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="fac-main">
        {/* Banner */}
        <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>🔧 Peon Dashboard</h2>
            <p>Welcome, {userName} ({userId}) — {userDepartment ? `${userDepartment} Department` : "Campus"} Complaints</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", zIndex: 1 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "20px", fontSize: "14px" }}>
              {new Date().toLocaleDateString("en-GB")}
            </div>
            <div onClick={() => setShowProfileModal(true)} className="banner-profile-pic"
              style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#f8fafc", cursor: "pointer", overflow: "hidden", border: "3px solid rgba(255,255,255,0.5)", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }}
              title="My Profile">
              {profileData.photo_url ? (
                <img src={profileData.photo_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "26px", color: "#94a3b8" }}>👤</span>
              )}
            </div>
          </div>
        </div>

        {/* ====== DASHBOARD TAB ====== */}
        {activeTab === "dashboard" && (
          <>
            <div className="stats-grid" style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
              <div className="card orange" style={{ flex: 1 }}>
                <h3>TOTAL</h3><p>{stats.total}</p>
              </div>
              <div className="card" style={{ flex: 1, borderTop: "4px solid #ef4444" }}>
                <h3>OPEN</h3><p>{stats.open}</p>
              </div>
              <div className="card" style={{ flex: 1, borderTop: "4px solid #f59e0b" }}>
                <h3>IN PROGRESS</h3><p>{stats.inProgress}</p>
              </div>
              <div className="card green" style={{ flex: 1 }}>
                <h3>RESOLVED</h3><p>{stats.resolved}</p>
              </div>
            </div>

            <div className="section-box">
              <h3>🔥 Recent Open Complaints ({stats.open})</h3>
              {complaints.filter(c => c.status === "Open").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                  <h4 style={{ color: "#64748b" }}>All Clear!</h4>
                  <p>No open complaints at the moment.</p>
                </div>
              ) : (
                complaints.filter(c => c.status === "Open").slice(0, 5).map(c => renderComplaintCard(c))
              )}
            </div>
          </>
        )}

        {/* ====== COMPLAINTS TAB ====== */}
        {activeTab === "complaints" && (
          <div className="section-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ margin: 0 }}>📋 Campus Complaints <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "#888" }}>({filtered.length})</span></h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", minWidth: "240px" }}>
                  <input
                    type="text" placeholder="Search by name, ID, description..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" }}
                  />
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "140px" }}>
                  <option value="">All Categories</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Lab">Lab</option>
                  <option value="Other">Other</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "140px" }}>
                  <option value="">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>⏳ Loading complaints...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                <h4 style={{ color: "#64748b" }}>No complaints found</h4>
                <p>{searchQuery || filterStatus || filterCategory ? "Try adjusting your filters." : "No complaints yet."}</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="fac-table" style={{ width: "100%" }}>
                  <thead>
                      <tr>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Proof</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                      <tr key={c._id}>
                        <td>
                          <strong>{c.student_name}</strong><br />
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{c.student_id} · {c.student_class}</span>
                        </td>
                        <td><span style={categoryBadge(c.category)}>{c.category}</span></td>
                        <td style={{ maxWidth: "280px" }}>{c.description}</td>
                        <td>
                          {c.attachments && c.attachments.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {c.attachments.map((att, idx) => (
                                <span key={idx} onClick={() => setPreviewFile({ url: att.file_url, name: att.file_name, type: att.file_type })}
                                  style={{ fontSize: "12px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}>
                                  {att.file_type === "image" ? "🖼️" : att.file_type === "pdf" ? "📕" : att.file_type === "video" ? "🎥" : "📄"} {att.file_name.length > 15 ? att.file_name.substring(0, 15) + "..." : att.file_name}
                                </span>
                              ))}
                            </div>
                          ) : <span style={{ color: "#9ca3af" }}>—</span>}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: "13px" }}>{formatDate(c.created_at)}</td>
                        <td><span className={`status ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {c.status !== "In Progress" && c.status !== "Closed" && (
                              <button onClick={() => handleStatusChange(c._id, "In Progress")}
                                style={{ padding: "4px 10px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                In Progress
                              </button>
                            )}
                            {c.status !== "Resolved" && c.status !== "Closed" && (
                              <button onClick={() => handleStatusChange(c._id, "Resolved")}
                                style={{ padding: "4px 10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Resolve
                              </button>
                            )}
                            {c.status !== "Closed" && (
                              <button onClick={() => handleStatusChange(c._id, "Closed")}
                                style={{ padding: "4px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Close
                              </button>
                            )}
                            {c.status === "Closed" && (
                              <button onClick={() => handleStatusChange(c._id, "Open")}
                                style={{ padding: "4px 10px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Re-open
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ====== PROFILE MODAL ====== */}
      {showProfileModal && (
        <div className="cls-modal-overlay">
          <div className="cls-modal" style={{ maxWidth: "500px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>My Profile</h2>
              <button className="cls-close-btn" style={{ fontSize: "20px", cursor: "pointer", background: "none", border: "none" }} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "10px", border: "3px solid #e5e7eb" }}>
                {profileData.photo_url ? (
                  <img src={profileData.photo_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "48px" }}>👤</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <label style={{ cursor: "pointer", color: "#2563eb", fontSize: "14px", fontWeight: "600" }}>
                  {profileSaving ? "Uploading..." : "Upload Photo"}
                  <input type="file" style={{ display: "none" }} accept="image/*" onChange={handleProfilePhotoUpload} disabled={profileSaving} />
                </label>
                {profileData.photo_url && (
                  <span style={{ cursor: "pointer", color: "#ef4444", fontSize: "14px", fontWeight: "600" }} onClick={() => handleProfileUpdate({ photo_url: null })}>
                    Remove Photo
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate({}); }}>
              <div className="cls-form-group">
                <label>Name</label>
                <input value={profileData.full_name || userName} disabled style={{ backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className="cls-form-group" style={{ flex: 1 }}>
                  <label>Employee ID</label>
                  <input value={profileData.custom_id || userId} disabled style={{ backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                </div>
                <div className="cls-form-group" style={{ flex: 1 }}>
                  <label>Department</label>
                  <input value={profileData.department || "N/A"} disabled style={{ backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                </div>
              </div>
              <div className="cls-form-group">
                <label>Email</label>
                <input value={profileData.email || ""} onChange={e => setProfileData({ ...profileData, email: e.target.value })} placeholder="Enter email address" />
              </div>
              <div className="cls-form-group">
                <label>Phone</label>
                <input value={profileData.phone || ""} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Enter phone number" />
              </div>
              <div className="cls-form-group">
                <label>Address</label>
                <input value={profileData.address || ""} onChange={e => setProfileData({ ...profileData, address: e.target.value })} placeholder="Enter address" />
              </div>
              <div className="cls-modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="cls-cancel-btn" onClick={() => setShowProfileModal(false)}>Close</button>
                <button type="submit" className="cls-submit-btn" disabled={profileSaving}>{profileSaving ? "Saving..." : "Save Profile"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== FILE PREVIEW MODAL ====== */}
      {previewFile && (
        <div className="cls-modal-overlay" onClick={() => setPreviewFile(null)} style={{ zIndex: 3000 }}>
          <div className="cls-preview-modal" onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "20px", borderRadius: "12px", maxWidth: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column", position: "relative" }}>
            <div className="cls-preview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1, paddingRight: "20px" }}>{previewFile.name}</h3>
              <button className="cls-close-btn" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }} onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="cls-preview-body" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              {previewFile.type === "image" && <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block", margin: "0 auto" }} />}
              {previewFile.type === "video" && <video src={previewFile.url} controls style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", margin: "0 auto" }} />}
              {previewFile.type === "pdf" && <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "70vh", border: "none" }} />}
              {previewFile.type === "document" && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`} title={previewFile.name} style={{ width: "100%", height: "70vh", border: "none" }} />
              )}
            </div>
            <div className="cls-preview-footer" style={{ marginTop: "15px", textAlign: "right" }}>
              <a href={previewFile.url} target="_blank" rel="noreferrer" download className="cls-download-btn" style={{ textDecoration: "none", background: "#e5e7eb", padding: "8px 16px", borderRadius: "6px", color: "#374151", fontWeight: 600 }}>⬇️ Download File</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeonDashboard;
