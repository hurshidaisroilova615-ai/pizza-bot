import { useRef, useState } from "react";
import { uploadImage } from "../api";
import { useT } from "../i18n";

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.82;

// Photos come straight off a phone camera at several megabytes, which is far
// more than a product tile needs and adds up fast in the database. Shrink
// and re-encode in the browser so only a modest image ever leaves the page.
function compress(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "image/gif") return resolve(file);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Rasmni siqib bo'lmadi"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Rasmni o'qib bo'lmadi"));
    };
    img.src = objectUrl;
  });
}

export default function ImageField({ value, onChange }) {
  const { t } = useT();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const compressed = await compress(file);
      const { url } = await uploadImage(compressed);
      onChange(url);
    } catch (err) {
      setError(t(err.message));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="form-group">
      <label>{t("Mahsulot rasmi")}</label>

      <div className="image-field">
        {value ? (
          <img className="image-preview" src={value} alt="" />
        ) : (
          <div className="image-preview image-preview-empty">🖼</div>
        )}

        <div className="image-field-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t("Yuklanmoqda...") : value ? t("Rasmni almashtirish") : t("Rasm yuklash")}
          </button>
          {value && (
            <button type="button" className="btn btn-outline" onClick={() => onChange("")}>
              {t("O'chirish")}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      <input
        placeholder={t("yoki rasm havolasini shu yerga qo'ying")}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
