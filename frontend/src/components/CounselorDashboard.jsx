import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import "./FacultyDashboard.css";

const CounselorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("students");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [counsellorStudents, setCounsellorStudents] = useState([]);
  const [counselorName, setCounselorName] = useState("Counselor");
  const [facultyId, setFacultyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");
    if (name) setCounselorName(name);
    if (id) {
      setFacultyId(id);
      fetchCounsellorStudents(id);
      fetchLeaves(id);
    }
  }, []);

  const fetchLeaves = async (id) => {
    try {
      const fid = id || facultyId;
      const res = await fetch(`${API_BASE_URL}/api/leaves/counsellor/${fid}`);
      setLeaveRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCounsellorStudents = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/counsellor-students/${id}`);
      setCounsellorStudents(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleLeaveAction = async (id, status) => {
    await fetch(`${API_BASE_URL}/api/leaves/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    fetchLeaves(facultyId);
  };

  const handleBack = () => navigate("/faculty");

  const filteredStudents = counsellorStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.custom_id || "").toLowerCase().includes(q) ||
      (s.class || "").toLowerCase().includes(q) ||
      (s.batch || "").toLowerCase().includes(q);
  });

  const pendingLeaves = leaveRequests.filter(l => l.status === "Pending");
  const processedLeaves = leaveRequests.filter(l => l.status !== "Pending");

  return (
    <div className="fac-container">
      <aside className="fac-sidebar">
        <div className="logo" style={{ color: "#059669" }}>🛡️ CounselorPanel</div>
        <nav>
          <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>
            👥 My Students
          </button>
          <button className={activeTab === "leaves" ? "active" : ""} onClick={() => setActiveTab("leaves")}>
            📝 Leave Requests
            {pendingLeaves.length > 0 && (
              <span style={{
                background: "#ef4444", color: "#fff", borderRadius: "10px",
                padding: "1px 8px", fontSize: "11px", fontWeight: 700, marginLeft: "6px"
              }}>{pendingLeaves.length}</span>
            )}
          </button>
          <div style={{ margin: "10px 0", borderTop: "1px solid #e2e8f0" }}></div>
          <button onClick={handleBack}>&larr; Back to Faculty</button>
        </nav>
      </aside>

      <main className="fac-main">
        <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
          <div>
            <h2>Counselor Dashboard</h2>
            <p>Welcome, {counselorName} ({facultyId}) — {counsellorStudents.length} students assigned</p>
          </div>
        </div>

        {/* ====== MY COUNSELLING STUDENTS TAB ====== */}
        {activeTab === "students" && (
          <div className="section-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0 }}>👥 My Counselling Students <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "#888" }}>({filteredStudents.length})</span></h3>
              <div style={{ position: "relative", minWidth: "250px" }}>
                <input
                  type="text"
                  placeholder="Search by name, ID, class, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 14px 8px 36px",
                    borderRadius: "8px", border: "1px solid #d1d5db",
                    fontSize: "14px", outline: "none"
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                {searchQuery ? "No students match your search." : "No students assigned yet."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="fac-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Department</th>
                      <th>Class</th>
                      <th>Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.custom_id}>
                        <td style={{ color: "#9ca3af", fontWeight: 500 }}>{idx + 1}</td>
                        <td><strong>{s.custom_id}</strong></td>
                        <td>{s.full_name}</td>
                        <td>{s.department || "—"}</td>
                        <td>
                          {s.class ? (
                            <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>{s.class}</span>
                          ) : "—"}
                        </td>
                        <td>
                          {s.batch ? (
                            <span style={{ background: "#dcfce7", color: "#166534", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>{s.batch}</span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ====== LEAVE REQUESTS TAB ====== */}
        {activeTab === "leaves" && (
          <div className="section-box">
            {/* Pending Leaves */}
            <h3 style={{ marginBottom: "15px" }}>⏳ Pending Leave Requests <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "#888" }}>({pendingLeaves.length})</span></h3>
            {pendingLeaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", background: "#f9fafb", borderRadius: "10px", marginBottom: "30px" }}>
                No pending leave requests from your students.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "30px" }}>
                {pendingLeaves.map(leave => (
                  <div key={leave._id} style={{
                    border: "1px solid #fde68a", background: "#fffbeb", borderRadius: "12px",
                    padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <strong style={{ fontSize: "15px" }}>{leave.student_name || leave.student_id}</strong>
                        <span style={{ color: "#92400e", fontSize: "13px", marginLeft: "8px" }}>{leave.student_id}</span>
                      </div>
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                        📅 {leave.date}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#374151", fontSize: "14px" }}>📝 {leave.reason}</p>

                    {/* Attachments */}
                    {leave.attachments && leave.attachments.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {leave.attachments.map((att, idx) => (
                          <div key={idx} onClick={() => setPreviewFile(att)}
                            style={{
                              cursor: "pointer", border: "1px solid #e5e7eb", borderRadius: "8px",
                              padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px",
                              background: "#fff", fontSize: "13px", color: "#1d4ed8", fontWeight: 500
                            }}>
                            {att.file_type === "image" ? "🖼️" : att.file_type === "pdf" ? "📕" : att.file_type === "video" ? "🎥" : "📄"}
                            <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.file_name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <button className="approve-btn" onClick={() => handleLeaveAction(leave._id, "Approved")}
                        style={{ padding: "6px 16px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
                        ✓ Approve
                      </button>
                      <button className="reject-btn" onClick={() => handleLeaveAction(leave._id, "Rejected")}
                        style={{ padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Processed Leaves */}
            {processedLeaves.length > 0 && (
              <>
                <h3 style={{ marginBottom: "15px" }}>✅ Processed Leaves <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "#888" }}>({processedLeaves.length})</span></h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="fac-table" style={{ width: "100%" }}>
                    <thead><tr><th>Student</th><th>Date</th><th>Reason</th><th>Attachments</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {processedLeaves.map(leave => (
                        <tr key={leave._id}>
                          <td><strong>{leave.student_name || leave.student_id}</strong><br/><span style={{ fontSize: "12px", color: "#9ca3af" }}>{leave.student_id}</span></td>
                          <td>{leave.date}</td>
                          <td>{leave.reason}</td>
                          <td>
                            {leave.attachments && leave.attachments.length > 0 ? (
                              <span style={{ color: "#1d4ed8", fontSize: "13px", cursor: "pointer" }}
                                onClick={() => setPreviewFile(leave.attachments[0])}>
                                📎 {leave.attachments.length} file{leave.attachments.length > 1 ? "s" : ""}
                              </span>
                            ) : "—"}
                          </td>
                          <td>
                            <span className={`status ${leave.status.toLowerCase()}`}>{leave.status}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {leave.status === "Rejected" && (
                                <button
                                  onClick={() => handleLeaveAction(leave._id, "Approved")}
                                  style={{
                                    padding: "4px 12px", background: "#059669", color: "#fff",
                                    border: "none", borderRadius: "6px", fontSize: "12px",
                                    fontWeight: 600, cursor: "pointer"
                                  }}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {leave.status === "Approved" && (
                                <button
                                  onClick={() => handleLeaveAction(leave._id, "Rejected")}
                                  style={{
                                    padding: "4px 12px", background: "#ef4444", color: "#fff",
                                    border: "none", borderRadius: "6px", fontSize: "12px",
                                    fontWeight: 600, cursor: "pointer"
                                  }}
                                >
                                  ✗ Reject
                                </button>
                              )}
                              <button
                                onClick={() => handleLeaveAction(leave._id, "Pending")}
                                style={{
                                  padding: "4px 12px", background: "#f59e0b", color: "#fff",
                                  border: "none", borderRadius: "6px", fontSize: "12px",
                                  fontWeight: 600, cursor: "pointer"
                                }}
                              >
                                ↩ Pending
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ====== FILE PREVIEW MODAL ====== */}
      {previewFile && (
        <div onClick={() => setPreviewFile(null)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 3000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "16px", padding: "24px",
            maxWidth: "800px", width: "90%", maxHeight: "85vh", overflow: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: "16px" }}>{previewFile.file_name}</h3>
              <button onClick={() => setPreviewFile(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            {previewFile.file_type === "image" && <img src={previewFile.file_url} alt={previewFile.file_name} style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", display: "block", margin: "0 auto" }} />}
            {previewFile.file_type === "video" && <video src={previewFile.file_url} controls style={{ maxWidth: "100%", maxHeight: "65vh", display: "block", margin: "0 auto" }} />}
            {previewFile.file_type === "pdf" && <iframe src={previewFile.file_url} title={previewFile.file_name} style={{ width: "100%", height: "65vh", border: "none" }} />}
            {previewFile.file_type === "document" && (
              <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.file_url)}`} title={previewFile.file_name} style={{ width: "100%", height: "65vh", border: "none" }} />
            )}
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <a href={previewFile.file_url} target="_blank" rel="noreferrer" download
                style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>⬇️ Download File</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorDashboard;