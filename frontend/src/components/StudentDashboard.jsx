import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import "./StudentClassroom.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");

  // Original data
  const [assignments, setAssignments] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [counsellor, setCounsellor] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ reason: "", date: "" });
  const [leaveFiles, setLeaveFiles] = useState([]);
  const [leaveUploading, setLeaveUploading] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ category: "", description: "" });
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [complaintFiles, setComplaintFiles] = useState([]);
  const [complaintUploading, setComplaintUploading] = useState(false);

  // Profile states
  const [profileData, setProfileData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Classroom states
  const [classrooms, setClassrooms] = useState([]);
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [classroomTab, setClassroomTab] = useState("stream");
  const [posts, setPosts] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Submission states
  const [submitModal, setSubmitModal] = useState(null); // { post }
  const [submitContent, setSubmitContent] = useState("");
  const [submitFiles, setSubmitFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { url, name, type }
  const [mySubmissions, setMySubmissions] = useState({}); // { post_id: submission }

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");
    if (!id) { navigate("/"); return; }
    setStudentName(name);
    setStudentId(id);
    fetchUserProfile(id);
    fetchAssignments();
    fetchMyLeaves(id);
    fetchMyComplaints(id);
    fetchMyClassrooms(id);
    fetchCounsellor(id);
  }, []);

  // --- FETCH ---
  const fetchUserProfile = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`);
      const data = await res.json();
      if (data) setProfileData(data);
    } catch(e) {}
  };
  const fetchAssignments = async () => {
    try { const res = await fetch("http://localhost:5000/api/assignments"); setAssignments(await res.json()); } catch (e) {}
  };
  const fetchMyLeaves = async (id) => {
    try { const res = await fetch(`http://localhost:5000/api/leaves/${id}`); setMyLeaves(await res.json()); } catch (e) {}
  };
  const fetchMyComplaints = async (id) => {
    try { const res = await fetch(`http://localhost:5000/api/complaints/${id}`); setMyComplaints(await res.json()); } catch (e) {}
  };
  const fetchMyClassrooms = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/classrooms/student/${id}`);
      setClassrooms(await res.json());
    } catch (e) {}
  };

  const fetchCounsellor = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/student-counsellor/${id}`);
      const data = await res.json();
      if (data.success) setCounsellor(data.counsellor);
    } catch (e) {}
  };

  const fetchPosts = async (classroomId, sid) => {
    try {
      const res = await fetch(`http://localhost:5000/api/classroom-posts/${classroomId}`);
      const data = await res.json();
      setPosts(data);
      // Fetch submission status for all assignments
      const id = sid || studentId;
      const subsMap = {};
      for (const post of data.filter(p => p.type === "Assignment")) {
        const sRes = await fetch(`http://localhost:5000/api/submissions/${post.id}/${id}`);
        const sub = await sRes.json();
        if (sub) subsMap[post.id] = sub;
      }
      setMySubmissions(subsMap);
    } catch (e) {}
  };

  const openClassroom = (cls) => {
    setActiveClassroom(cls);
    setClassroomTab("stream");
    fetchPosts(cls.id);
  };

  // --- PROFILE UPDATES ---
  const handleProfileUpdate = async (overrides = {}) => {
    setProfileSaving(true);
    const payload = { ...profileData, ...overrides };
    try {
      const res = await fetch(`http://localhost:5000/api/users/${studentId}`, {
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

  // --- JOIN CLASS ---
  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    const res = await fetch("http://localhost:5000/api/classrooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_code: joinCode, student_id: studentId, student_name: studentName }),
    });
    const data = await res.json();
    setJoinLoading(false);
    if (data.success) {
      setShowJoinModal(false);
      setJoinCode("");
      fetchMyClassrooms(studentId);
      alert(`✅ ${data.message}`);
    } else alert(`❌ ${data.message}`);
  };

  // --- SUBMIT ASSIGNMENT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let attachments = [];

    if (submitFiles.length > 0) {
      const formData = new FormData();
      submitFiles.forEach(file => formData.append("files", file));
      try {
        const uRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
        const uData = await uRes.json();
        if (uData.success) {
          attachments = uData.files;
        } else {
          alert("Upload failed: " + uData.message);
          setUploading(false);
          return;
        }
      } catch (err) {
        alert("Upload error");
        setUploading(false);
        return;
      }
    }

    const payload = {
      post_id: submitModal.post.id,
      classroom_id: activeClassroom.id,
      student_id: studentId,
      student_name: studentName,
      content: submitContent,
      attachments
    };

    const res = await fetch("http://localhost:5000/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      setSubmitModal(null);
      setSubmitContent("");
      setSubmitFiles([]);
      fetchPosts(activeClassroom.id);
      alert("✅ Assignment submitted successfully!");
    } else alert(`❌ ${data.message}`);
  };

  // --- LEAVES ---
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveUploading(true);

    // Upload files if any
    let attachments = [];
    if (leaveFiles.length > 0) {
      const formData = new FormData();
      leaveFiles.forEach(file => formData.append("files", file));
      try {
        const uRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
        const uData = await uRes.json();
        if (uData.success) {
          attachments = uData.files;
        } else {
          alert("File upload failed: " + uData.message);
          setLeaveUploading(false);
          return;
        }
      } catch (err) {
        alert("File upload error");
        setLeaveUploading(false);
        return;
      }
    }

    const payload = { ...leaveForm, studentId, studentName, attachments };
    if (editingLeaveId) {
      await fetch(`http://localhost:5000/api/leaves/${editingLeaveId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, status: "Pending" }) });
      alert("Leave Updated & Resubmitted!"); setEditingLeaveId(null);
    } else {
      await fetch("http://localhost:5000/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      alert("Leave Applied!");
    }
    setLeaveForm({ reason: "", date: "" }); 
    setLeaveFiles([]); 
    setLeaveUploading(false); 
    fetchMyLeaves(studentId);
    const leaveInput = document.getElementById('leaveFilesInput');
    if (leaveInput) leaveInput.value = '';
  };
  const editLeave = (leave) => { setLeaveForm({ reason: leave.reason, date: leave.date }); setEditingLeaveId(leave._id); setLeaveFiles([]); };
  const deleteLeave = async (id) => { if (window.confirm("Delete?")) { await fetch(`http://localhost:5000/api/leaves/${id}`, { method: "DELETE" }); fetchMyLeaves(studentId); } };

  // --- COMPLAINTS ---
  const handleComplaintSubmit = async () => {
    if (!complaintForm.category || !complaintForm.description) return alert("Fill all fields");
    setComplaintUploading(true);

    let attachments = [];
    if (complaintFiles.length > 0) {
      const formData = new FormData();
      complaintFiles.forEach(file => formData.append("files", file));
      try {
        const uRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
        const uData = await uRes.json();
        if (uData.success) {
          attachments = uData.files;
        } else {
          alert("File upload failed: " + uData.message);
          setComplaintUploading(false);
          return;
        }
      } catch (err) {
        alert("File upload error");
        setComplaintUploading(false);
        return;
      }
    }

    const payload = { ...complaintForm, studentId, attachments };
    if (editingComplaintId) {
      await fetch(`http://localhost:5000/api/complaints/${editingComplaintId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      alert("Updated!"); setEditingComplaintId(null);
    } else {
      await fetch("http://localhost:5000/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      alert("Submitted!");
    }
    setComplaintForm({ category: "", description: "" }); 
    setComplaintFiles([]); 
    setComplaintUploading(false); 
    fetchMyComplaints(studentId);
    const fileInput = document.getElementById('complaintFilesInput');
    if (fileInput) fileInput.value = '';
  };
  const editComplaint = (c) => { setComplaintForm({ category: c.category, description: c.description }); setEditingComplaintId(c._id); setComplaintFiles([]); };
  const deleteComplaint = async (id) => { if (window.confirm("Delete?")) { await fetch(`http://localhost:5000/api/complaints/${id}`, { method: "DELETE" }); fetchMyComplaints(studentId); } };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const postTypeIcon = { Announcement: "📢", Assignment: "📝", Material: "📄" };
  const postTypeBadgeClass = { Announcement: "badge-ann", Assignment: "badge-asgn", Material: "badge-mat" };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="cls-attachments-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
        {attachments.map((att, idx) => {
          const isImg = att.file_type === "image";
          return (
            <div key={idx} className="cls-attachment" onClick={() => setPreviewFile({ url: att.file_url, name: att.file_name, type: att.file_type })} style={{ cursor: "pointer", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px", display: "flex", alignItems: "center", gap: "10px", background: "#f9fafb", minWidth: "200px", maxWidth: "100%" }}>
              {isImg ? <img src={att.file_url} alt={att.file_name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} /> : <span style={{ fontSize: "24px" }}>{att.file_type === 'video' ? '🎥' : att.file_type === 'pdf' ? '📕' : '📄'}</span>}
              <span style={{ fontSize: "14px", color: "#111827", fontWeight: 500 }}>{att.file_name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== RENDER ====================
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Hello, {studentName}! 👋</h2>
                <p>You are enrolled in {classrooms.length} classroom{classrooms.length !== 1 ? "s" : ""}.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
                <div className="date-badge" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>{new Date().toLocaleDateString("en-GB")}</div>
                {/* Profile Picture in Banner */}
                <div 
                  onClick={() => setShowProfileModal(true)} 
                  className="banner-profile-pic"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f8fafc', cursor: 'pointer', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}
                  title="My Profile"
                >
                  {profileData.photo_url ? (
                    <img src={profileData.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '30px', color: '#94a3b8' }}>👤</span>
                  )}
                </div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="card blue"><h3>Classrooms</h3><p>{classrooms.length}</p></div>
              <div className="card purple"><h3>Leaves</h3><p>{myLeaves.length}</p></div>
              <div className="card red"><h3>Complaints</h3><p>{myComplaints.length}</p></div>
            </div>

            {/* Counsellor Info Card */}
            {counsellor && (
              <div style={{
                background: "linear-gradient(135deg, #059669, #047857)",
                borderRadius: "14px",
                padding: "20px 24px",
                color: "#fff",
                marginTop: "20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 4px 15px rgba(5, 150, 105, 0.3)"
              }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "22px", fontWeight: 700
                }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.85, marginBottom: "2px" }}>Your Counsellor</div>
                  <div style={{ fontSize: "18px", fontWeight: 700 }}>{counsellor.full_name}</div>
                  <div style={{ fontSize: "13px", opacity: 0.8 }}>{counsellor.custom_id} · {counsellor.department}</div>
                </div>
              </div>
            )}
          </>
        );

      case "classroom":
        // Inside a classroom
        if (activeClassroom) {
          const streamPosts = posts;
          const assignmentPosts = posts.filter(p => p.type === "Assignment");
          const materialPosts = posts.filter(p => p.type === "Material");

          return (
            <div className="stu-cls-inner">
              {/* Banner */}
              <div className="stu-cls-banner" style={{ background: activeClassroom.banner_color }}>
                <button className="stu-cls-back-btn" onClick={() => setActiveClassroom(null)}>← My Classes</button>
                <div className="stu-cls-banner-info">
                  <h2>{activeClassroom.name}</h2>
                  <p>{activeClassroom.subject} {activeClassroom.section && `· ${activeClassroom.section}`}</p>
                  <span className="stu-cls-teacher">👨‍🏫 {activeClassroom.faculty_name}</span>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="cls-subtabs">
                {["stream", "classwork"].map(t => (
                  <button key={t} className={`cls-subtab ${classroomTab === t ? "active" : ""}`}
                    onClick={() => setClassroomTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* ---- STREAM ---- */}
              {classroomTab === "stream" && (
                <div className="stu-stream">
                  {streamPosts.length === 0 ? (
                    <div className="cls-empty">Your teacher hasn't posted anything yet.</div>
                  ) : (
                    streamPosts.map(post => {
                      const mySub = mySubmissions[post.id];
                      return (
                        <div key={post.id} className="stu-feed-card">
                          <div className="cls-feed-header">
                            <div className="cls-feed-avatar" style={{ background: activeClassroom.banner_color }}>{activeClassroom.faculty_name[0]}</div>
                            <div>
                              <strong>{activeClassroom.faculty_name}</strong>
                              <span className="cls-feed-time">{formatDate(post.created_at)}</span>
                            </div>
                            <span className={`cls-type-badge ${postTypeBadgeClass[post.type]}`}>{postTypeIcon[post.type]} {post.type}</span>
                          </div>
                          <h4 className="cls-feed-title">{post.title}</h4>
                          {post.description && <p className="cls-feed-desc">{post.description}</p>}
                          {renderAttachments(post.attachments)}

                          {post.type === "Assignment" && (
                            <div className="stu-asgn-footer">
                              <div className="stu-asgn-meta">
                                {post.points > 0 && <span>🏅 {post.points} pts</span>}
                                {post.due_date && <span>⏰ Due: {post.due_date}</span>}
                              </div>
                              {mySub ? (
                                <div className="stu-sub-status-box">
                                  {mySub.status === "Graded" ? (
                                    <>
                                      <span className="stu-sub-graded">✅ Graded: {mySub.grade}/{post.points}</span>
                                      {mySub.feedback && <span className="stu-sub-feedback">💬 {mySub.feedback}</span>}
                                    </>
                                  ) : (
                                    <span className="stu-sub-submitted">📬 Submitted</span>
                                  )}
                                </div>
                              ) : (
                                <button className="stu-submit-btn" onClick={() => { setSubmitModal({ post }); setSubmitContent(""); }}>
                                  Submit Assignment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ---- CLASSWORK ---- */}
              {classroomTab === "classwork" && (
                <div className="stu-classwork">
                  {/* Assignments */}
                  {assignmentPosts.length > 0 && (
                    <div className="stu-work-group">
                      <div className="cls-work-group-header">📝 Assignments</div>
                      {assignmentPosts.map(post => {
                        const mySub = mySubmissions[post.id];
                        return (
                          <div key={post.id} className="stu-work-item">
                            <div className="cls-work-item-left">
                              <span className="cls-work-icon">📝</span>
                              <div>
                                <strong>{post.title}</strong>
                                {post.due_date && <span className="cls-work-due">Due: {post.due_date}</span>}
                                {post.attachments && post.attachments.length > 0 && <span className="cls-work-due" style={{ color: "#1a73e8" }}>📎 {post.attachments.length} attachment{post.attachments.length > 1 ? 's' : ''}</span>}
                              </div>
                            </div>
                            <div className="stu-work-right">
                              {post.points > 0 && <span className="cls-pts">{post.points} pts</span>}
                              {mySub ? (
                                mySub.status === "Graded"
                                  ? <span className="stu-work-graded">✅ {mySub.grade}/{post.points}</span>
                                  : <span className="stu-work-done">📬 Submitted</span>
                              ) : (
                                <button className="stu-submit-btn-sm" onClick={() => { setSubmitModal({ post }); setSubmitContent(""); }}>Submit</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Materials */}
                  {materialPosts.length > 0 && (
                    <div className="stu-work-group">
                      <div className="cls-work-group-header">📄 Materials</div>
                      {materialPosts.map(post => (
                        <div key={post.id} className="stu-work-item">
                          <div className="cls-work-item-left">
                            <span className="cls-work-icon">📄</span>
                            <div>
                              <strong>{post.title}</strong>
                              {post.description && <span className="cls-work-due">{post.description.substring(0, 60)}...</span>}
                            </div>
                          </div>
                          <div className="stu-work-right">
                            <span className="stu-work-done">📘 Material</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {posts.length === 0 && <div className="cls-empty">No classwork posted yet.</div>}
                </div>
              )}
            </div>
          );
        }

        // My classes list
        return (
          <div className="stu-cls-home">
            <div className="cls-home-header">
              <h3>My Classrooms</h3>
              <button className="stu-join-btn" onClick={() => setShowJoinModal(true)}>+ Join Class</button>
            </div>

            {classrooms.length === 0 ? (
              <div className="cls-empty-state">
                <div className="cls-empty-icon">🏫</div>
                <h3>No classrooms yet</h3>
                <p>Ask your teacher for a class code and join a classroom</p>
                <button className="stu-join-btn" onClick={() => setShowJoinModal(true)}>+ Join Class</button>
              </div>
            ) : (
              <div className="cls-cards-grid">
                {classrooms.map(cls => (
                  <div key={cls.id} className="cls-card" onClick={() => openClassroom(cls)}>
                    <div className="cls-card-banner" style={{ background: cls.banner_color }}>
                      <h3>{cls.name}</h3>
                      <p>{cls.subject} {cls.section && `· ${cls.section}`}</p>
                    </div>
                    <div className="cls-card-body">
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>👨‍🏫 {cls.faculty_name}</span>
                    </div>
                    <div className="cls-card-footer">
                      <button className="cls-open-btn">Open →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "leaves":
        return (
          <div className="section-box">
            <h3>📝 Leave Applications</h3>
            {counsellor && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "15px", fontSize: "13px", color: "#166534" }}>
                🛡️ Your leave requests will be sent to your counsellor: <strong>{counsellor.full_name} ({counsellor.custom_id})</strong>
              </div>
            )}
            <form className="std-form" onSubmit={handleLeaveSubmit} style={{ marginBottom: "20px", background: "#f8fafc", padding: "15px", borderRadius: "10px" }}>
              <h4 style={{ marginTop: 0 }}>{editingLeaveId ? "Edit Leave" : "Apply for New Leave"}</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input type="text" placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} required style={{ flex: 2, minWidth: "200px" }} />
                <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} required style={{ flex: 1, minWidth: "140px" }} />
              </div>
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "6px" }}>📎 Attach Files (optional)</label>
                <input type="file" multiple onChange={e => {
                  const files = Array.from(e.target.files);
                  if (files.length > 5) { alert('Maximum 5 files allowed'); e.target.value = ''; return; }
                  setLeaveFiles(files);
                }} />
                {leaveFiles.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#059669", marginTop: "4px", display: "block" }}>✅ {leaveFiles.length} file(s) selected</span>
                )}
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button className="primary-btn" type="submit" disabled={leaveUploading}>{leaveUploading ? "Submitting..." : editingLeaveId ? "Update" : "Apply"}</button>
                {editingLeaveId && <button type="button" onClick={() => { setEditingLeaveId(null); setLeaveForm({ reason: "", date: "" }); setLeaveFiles([]); }} className="cancel-btn">Cancel</button>}
              </div>
            </form>
            <table className="std-table">
              <thead><tr><th>Date</th><th>Reason</th><th>Attachments</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {myLeaves.map((l) => (
                  <tr key={l._id}>
                    <td>{l.date}</td><td>{l.reason}</td>
                    <td>
                      {l.attachments && l.attachments.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {l.attachments.map((att, idx) => (
                            <a key={idx} href={att.file_url} target="_blank" rel="noreferrer"
                              style={{ fontSize: "12px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
                              {att.file_type === "image" ? "🖼️" : att.file_type === "pdf" ? "📕" : att.file_type === "video" ? "🎥" : "📄"} {att.file_name.length > 15 ? att.file_name.substring(0, 15) + "..." : att.file_name}
                            </a>
                          ))}
                        </div>
                      ) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td><span className={`status ${l.status.toLowerCase()}`}>{l.status}</span></td>
                    <td>
                      <button className="sm-btn edit" onClick={() => editLeave(l)}>✏️</button>
                      <button className="sm-btn del" onClick={() => deleteLeave(l._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "complaints":
        return (
          <div className="section-box">
            <h3>⚠️ My Complaints</h3>
            <div className="std-form" style={{ background: "#fff5f5", padding: "20px", borderRadius: "10px", marginBottom: "30px", border: "1px solid #fee2e2" }}>
              <h4 style={{ marginTop: 0, color: "#991b1b" }}>{editingComplaintId ? "Edit Complaint" : "Report an Issue"}</h4>
              <select value={complaintForm.category} onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })} style={{ marginBottom: "10px" }}>
                <option value="">Select Category</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Lab">Lab Issue</option>
                <option value="Library">Library</option>
                <option value="Other">Other</option>
              </select>
              <textarea rows="3" placeholder="Describe..." value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}></textarea>
              <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "6px" }}>📎 Attach Proof/Files (optional)</label>
                <input id="complaintFilesInput" type="file" multiple onChange={e => {
                  const files = Array.from(e.target.files);
                  if (files.length > 5) { alert('Maximum 5 files allowed'); e.target.value = ''; return; }
                  setComplaintFiles(files);
                }} />
                {complaintFiles.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#059669", marginTop: "4px", display: "block" }}>✅ {complaintFiles.length} file(s) selected</span>
                )}
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button className="primary-btn" onClick={handleComplaintSubmit} disabled={complaintUploading} style={{ background: "#ef4444" }}>{complaintUploading ? "Submitting..." : editingComplaintId ? "Update" : "Submit"}</button>
                {editingComplaintId && <button onClick={() => { setEditingComplaintId(null); setComplaintForm({ category: "", description: "" }); setComplaintFiles([]); }} className="cancel-btn">Cancel</button>}
              </div>
            </div>
            <table className="std-table">
              <thead><tr><th>Category</th><th>Description</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {myComplaints.map((c) => (
                  <tr key={c._id}>
                    <td><strong>{c.category}</strong></td><td>{c.description}</td>
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
                    <td><span className={`status ${c.status.toLowerCase() === "open" ? "rejected" : "approved"}`}>{c.status}</span></td>
                    <td>
                      <button className="sm-btn edit" onClick={() => editComplaint(c)}>✏️</button>
                      <button className="sm-btn del" onClick={() => deleteComplaint(c._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default: return <div>Select Tab</div>;
    }
  };

  return (
    <div className="std-container">
      <aside className="std-sidebar">
        <div className="logo">🎓 CampusHub</div>
        <nav>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button className={activeTab === "classroom" ? "active" : ""} onClick={() => { setActiveTab("classroom"); fetchMyClassrooms(studentId); }}>Classroom</button>
          <button className={activeTab === "leaves" ? "active" : ""} onClick={async () => {
            setActiveTab("leaves");
            // Mark all processed leaves as seen in the database
            const unseenLeaves = myLeaves.filter(l => (l.status === "Approved" || l.status === "Rejected") && !l.student_seen);
            if (unseenLeaves.length > 0) {
              try {
                await fetch(`http://localhost:5000/api/leaves/mark-seen/${studentId}`, { method: "PUT" });
                fetchMyLeaves(studentId);
              } catch (e) {}
            }
          }} style={{ position: "relative" }}>
            Leaves
            {(() => {
              const unseenCount = myLeaves.filter(l => (l.status === "Approved" || l.status === "Rejected") && !l.student_seen).length;
              if (unseenCount > 0 && activeTab !== "leaves") {
                return (
                  <span style={{
                    position: "absolute", top: "6px", right: "8px",
                    background: "#ef4444", color: "#fff", borderRadius: "50%",
                    width: "20px", height: "20px", fontSize: "11px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(239,68,68,0.4)", animation: "pulse 2s infinite"
                  }}>{unseenCount}</span>
                );
              }
              return null;
            })()}
          </button>
          <button className={activeTab === "complaints" ? "active" : ""} onClick={() => setActiveTab("complaints")}>Complaints</button>
          <button className={showProfileModal ? "active" : ""} onClick={() => setShowProfileModal(true)}>Profile</button>
        </nav>
        <button className="logout-link" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="std-main">{renderContent()}</main>

      {/* ====== JOIN CLASS MODAL ====== */}
      {showJoinModal && (
        <div className="cls-modal-overlay">
          <div className="cls-modal">
            <h2>Join a Class</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>Ask your teacher for the class code and enter it below.</p>
            <form onSubmit={handleJoin}>
              <div className="cls-form-group">
                <label>Class Code</label>
                <input
                  placeholder="e.g. AB12CD"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  style={{ textTransform: "uppercase", letterSpacing: "4px", fontSize: "18px", textAlign: "center" }}
                  maxLength={6}
                  required
                />
              </div>
              <div className="cls-modal-actions">
                <button type="button" className="cls-cancel-btn" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button type="submit" className="cls-submit-btn" disabled={joinLoading}>{joinLoading ? "Joining..." : "Join Class"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== SUBMIT ASSIGNMENT MODAL ====== */}
      {submitModal && (
        <div className="cls-modal-overlay">
          <div className="cls-modal">
            <h2>📝 Submit Assignment</h2>
            <div className="cls-sub-answer-box" style={{ marginBottom: "16px" }}>
              <label>Assignment</label>
              <p style={{ fontWeight: 600, color: "#111827" }}>{submitModal.post.title}</p>
              {submitModal.post.description && <p style={{ marginTop: "6px", color: "#6b7280", fontSize: "13px" }}>{submitModal.post.description}</p>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="cls-form-group">
                <label>Your Answer / Work</label>
                <textarea
                  rows="5"
                  placeholder={submitFiles.length > 0 ? "Add a comment (optional)..." : "Type your answer here..."}
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value)}
                  required={submitFiles.length === 0}
                />
              </div>
              <div className="cls-form-group">
                <label>Attach Files (optional)</label>
                <input type="file" multiple onChange={e => {
                  const files = Array.from(e.target.files);
                  if (files.length > 5) {
                    alert('Maximum 5 files allowed');
                    e.target.value = '';
                    return;
                  }
                  setSubmitFiles(files);
                }} accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx" />
                {submitFiles.length > 0 && <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>{submitFiles.length} file(s) selected</span>}
              </div>
              <div className="cls-modal-actions">
                <button type="button" className="cls-cancel-btn" onClick={() => setSubmitModal(null)}>Cancel</button>
                <button type="submit" className="cls-submit-btn" disabled={uploading}>
                  {uploading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== FILE PREVIEW MODAL ====== */}
      {previewFile && (
        <div className="cls-modal-overlay" onClick={() => setPreviewFile(null)} style={{ zIndex: 3000 }}>
          <div className="cls-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="cls-preview-header">
              <h3 style={{ margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1, paddingRight: "20px" }}>{previewFile.name}</h3>
              <button className="cls-close-btn" onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="cls-preview-body">
              {previewFile.type === "image" && <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block", margin: "0 auto" }} />}
              {previewFile.type === "video" && <video src={previewFile.url} controls style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", margin: "0 auto" }} />}
              {previewFile.type === "pdf" && <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "70vh", border: "none" }} />}
              {previewFile.type === "document" && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`} title={previewFile.name} style={{ width: "100%", height: "70vh", border: "none" }} />
              )}
            </div>
            <div className="cls-preview-footer">
              <a href={previewFile.url} target="_blank" rel="noreferrer" download className="cls-download-btn">⬇️ Download File</a>
            </div>
          </div>
        </div>
      )}

      {/* ====== PROFILE MODAL ====== */}
      {showProfileModal && (
        <div className="cls-modal-overlay">
          <div className="cls-modal" style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>My Profile</h2>
              <button className="cls-close-btn" style={{ fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px', border: '3px solid #e5e7eb' }}>
                {profileData.photo_url ? (
                  <img src={profileData.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '48px' }}>👤</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ cursor: 'pointer', color: '#2563eb', fontSize: '14px', fontWeight: '600' }}>
                  {profileSaving ? 'Uploading...' : 'Upload Photo'}
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleProfilePhotoUpload} disabled={profileSaving} />
                </label>
                {profileData.photo_url && (
                  <span style={{ cursor: 'pointer', color: '#ef4444', fontSize: '14px', fontWeight: '600' }} onClick={() => handleProfileUpdate({ photo_url: null })}>
                    Remove Photo
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate({}); }}>
              <div className="cls-form-group">
                <label>Name</label>
                <input value={profileData.full_name || studentName} disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="cls-form-group" style={{ flex: 1 }}>
                  <label>Student ID</label>
                  <input value={profileData.custom_id || studentId} disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                </div>
                <div className="cls-form-group" style={{ flex: 1 }}>
                  <label>Semester/Class</label>
                  <input value={profileData.class || 'N/A'} disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                </div>
              </div>

              <div className="cls-form-group">
                <label>Email</label>
                <input value={profileData.email || ''} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Enter email address" />
              </div>
              <div className="cls-form-group">
                <label>Phone</label>
                <input value={profileData.phone || ''} onChange={e => setProfileData({...profileData, phone: e.target.value})} placeholder="Enter phone number" />
              </div>
              <div className="cls-form-group">
                <label>Address</label>
                <input value={profileData.address || ''} onChange={e => setProfileData({...profileData, address: e.target.value})} placeholder="Enter address" />
              </div>
              <div className="cls-form-group">
                <label>Cast / Category</label>
                <input value={profileData.cast || ''} onChange={e => setProfileData({...profileData, cast: e.target.value})} placeholder="Enter cast or category" />
              </div>

              <div className="cls-modal-actions" style={{ marginTop: '20px' }}>
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

export default StudentDashboard;