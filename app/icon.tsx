import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f1e8",
          borderRadius: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 36,
            height: 42,
            borderRadius: 12,
            background: "#fff9f1",
            border: "2px solid #ccb8a0",
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 4,
              top: 4,
              bottom: 4,
              width: 4,
              borderRadius: 99,
              background: "#6f8575",
            }}
          />
          <div
            style={{
              color: "#8c735b",
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1,
              marginLeft: 6,
            }}
          >
            J
          </div>
        </div>
      </div>
    ),
    size,
  );
}
