/* eslint-disable no-undef */
// ════════════════════════════════════════════════════════════
// pages/ForumReport
// ════════════════════════════════════════════════════════════
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { btn, card, C, F } from "../styles/theme";
import Field from "../components/ui/Field";
import Section from "../components/ui/Section";
import { exportForumReportToPDF } from "../utils/pdfExport";
export default function ForumReport({ t }) {
  const tf = t.forum;
  const [form, setForm] = useState({
    date: "",
    timeStart: "",
    timeEnd: "",
    present: Array(7).fill(""),
    absent: Array(4).fill(""),
    absentReason: Array(4).fill(""),
    prevResults: ["", ""],
    topics: ["", "", "", ""],
    explanation: "",
    gaps: ["", ""],
    agreements: ["", ""],
  });
  const [submitted, setSubmitted] = useState(false);
  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const updArr = (f, i, v) =>
    setForm((p) => {
      const a = [...p[f]];
      a[i] = v;
      return { ...p, [f]: a };
    });

  if (submitted)
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: C.white,
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: C.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              color: "#fff",
              margin: "0 auto 18px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: C.primary,
              fontFamily: F.serif,
              marginBottom: 8,
            }}
          >
            {tf.saved}
          </h2>
          <p style={{ color: C.muted, marginBottom: 22, fontFamily: F.sans }}>
            {tf.savedSub}
          </p>
          <button style={btn.primary} onClick={() => setSubmitted(false)}>
            {tf.newReport}
          </button>
        </div>
      </div>
    );

  const g3 = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 };
  const g2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 8,
  };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
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
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {t.year}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 24,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {tf.subtitle}
      </p>

      <div
        style={{
          background: C.white,
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 2px 16px #0003",
        }}
      >
        <Section title={tf.meetingTime}>
          <div style={g3}>
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

        <Section title={tf.presentMembers}>
          <div style={g3}>
            {form.present.map((v, i) => (
              <Field
                key={i}
                label={`${i + 1}${tf.memberN}`}
                value={v}
                onChange={(val) => updArr("present", i, val)}
              />
            ))}
          </div>
        </Section>

        <Section title={tf.absentMembers}>
          {form.absent.map((_, i) => (
            <div key={i} style={g2}>
              <Field
                label={`${i + 1} ${tf.name}`}
                value={form.absent[i]}
                onChange={(v) => updArr("absent", i, v)}
              />
              <Field
                label={tf.reason}
                value={form.absentReason[i]}
                onChange={(v) => updArr("absentReason", i, v)}
              />
            </div>
          ))}
        </Section>

        <Section title={tf.prevResults}>
          {form.prevResults.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("prevResults", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.todayTopics}>
          {form.topics.map((v, i) => (
            <Field
              key={i}
              label={`${tf.topic} ${i + 1}`}
              value={v}
              onChange={(val) => updArr("topics", i, val)}
            />
          ))}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                fontFamily: F.sans,
              }}
            >
              {tf.standingAgendas}
            </span>
            {t.agendas.slice(0, 4).map((a, i) => (
              <label
                key={i}
                style={{
                  fontSize: 11,
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: F.sans,
                }}
              >
                <input type="checkbox" /> {a}
              </label>
            ))}
          </div>
        </Section>

        <Section title={tf.explanation}>
          <textarea
            style={{ ...inp, resize: "vertical", minHeight: 80 }}
            rows={3}
            value={form.explanation}
            onChange={(e) => upd("explanation", e.target.value)}
            placeholder={tf.explanationPlaceholder}
          />
        </Section>

        <Section title={tf.gaps}>
          {form.gaps.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("gaps", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.agreements}>
          {form.agreements.map((v, i) => (
            <Field
              key={i}
              label={`${i + 1}.`}
              value={v}
              onChange={(val) => updArr("agreements", i, val)}
            />
          ))}
        </Section>

        <Section title={tf.signatures}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Field
                key={n}
                label={`${n}${tf.signatureN}`}
                value=""
                onChange={() => {}}
              />
            ))}
          </div>
        </Section>

        {/* <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={btn.primary} onClick={() => setSubmitted(true)}>
            {tf.save}
          </button>
        </div> */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "11px 26px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
            }}
            onClick={() => exportForumReportToPDF(form, t, 1)}
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
