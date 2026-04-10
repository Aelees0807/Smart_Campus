import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FacultyDashboard.css";
import "./StudentClassroom.css";

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState("Librarian");
  const [userId, setUserId] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile states
  const [profileData, setProfileData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");
    if (!id) { navigate("/"); return; }
    if (name) setUserName(name);
    setUserId(id);
    fetchComplaints();
    fetchUserProfile(id);
  }, []);

  const fetchUserProfile = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`);
      const data = await res.json();
      if (data) setProfileData(data);
    } catch (e) {}
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/complaints/all?category=Library");
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
      const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
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
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
      const uRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
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
      (c.description || "").toLowerCase().includes(q);
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesStatus;
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

  const renderComplaintCard = (c, showActions = true) => (
    <div key={c._id} style={{
      border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 22px",
      background: "#fff", marginBottom: "12px", transition: "box-shadow 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff",
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
          <span style={{
            background: "#f3e8ff", color: "#7c3aed", padding: "3px 12px",
            borderRadius: "20px", fontSize: "12px", fontWeight: 600
          }}>{c.category}</span>
          <span className={`status ${statusBadgeClass(c.status)}`}>{c.status}</span>
        </div>
      </div>
      <p style={{ margin: "0 0 12px 52px", fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
        {c.description}
      </p>
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
        <div className="logo" style={{ color: "#059669" }}>LibrarianPanel</div>
        <nav>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button className={activeTab === "complaints" ? "active" : ""} onClick={() => { setActiveTab("complaints"); fetchComplaints(); }}>
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
        <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #059669, #047857)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>📚 Librarian Dashboard</h2>
            <p>Welcome, {userName} ({userId}) — Managing library complaints</p>
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
              <div className="card blue" style={{ flex: 1 }}>
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
                  <p>No open library complaints at the moment.</p>
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
              <h3 style={{ margin: 0 }}>📋 Library Complaints <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "#888" }}>({filtered.length})</span></h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", minWidth: "240px" }}>
                  <input
                    type="text" placeholder="Search by name, ID, description..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" }}
                  />
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
                </div>
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
                <p>{searchQuery || filterStatus ? "Try adjusting your filters." : "No library complaints yet."}</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="fac-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Description</th>
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
                        <td style={{ maxWidth: "300px" }}>{c.description}</td>
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
    </div>
  );
};

export default LibrarianDashboard;
