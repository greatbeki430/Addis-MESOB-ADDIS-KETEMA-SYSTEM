// frontend/src/pages/gallery/CreateAlbumModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiFolder } from "react-icons/fi";
import { useLanguage } from "../../hooks/useLanguage";
import { galleryAPI } from "../../services/api";

const PROGRAM_TYPES = [
  "training",
  "workshop",
  "meeting",
  "ceremony",
  "field_visit",
  "awareness",
  "other",
];

const TYPE_LABEL_KEY = {
  training: "typeTraining",
  workshop: "typeWorkshop",
  meeting: "typeMeeting",
  ceremony: "typeCeremony",
  field_visit: "typeFieldVisit",
  awareness: "typeAwareness",
  other: "typeOther",
};

const CreateAlbumModal = ({ onClose, onCreated }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    description: "",
    programDate: "",
    location: "",
    programType: "other",
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t("gallery.albumTitle") + " required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await galleryAPI.createAlbum({
        title: form.title.trim(),
        description: form.description.trim(),
        programDate: form.programDate || undefined,
        location: form.location.trim(),
        programType: form.programType,
        tags: form.tags,
      });
      onCreated?.(res.data.album);
    } catch (e) {
      setError(e?.response?.data?.message || t("gallery.uploadError"));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2">
            <FiFolder /> {t("gallery.createAlbum")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gallery.albumTitle")} *
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("gallery.albumTitlePlaceholder")}
              className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gallery.albumDescription")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("gallery.albumDescriptionPlaceholder")}
              rows={3}
              className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gallery.programDate")}
              </label>
              <input
                type="date"
                value={form.programDate}
                onChange={(e) => set("programDate", e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gallery.programType")}
              </label>
              <select
                value={form.programType}
                onChange={(e) => set("programType", e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
              >
                {PROGRAM_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`gallery.${TYPE_LABEL_KEY[pt]}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gallery.programLocation")}
            </label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder={t("gallery.programLocationPlaceholder")}
              className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gallery.tags")}
            </label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder={t("gallery.tagsPlaceholder")}
              className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t("gallery.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t("gallery.uploading") : t("gallery.createAlbum")}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

export default CreateAlbumModal;
