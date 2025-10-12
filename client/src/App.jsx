import React, { useState, useRef, useEffect } from "react";
import { buildPptxFromJson } from "./pptGenerator";
import axios from "axios";
import "./App.css";

function ThinkingDots() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pptBlobUrl, setPptBlobUrl] = useState(null);
  const [aiJson, setAiJson] = useState(null);
  const [editedJson, setEditedJson] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [presentationTitle, setPresentationTitle] = useState("");
  const loadingRef = useRef(false);

  // Bold formatting for **text**
  const renderBullet = (bullet) => {
    const parts = bullet.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  async function sendPrompt(prompt, replaceMsgId = null) {
    if (loadingRef.current || !prompt.trim()) return;
    loadingRef.current = true;

    const userMsg = { role: "user", text: prompt, id: Date.now() };
    if (replaceMsgId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === replaceMsgId ? userMsg : m))
      );
    } else {
      setMessages((prev) => [...prev, userMsg]);
    }

    setPptBlobUrl(null);
    setInput("");

    const thinkingId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Thinking...",
        id: thinkingId,
        isThinking: true,
        thoughts: "Generating slides...",
      },
    ]);

    try {
      const { data } = await axios.post("https://ai-ppt-app.onrender.com/api/generate", {
        prompt,
      });
      const candidate = data?.candidates?.[0]?.content;
      let rawText =
        candidate?.text ||
        (Array.isArray(candidate?.parts)
          ? candidate.parts.map((p) => p.text).join("\n\n")
          : "");

      const slides = rawText
        .split("---")
        .map((slide) => {
          const lines = slide
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          let title = "",
            bullets = [];
          lines.forEach((line, idx) => {
            const clean = line
              .replace(/^#+\s*/, "")
              .replace(/^\*+\s*/, "")
              .replace(/\*+$/, "")
              .trim();
            if (idx === 0) title = clean;
            else bullets.push(clean);
          });
          bullets = bullets.slice(0, 4);
          return { title, bullets };
        })
        .filter((s) => s.title && s.bullets.length);

      const mainTitle = slides[0]?.title || prompt;
      setPresentationTitle(mainTitle);

      const structured = {
        title: mainTitle,
        subtitle: "Generated Presentation",
        slides,
      };

      setAiJson(structured);
      setEditedJson(structured);

      // Replace thinking message with success
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                text: `Generated ${slides.length} slides successfully.`,
                isThinking: false,
                data: structured,
              }
            : m
        )
      );

      const blob = await buildPptxFromJson(structured, selectedTheme);
      setPptBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.isThinking
            ? {
                ...m,
                text: "Error: " + (err.message || err),
                isThinking: false,
              }
            : m
        )
      );
    } finally {
      loadingRef.current = false;
    }
  }

  const handleEditMessage = (id) => {
    setEditingMessageId(id);
  };

  const handleSaveMessage = (id, newText) => {
    setEditingMessageId(null);
    sendPrompt(newText, id); // re-generate with new prompt
  };

  const handleEditSlide = (i, field, value) => {
    const updated = { ...editedJson };
    updated.slides[i][field] = value;
    setEditedJson(updated);
  };

  const handleEditBullet = (i, j, value) => {
    const updated = { ...editedJson };
    updated.slides[i].bullets[j] = value;
    setEditedJson(updated);
  };

  const saveEdits = async () => {
    setAiJson(editedJson);
    const blob = await buildPptxFromJson(editedJson, selectedTheme);
    setPptBlobUrl(URL.createObjectURL(blob));
    setIsEditing(false);
  };

  const handleThemeChange = async (newTheme) => {
    setSelectedTheme(newTheme);
    if (editedJson || aiJson) {
      const blob = await buildPptxFromJson(editedJson || aiJson, newTheme);
      setPptBlobUrl(URL.createObjectURL(blob));
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>AI PPT Generator</h1>
          {pptBlobUrl && (
            <div className="header-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "View Slides" : "Edit Presentation"}
              </button>
              <a
                href={pptBlobUrl}
                download={`${presentationTitle || "presentation"}.pptx`}
                className="btn-primary"
              >
                Download PPTX
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="main-container">
        {/* Chat Section */}
        <div className="chat-section">
          {messages.length === 0 && (
            <div className="welcome-screen">
              <h2>Hello! 👋</h2>
              <p>What do you want me to generate today?</p>
            </div>
          )}

          <div className="messages-container">
            {messages.map((m) => (
              <div key={m.id} className={`message-bubble ${m.role}`}>
                <div className="message-header">
                  <span className="message-role">
                    {m.role === "user" ? "You" : "AI"}
                  </span>
                </div>

                {m.isThinking ? (
                  <div className="thinking-box">
                    <strong>AI is thinking<ThinkingDots /></strong>
                    <p>{m.thoughts}</p>
                  </div>
                ) : editingMessageId === m.id ? (
                  <div className="edit-container">
                    <textarea
                      defaultValue={m.text}
                      id={`edit-${m.id}`}
                      className="edit-textarea"
                    />
                    <div className="edit-actions">
                      <button
                        className="btn-save"
                        onClick={() =>
                          handleSaveMessage(
                            m.id,
                            document.getElementById(`edit-${m.id}`).value
                          )
                        }
                      >
                        Save & Re-generate
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingMessageId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="message-text">{m.text}</p>
                    {m.role === "user" && (
                      <button
                        className="btn-edit-inline"
                        onClick={() => handleEditMessage(m.id)}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <button className="btn-attachment">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendPrompt(input)}
                placeholder="Start with a topic, we'll turn it into slides!"
                disabled={loadingRef.current}
                className="chat-input"
              />
              <button
                onClick={() => sendPrompt(input)}
                disabled={loadingRef.current || !input.trim()}
                className="btn-send"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            {!input && (
              <div className="input-tip">
                Tip: Ask for "6 slides about Cloud Computing with examples"
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {pptBlobUrl && aiJson && (
          <div className="preview-panel">
            <div className="preview-header">
              <h3>Presentation Preview</h3>
              <div className="theme-selector">
                <label>Theme:</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="theme-dropdown"
                >
                  <option value="blue">Blue Professional</option>
                  <option value="purple">Purple Modern</option>
                  <option value="green">Green Fresh</option>
                  <option value="orange">Orange Vibrant</option>
                </select>
              </div>
            </div>

            {!isEditing ? (
              <div className="slides-list">
                {aiJson.slides.map((slide, i) => (
                  <div key={i} className="slide-card">
                    <div className="slide-header">
                      <span className="slide-number">SLIDE {i + 1}</span>
                    </div>
                    <h4 className="slide-title">{slide.title}</h4>
                    <ul className="slide-bullets">
                      {slide.bullets.map((b, j) => (
                        <li key={j}>
                          <span className="bullet-text">{renderBullet(b)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="slides-editor">
                {editedJson.slides.map((slide, i) => (
                  <div key={i} className="slide-edit-card">
                    <div className="slide-edit-header">
                      <span className="slide-number">SLIDE {i + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        handleEditSlide(i, "title", e.target.value)
                      }
                      className="slide-title-input"
                      placeholder="Slide title"
                    />
                    <div className="slide-bullets-edit">
                      {slide.bullets.map((b, j) => (
                        <div key={j} className="bullet-edit">
                          <span className="bullet-dot">•</span>
                          <input
                            type="text"
                            value={b}
                            onChange={(e) =>
                              handleEditBullet(i, j, e.target.value)
                            }
                            className="bullet-input"
                            placeholder={`Bullet point ${j + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="btn-save-all" onClick={saveEdits}>
                  Save Changes
                </button>
              </div>
            )}

            <div className="preview-footer">
              <div className="slides-status">
                <span className="status-icon">✓</span>
                <span>{aiJson.slides.length} slides ready</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
//end --