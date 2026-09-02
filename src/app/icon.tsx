import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#131312",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <path
            d="M20 2C20 12.8 12.8 20 2 20C12.8 20 20 27.2 20 38C20 27.2 27.2 20 38 20C27.2 20 20 12.8 20 2Z"
            fill="#8fd19e"
          />
        </svg>
      </div>
    ),
    size,
  );
}
