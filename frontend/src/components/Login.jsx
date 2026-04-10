import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

/* ═══════════════════════════════════════════════
   PUPIL — Simple dot that tracks mouse
   ═══════════════════════════════════════════════ */
const Pupil = ({ size = 12, maxDistance = 5, color = "#1a1a2e", forceLookX, forceLookY }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const getPos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const pos = getPos();
  return (
    <div ref={ref} className="pupil" style={{
      width: size, height: size, backgroundColor: color,
      transform: `translate(${pos.x}px, ${pos.y}px)`,
    }} />
  );
};

/* ═══════════════════════════════════════════════
   EYEBALL — White circle with a tracking pupil
   ═══════════════════════════════════════════════ */
const EyeBall = ({
  size = 48, pupilSize = 16, maxDistance = 10,
  eyeColor = "white", pupilColor = "#1a1a2e",
  isBlinking = false, forceLookX, forceLookY,
}) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const getPos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const pos = getPos();
  return (
    <div ref={ref} className="eyeball" style={{
      width: size, height: isBlinking ? 2 : size,
      backgroundColor: eyeColor,
    }}>
      {!isBlinking && (
        <div className="pupil" style={{
          width: pupilSize, height: pupilSize,
          backgroundColor: pupilColor,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   EYE SVG ICONS
   ═══════════════════════════════════════════════ */
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ═══════════════════════════════════════════════
   MAIN LOGIN COMPONENT
   ═══════════════════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mouse track state
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Animation states
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  // Refs for character body lean
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  // Global mouse tracking
  useEffect(() => {
    const handler = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Random blinking — purple
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // Random blinking — black
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // Characters look at each other when user starts typing
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  // Purple peeks sneakily when password is revealed
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setIsPurplePeeking(false);
  }, [password, showPassword, isPurplePeeking]);

  // Calculate character lean towards mouse
  const calcLean = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 3;
    const dx = mouseX - cx, dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pp = calcLean(purpleRef);
  const bp = calcLean(blackRef);
  const yp = calcLean(yellowRef);
  const op = calcLean(orangeRef);

  const hidingEyes = password.length > 0 && !showPassword;
  const peekingMode = password.length > 0 && showPassword;

  // ─── Login handler ───
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userId", userId);
        if (data.department) localStorage.setItem("userDepartment", data.department);

        if (data.role === "Student") navigate("/student");
        else if (data.role === "Admin") navigate("/admin");
        else if (data.role === "Faculty") navigate("/faculty");
        else if (data.role === "Librarian") navigate("/librarian");
        else if (data.role === "Peon") navigate("/peon");
        else alert(`Dashboard for ${data.role} is coming soon.`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ═══════════ LEFT PANEL — ANIMATED CHARACTERS ═══════════ */}
      <div className="login-left-panel">
        <div className="left-deco-1" />
        <div className="left-deco-2" />

        <div className="left-brand">
          <div className="left-brand-icon">🎓</div>
          <span>Smart Campus</span>
        </div>

        <div className="characters-area">
          <div className="characters-stage">

            {/* ── PURPLE CHARACTER (tall, back) ── */}
            <div
              ref={purpleRef}
              className="character char-purple"
              style={{
                height: (isTyping || hidingEyes) ? 440 : 390,
                transform: peekingMode
                  ? "skewX(0deg)"
                  : (isTyping || hidingEyes)
                    ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)`
                    : `skewX(${pp.bodySkew || 0}deg)`,
              }}
            >
              <div className="char-eyes" style={{
                gap: 30,
                left: peekingMode ? 20 : isLookingAtEachOther ? 55 : 45 + pp.faceX,
                top: peekingMode ? 35 : isLookingAtEachOther ? 65 : 40 + pp.faceY,
              }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
                  forceLookX={peekingMode ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={peekingMode ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
                  forceLookX={peekingMode ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={peekingMode ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* ── BLACK CHARACTER (mid-height, middle) ── */}
            <div
              ref={blackRef}
              className="character char-black"
              style={{
                height: 300,
                transform: peekingMode
                  ? "skewX(0deg)"
                  : isLookingAtEachOther
                    ? `skewX(${(bp.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || hidingEyes)
                      ? `skewX(${(bp.bodySkew || 0) * 1.5}deg)`
                      : `skewX(${bp.bodySkew || 0}deg)`,
              }}
            >
              <div className="char-eyes" style={{
                gap: 22,
                left: peekingMode ? 10 : isLookingAtEachOther ? 32 : 26 + bp.faceX,
                top: peekingMode ? 28 : isLookingAtEachOther ? 12 : 32 + bp.faceY,
              }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                  forceLookX={peekingMode ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={peekingMode ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                  forceLookX={peekingMode ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={peekingMode ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* ── ORANGE CHARACTER (dome, front-left) ── */}
            <div ref={orangeRef} className="character char-orange"
              style={{ transform: peekingMode ? "skewX(0deg)" : `skewX(${op.bodySkew || 0}deg)` }}>
              <div className="char-eyes" style={{
                gap: 30,
                left: peekingMode ? 50 : 78 + (op.faceX || 0),
                top: peekingMode ? 85 : 85 + (op.faceY || 0),
              }}>
                <Pupil size={12} maxDistance={5} forceLookX={peekingMode ? -5 : undefined} forceLookY={peekingMode ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} forceLookX={peekingMode ? -5 : undefined} forceLookY={peekingMode ? -4 : undefined} />
              </div>
            </div>

            {/* ── YELLOW CHARACTER (dome, front-right) ── */}
            <div ref={yellowRef} className="character char-yellow"
              style={{ transform: peekingMode ? "skewX(0deg)" : `skewX(${yp.bodySkew || 0}deg)` }}>
              <div className="char-eyes" style={{
                gap: 22,
                left: peekingMode ? 20 : 48 + (yp.faceX || 0),
                top: peekingMode ? 35 : 38 + (yp.faceY || 0),
              }}>
                <Pupil size={12} maxDistance={5} forceLookX={peekingMode ? -5 : undefined} forceLookY={peekingMode ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} forceLookX={peekingMode ? -5 : undefined} forceLookY={peekingMode ? -4 : undefined} />
              </div>
              <div className="char-mouth" style={{
                left: peekingMode ? 10 : 36 + (yp.faceX || 0),
                top: peekingMode ? 88 : 84 + (yp.faceY || 0),
              }} />
            </div>

          </div>
        </div>


      </div>

      {/* ═══════════ RIGHT PANEL — LOGIN FORM ═══════════ */}
      <div className="login-right-panel">
        <div className="login-form-container">

          <div className="mobile-brand">
            <div className="mobile-brand-icon">🎓</div>
            <span>Smart Campus</span>
          </div>

          <div className="login-header">
            <h1>Welcome back!</h1>
            <p>Please enter your Campus ID to continue</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="campus-id">Student / Employee ID</label>
              <input
                id="campus-id"
                type="text"
                placeholder="e.g. 24DCE001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>



            {error && <div className="login-error">⚠️ {error}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? (<><span className="btn-spinner" />Signing in...</>) : "Sign In"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;