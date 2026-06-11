import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { btn, card, C, F, inp } from "../styles/theme";
import Field from "../components/ui/Field";
import Section from "../components/ui/Section";
import { exportForumReportToPDF } from "../utils/pdfExport";

// =============================================
// REUSABLE COMPONENT FOR DYNAMIC FIELDS
// =============================================
function DynamicFieldGroup({
  title,
  values,
  onAdd,
  onRemove,
  onUpdate,
  renderField,
  labelPrefix = "",
  placeholderPrefix = "",
}) {
  return (
    <Section title={title}>
      {values.map((value, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            {renderField ? (
              renderField(value, idx)
            ) : (
              <Field
                label={`${labelPrefix} ${idx + 1}`}
                value={value}
                onChange={(v) => onUpdate(idx, v)}
                placeholder={`${placeholderPrefix} ${idx + 1}`}
              />
            )}
          </div>

          {/* Remove button - shows only "-", text on hover */}
          {values.length > 1 && (
            <button
              onClick={() => onRemove(idx)}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                width: "32px",
                height: "32px",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative",
              }}
              title="Remove this item"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#b91c1c";
                e.currentTarget.style.width = "auto";
                e.currentTarget.style.padding = "0 12px";
                e.currentTarget.style.gap = "6px";
                // Add text on hover
                const span = e.currentTarget.querySelector(".button-text");
                if (span) span.style.display = "inline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.width = "32px";
                e.currentTarget.style.padding = "0";
                e.currentTarget.style.gap = "0";
                // Hide text on leave
                const span = e.currentTarget.querySelector(".button-text");
                if (span) span.style.display = "none";
              }}
            >
              <span style={{ fontSize: "16px" }}>−</span>
              <span
                className="button-text"
                style={{ display: "none", fontSize: "12px" }}
              >
                Remove
              </span>
            </button>
          )}
        </div>
      ))}

      {/* Add button - shows only "+", text on hover */}
      <button
        onClick={onAdd}
        style={{
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "8px",
          transition: "all 0.2s",
        }}
        title={`Add new ${title.toLowerCase()}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#059669";
          // Show text on hover
          const span = e.currentTarget.querySelector(".button-text");
          if (span) span.style.display = "inline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#10b981";
          // Hide text on leave
          const span = e.currentTarget.querySelector(".button-text");
          if (span) span.style.display = "none";
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span>
        <span
          className="button-text"
          style={{ display: "none", fontSize: "12px" }}
        >
          Add
        </span>
      </button>
    </Section>
  );
}

export default function ForumReport({ t, lang }) {
  const tf = t.forum;
  const [form, setForm] = useState({
    date: "",
    timeStart: "",
    timeEnd: "",
    present: [""],
    absent: [{ name: "", reason: "" }],
    prevResults: [""],
    topics: [""],
    explanation: "",
    gaps: [""],
    agreements: [""],
    signatures: [""],
  });
  const [submitted, setSubmitted] = useState(false);

  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const addItem = (field, defaultValue = "") => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const removeItem = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addAbsent = () => {
    setForm((prev) => ({
      ...prev,
      absent: [...prev.absent, { name: "", reason: "" }],
    }));
  };

  const removeAbsent = (index) => {
    setForm((prev) => ({
      ...prev,
      absent: prev.absent.filter((_, i) => i !== index),
    }));
  };

  const updateAbsent = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.absent];
      updated[index][field] = value;
      return { ...prev, absent: updated };
    });
  };

  if (submitted)
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "clamp(30px, 8vw, 60px) clamp(20px, 5vw, 40px)",
            background: C.white,
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <div
            style={{
              width: "clamp(50px, 15vw, 72px)",
              height: "clamp(50px, 15vw, 72px)",
              background: C.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(28px, 8vw, 36px)",
              color: "#fff",
              margin: "0 auto 18px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: "clamp(18px, 5vw, 22px)",
              fontWeight: 900,
              color: C.primary,
              fontFamily: F.serif,
              marginBottom: 8,
            }}
          >
            {tf.saved}
          </h2>
          <p
            style={{
              color: C.muted,
              marginBottom: 22,
              fontFamily: F.sans,
              fontSize: "clamp(12px, 3.5vw, 14px)",
            }}
          >
            {tf.savedSub}
          </p>
          <button style={btn.primary} onClick={() => setSubmitted(false)}>
            {tf.newReport}
          </button>
        </div>
      </div>
    );

  const g3Responsive = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "clamp(10px, 3vw, 16px)",
  };

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(12px, 3vw, 20px)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(16px, 5vw, 22px)",
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {tf.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
            borderRadius: 20,
            fontSize: "clamp(10px, 3vw, 11px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {t.year}
        </span>
      </div>

      <p
        style={{
          color: "#555",
          marginBottom: "clamp(16px, 4vw, 24px)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontFamily: F.sans,
          lineHeight: 1.4,
        }}
      >
        {tf.subtitle}
      </p>

      <div
        style={{
          background: C.white,
          borderRadius: 12,
          padding: "clamp(16px, 4vw, 28px)",
          boxShadow: "0 2px 16px #0003",
        }}
      >
        {/* Meeting Time Section */}
        <Section title={tf.meetingTime}>
          <div style={g3Responsive}>
            <Field
              label={tf.date}
              value={form.date}
              onChange={(v) => upd("date", v)}
              type="date"
            />
            <Field
              label={tf.startTime}
              value={form.timeStart}
              onChange={(v) => upd("timeStart", v)}
              type="time"
            />
            <Field
              label={tf.endTime}
              value={form.timeEnd}
              onChange={(v) => upd("timeEnd", v)}
              type="time"
            />
          </div>
        </Section>

        {/* Present Members */}
        <DynamicFieldGroup
          title={tf.presentMembers}
          values={form.present}
          onAdd={() => addItem("present", "")}
          onRemove={(idx) => removeItem("present", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.present];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, present: updated }));
          }}
          renderField={(value, idx) => (
            <Field
              label={`${idx + 1} ${tf.memberN}`}
              value={value}
              onChange={(v) => {
                const updated = [...form.present];
                updated[idx] = v;
                setForm((prev) => ({ ...prev, present: updated }));
              }}
              placeholder={`Member ${idx + 1} name`}
            />
          )}
        />

        {/* Absent Members - Horizontal layout with remove button aligned */}
        <Section title={tf.absentMembers}>
          {form.absent.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "clamp(12px, 4vw, 16px)",
                padding: "clamp(10px, 3vw, 12px)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(11px, 3.5vw, 12px)",
                  fontWeight: "bold",
                  color: "#6b7280",
                  marginBottom: "clamp(8px, 3vw, 12px)",
                }}
              >
                {tf.absentMemberLabel || "Absent Member"} #{idx + 1}
              </div>

              {/* Horizontal layout on mobile and desktop */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "clamp(10px, 3vw, 12px)",
                  alignItems: "flex-start",
                  padding: "0 clamp(4px, 2vw,8px)",
                }}
              >
                {/* Name Field */}
                <div
                  style={{
                    flex: "2",
                    minWidth: "120px",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Field
                    label={`${idx + 1} ${tf.name}`}
                    value={item.name}
                    onChange={(v) => updateAbsent(idx, "name", v)}
                    placeholder="Name"
                  />
                </div>

                {/* Reason Field */}
                <div
                  style={{
                    flex: "3",
                    minWidth: "120px",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Field
                    label={tf.reason}
                    value={item.reason}
                    onChange={(v) => updateAbsent(idx, "reason", v)}
                    placeholder="Reason for absence"
                  />
                </div>

                {/* Remove Button - horizontally aligned with fields */}
                {form.absent.length > 1 && (
                  <button
                    onClick={() => removeAbsent(idx)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      width: "32px",
                      height: "32px",
                      fontSize: "18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "28px", // Aligns with Field labels
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                    title="Remove this absent member"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#b91c1c";
                      e.currentTarget.style.width = "auto";
                      e.currentTarget.style.padding = "0 12px";
                      e.currentTarget.style.gap = "6px";
                      const span =
                        e.currentTarget.querySelector(".remove-text");
                      if (span) span.style.display = "inline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#dc2626";
                      e.currentTarget.style.width = "32px";
                      e.currentTarget.style.padding = "0";
                      e.currentTarget.style.gap = "0";
                      const span =
                        e.currentTarget.querySelector(".remove-text");
                      if (span) span.style.display = "none";
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>−</span>
                    <span
                      className="remove-text"
                      style={{ display: "none", fontSize: "12px" }}
                    >
                      Remove
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Button - only "+", text on hover */}
          <button
            onClick={addAbsent}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "clamp(8px, 3vw, 12px)",
              transition: "all 0.2s",
            }}
            title="Add absent member"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              const span = e.currentTarget.querySelector(".add-text");
              if (span) span.style.display = "inline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              const span = e.currentTarget.querySelector(".add-text");
              if (span) span.style.display = "none";
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span>
            <span
              className="add-text"
              style={{ display: "none", fontSize: "12px" }}
            >
              Add
            </span>
          </button>
        </Section>

        <DynamicFieldGroup
          title={tf.prevResults}
          values={form.prevResults}
          onAdd={() => addItem("prevResults", "")}
          onRemove={(idx) => removeItem("prevResults", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.prevResults];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, prevResults: updated }));
          }}
          labelPrefix="Result"
          placeholderPrefix="Result"
        />

        <DynamicFieldGroup
          title={tf.todayTopics}
          values={form.topics}
          onAdd={() => addItem("topics", "")}
          onRemove={(idx) => removeItem("topics", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.topics];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, topics: updated }));
          }}
          labelPrefix={tf.topic}
          placeholderPrefix="Topic"
        />

        {/* Explanation */}
        <Section title={tf.explanation}>
          <textarea
            style={{
              ...inp,
              resize: "vertical",
              minHeight: "clamp(80px, 20vw, 100px)",
              fontSize: "clamp(12px, 3vw, 13px)",
            }}
            rows={3}
            value={form.explanation}
            onChange={(e) => upd("explanation", e.target.value)}
            placeholder={tf.explanationPlaceholder}
          />
        </Section>

        {/* Gaps */}
        <DynamicFieldGroup
          title={tf.gaps}
          values={form.gaps}
          onAdd={() => addItem("gaps", "")}
          onRemove={(idx) => removeItem("gaps", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.gaps];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, gaps: updated }));
          }}
          labelPrefix="Gap"
          placeholderPrefix="Gap"
        />

        {/* Agreements */}
        <DynamicFieldGroup
          title={tf.agreements}
          values={form.agreements}
          onAdd={() => addItem("agreements", "")}
          onRemove={(idx) => removeItem("agreements", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.agreements];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, agreements: updated }));
          }}
          labelPrefix="Agreement"
          placeholderPrefix="Agreement"
        />

        {/* Signatures */}
        <Section title={tf.signatures}>
          {form.signatures.map((sig, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1 }}>
                <Field
                  label={`${idx + 1}${tf.signatureN}`}
                  value={sig}
                  onChange={(v) => {
                    const updated = [...form.signatures];
                    updated[idx] = v;
                    setForm((prev) => ({ ...prev, signatures: updated }));
                  }}
                  placeholder="Signature Line"
                />
              </div>
              {form.signatures.length > 1 && (
                <button
                  onClick={() => removeItem("signatures", idx)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    fontSize: "18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  title="Remove signature line"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                    e.currentTarget.style.width = "auto";
                    e.currentTarget.style.padding = "0 12px";
                    e.currentTarget.style.gap = "6px";
                    const span =
                      e.currentTarget.querySelector(".sig-remove-text");
                    if (span) span.style.display = "inline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.width = "32px";
                    e.currentTarget.style.padding = "0";
                    e.currentTarget.style.gap = "0";
                    const span =
                      e.currentTarget.querySelector(".sig-remove-text");
                    if (span) span.style.display = "none";
                  }}
                >
                  <span style={{ fontSize: "16px" }}>−</span>
                  <span
                    className="sig-remove-text"
                    style={{ display: "none", fontSize: "12px" }}
                  >
                    Remove
                  </span>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addItem("signatures", "")}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              transition: "all 0.2s",
            }}
            title="Add signature line"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              const span = e.currentTarget.querySelector(".sig-add-text");
              if (span) span.style.display = "inline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              const span = e.currentTarget.querySelector(".sig-add-text");
              if (span) span.style.display = "none";
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span>
            <span
              className="sig-add-text"
              style={{ display: "none", fontSize: "12px" }}
            >
              Add
            </span>
          </button>
        </Section>

        {/* Action Buttons */}
        <div
          style={{
            textAlign: "center",
            marginTop: "clamp(20px, 5vw, 28px)",
            display: "flex",
            gap: "clamp(10px, 3vw, 16px)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "clamp(8px, 2.5vw, 11px) clamp(16px, 5vw, 26px)",
              borderRadius: 8,
              fontSize: "clamp(12px, 3.5vw, 14px)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
            }}
            onClick={() => exportForumReportToPDF(form, t, lang)}
          >
            📄 Export PDF
          </button>
          <button style={btn.primary} onClick={() => setSubmitted(true)}>
            {tf.save}
          </button>
        </div>
      </div>
    </div>
  );
}
